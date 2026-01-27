'use client';

import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import idl from '../../idl/shadow_fund.json';
import { toast } from 'react-hot-toast';

const PROGRAM_Id = new PublicKey("3UnENRqs8b2EVZAkUaWLmKwyTL7ecpuGhCLrsT4cjsdW");

interface RewardItem {
    backerPda: PublicKey;
    campaignKey: PublicKey;
    campaignName: string;
    tierName: string;
    tierDescription: string;
    amountPaid: number;
    date: string; // Placeholder or fetched if we stored timestamp
}

export default function MyRewards() {
    const { connection } = useConnection();
    const wallet = useWallet();
    const [rewards, setRewards] = useState<RewardItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (wallet.connected) {
            fetchRewards();
        }
    }, [wallet.connected]);

    const fetchRewards = async () => {
        setLoading(true);
        try {
            // @ts-ignore
            const provider = new AnchorProvider(connection, wallet, {});
            // @ts-ignore
            const program = new Program(idl as any, provider);

            // Fetch Backer accounts where backer == wallet.publicKey
            // Discriminator (8) + Campaign (32) = Offset 40 for Backer
            const backerAccounts = await program.account.backer.all([
                {
                    memcmp: {
                        offset: 40,
                        bytes: wallet.publicKey!.toBase58(),
                    },
                },
            ]);

            console.log("Found backer accounts:", backerAccounts);

            const items: RewardItem[] = [];

            for (const acc of backerAccounts) {
                try {
                    const campaignKey = acc.account.campaign;
                    const tierIndex = acc.account.tierIndex;

                    // Fetch Campaign details to get name and tier info
                    const campaignAccount = await program.account.campaign.fetch(campaignKey);

                    let tierName = "Unknown Tier";
                    let tierDescription = "No description available";

                    if (campaignAccount.tiers && campaignAccount.tiers[tierIndex]) {
                        tierName = campaignAccount.tiers[tierIndex].name;
                        tierDescription = campaignAccount.tiers[tierIndex].description;
                    }

                    items.push({
                        backerPda: acc.publicKey,
                        campaignKey: campaignKey,
                        campaignName: campaignAccount.name,
                        tierName: tierName,
                        tierDescription: tierDescription,
                        amountPaid: acc.account.amountPaid.toNumber() / LAMPORTS_PER_SOL,
                        date: "Just now"
                    });
                } catch (err) {
                    console.error("Error fetching campaign details for reward:", err);
                }
            }

            setRewards(items);

        } catch (err) {
            console.error("Error fetching rewards:", err);
            toast.error("Failed to load rewards");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-20">
            <div className="max-w-6xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">My Rewards</h1>
                    <p className="text-[var(--color-text-secondary)] text-xl">Your collection of backed projects and claimed perks.</p>
                </div>

                {!wallet.connected ? (
                    <div className="text-center p-10 bg-[var(--color-charcoal-900)] rounded-2xl border border-[var(--color-charcoal-700)]">
                        <p className="text-[var(--color-text-secondary)]">Connect your wallet to view your rewards.</p>
                    </div>
                ) : loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block w-8 h-8 border-4 border-[var(--color-teal-500)] border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-[var(--color-teal-400)]">Locating your rewards...</p>
                    </div>
                ) : rewards.length === 0 ? (
                    <div className="text-center p-10 bg-[var(--color-charcoal-900)] rounded-2xl border border-[var(--color-charcoal-700)]">
                        <p className="text-[var(--color-text-secondary)] mb-4">You haven't backed any campaigns with rewards yet.</p>
                        <a href="/" className="text-[var(--color-teal-400)] hover:underline">Explore Campaigns</a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rewards.map((reward, idx) => (
                            <div key={idx} className="bg-[var(--color-charcoal-900)] rounded-xl border border-[var(--color-charcoal-700)] overflow-hidden hover:border-[var(--color-teal-500)] transition-all group shadow-lg">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-[var(--color-teal-900)] text-[var(--color-teal-400)] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                            Accessed
                                        </div>
                                        <div className="text-[var(--color-text-tertiary)] text-xs font-mono">
                                            {reward.amountPaid} SOL
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-[var(--color-teal-400)] transition-colors">
                                        {reward.tierName}
                                    </h3>
                                    <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                                        from <span className="font-bold text-white">{reward.campaignName}</span>
                                    </p>

                                    <div className="bg-[var(--color-charcoal-800)] p-4 rounded-lg mb-6 h-24 overflow-y-auto custom-scrollbar">
                                        <p className="text-sm text-[var(--color-text-secondary)] italic">
                                            "{reward.tierDescription}"
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => toast.success("Access Granted! (Simulated Token Gating)")}
                                        title="In production, this button would trigger a wallet signature to access exclusive content like Discord channels or file downloads."
                                        className="w-full py-3 bg-[var(--color-charcoal-800)] hover:bg-[var(--color-teal-600)] text-white font-bold rounded-lg transition-colors border border-[var(--color-charcoal-600)] hover:border-[var(--color-teal-500)] flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                        Access Content
                                    </button>
                                </div>
                                <div className="px-6 py-3 bg-[var(--color-charcoal-800)] border-t border-[var(--color-charcoal-700)] flex justify-between items-center text-xs">
                                    <span className="text-[var(--color-text-tertiary)]">Receipt ID</span>
                                    <span className="font-mono text-[var(--color-text-secondary)]" title={reward.backerPda.toString()}>
                                        {reward.backerPda.toString().substring(0, 8)}...
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
