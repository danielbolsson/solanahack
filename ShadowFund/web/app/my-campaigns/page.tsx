'use client';

import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import idl from '../../idl/shadow_fund.json';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

const PROGRAM_Id = new PublicKey("3UnENRqs8b2EVZAkUaWLmKwyTL7ecpuGhCLrsT4cjsdW");

export default function MyCampaigns() {
    const { connection } = useConnection();
    const wallet = useWallet();
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (wallet.connected) {
            fetchMyCampaigns();
        } else {
            setCampaigns([]);
        }
    }, [wallet.connected]);

    const fetchMyCampaigns = async () => {
        try {
            setLoading(true);
            // @ts-ignore
            const provider = new AnchorProvider(connection, wallet, {});
            // @ts-ignore
            const program = new Program(idl as any, provider);

            // Fetch all campaigns
            const allCampaigns = await program.account.campaign.all();

            // Filter by owner
            const myCampaigns = allCampaigns.filter(c =>
                c.account.owner.toString() === wallet.publicKey?.toString()
            );

            setCampaigns(myCampaigns);
        } catch (error) {
            console.error("Error fetching campaigns:", error);
            toast.error("Failed to load your campaigns");
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async (campaignPubkey: PublicKey, campaignAccount: any) => {
        if (!wallet.publicKey) {
            toast.error("Wallet not connected");
            return;
        }
        const toastId = toast.loading("Processing withdrawal...");
        try {
            // @ts-ignore
            const provider = new AnchorProvider(connection, wallet, {});
            // @ts-ignore
            const program = new Program(idl, PROGRAM_Id, provider);

            const [configPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("config")],
                PROGRAM_Id
            );

            // Fetch config to get treasury
            const configAccount = await program.account.platformConfig.fetch(configPda);

            const tx = await program.methods.withdraw()
                .accounts({
                    campaign: campaignPubkey,
                    config: configPda,
                    treasury: configAccount.treasury,
                    owner: wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId
                })
                .rpc();

            console.log("Withdraw Tx:", tx);
            toast.success("Withdrawal successful! Funds transferred.", { id: toastId });
            fetchMyCampaigns(); // Refresh list
        } catch (err: any) {
            console.error("Result", err);

            let msg = "Withdrawal failed";
            if (err.message) {
                if (err.message.includes("TargetNotMet")) msg = "Campaign goal not yet reached.";
                if (err.message.includes("Inventory")) msg = "No funds to withdraw."; // Generic error map
            }
            toast.error(msg, { id: toastId });
        }
    };

    const handleClose = async (campaignPubkey: PublicKey) => {
        if (!wallet.publicKey) return;

        if (!confirm("Are you sure you want to close this campaign? This will reclaim the rent to your wallet. This action cannot be undone.")) {
            return;
        }

        const toastId = toast.loading("Closing campaign...");
        try {
            // @ts-ignore
            const provider = new AnchorProvider(connection, wallet, {});

            // @ts-ignore
            const program = new Program(idl, provider);

            const tx = await program.methods.cancelCampaign()
                .accounts({
                    campaign: campaignPubkey,
                    owner: wallet.publicKey,
                })
                .rpc();

            console.log("Close Tx:", tx);
            toast.success("Campaign closed! Rent reclaimed.", { id: toastId });
            fetchMyCampaigns();
        } catch (err: any) {
            console.error("Error closing campaign:", err);
            toast.error("Failed to close campaign: " + (err.message || err.toString()), { id: toastId });
        }
    };

    if (!wallet.connected) {
        return (
            <div className="min-h-screen pt-32 pb-20 flex flex-col items-center justify-center text-center px-4">
                <div className="bg-[var(--color-charcoal-800)] p-8 rounded-2xl border border-[var(--color-charcoal-700)] max-w-md w-full">
                    <div className="w-16 h-16 bg-[var(--color-charcoal-900)] rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Connect Wallet</h2>
                    <p className="text-[var(--color-text-secondary)] mb-0">Please connect your wallet to view your campaigns.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-32 pb-20">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold text-white">My Campaigns</h1>
                <Link href="/create" className="bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-500)] text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                    + New Campaign
                </Link>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2].map(i => (
                        <div key={i} className="h-64 bg-[var(--color-charcoal-800)] rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            ) : campaigns.length === 0 ? (
                <div className="text-center py-20 bg-[var(--color-charcoal-800)]/30 rounded-2xl border border-dashed border-[var(--color-charcoal-700)]">
                    <p className="text-[var(--color-text-secondary)] text-lg mb-4">You haven't launched any campaigns yet.</p>
                    <Link href="/create" className="text-[var(--color-teal-400)] hover:text-[var(--color-teal-300)] underline">Launch your first campaign</Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {campaigns.map((camp) => {
                        const targetMet = camp.account.currentAmount.toNumber() >= camp.account.targetAmount.toNumber();
                        const raisedSOL = camp.account.currentAmount.toNumber() / LAMPORTS_PER_SOL;
                        const targetSOL = camp.account.targetAmount.toNumber() / LAMPORTS_PER_SOL;
                        const progress = (raisedSOL / targetSOL) * 100;

                        const now = new Date().getTime();
                        const deadlineDate = new Date(camp.account.deadline.toNumber() * 1000).getTime();
                        const isExpired = deadlineDate <= now;
                        const canClose = isExpired && !targetMet && camp.account.currentAmount.toNumber() === 0;

                        return (
                            <div key={camp.publicKey.toString()} className="bg-[var(--color-charcoal-800)]/50 rounded-xl p-6 border border-[var(--color-charcoal-700)] flex flex-col md:flex-row items-center justify-between gap-6 hover:border-[var(--color-charcoal-600)] transition-colors">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-bold text-white truncate">{camp.account.name}</h3>
                                        {targetMet ? (
                                            <span className="bg-green-900/50 text-green-400 text-xs px-2 py-1 rounded border border-green-500/20">Funded</span>
                                        ) : isExpired ? (
                                            <span className="bg-red-900/50 text-red-400 text-xs px-2 py-1 rounded border border-red-500/20">Ended</span>
                                        ) : (
                                            <span className="bg-yellow-900/50 text-yellow-400 text-xs px-2 py-1 rounded border border-yellow-500/20">Active</span>
                                        )}
                                    </div>
                                    <p className="text-[var(--color-text-secondary)] text-sm mb-4 line-clamp-1">{camp.account.description}</p>

                                    <div className="w-full bg-[var(--color-charcoal-900)] rounded-full h-2 mb-2">
                                        <div className="bg-[var(--color-teal-500)] h-2 rounded-full" style={{ width: `${Math.min(100, progress)}%` }}></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-[var(--color-text-tertiary)] font-mono">
                                        <span>{raisedSOL.toFixed(2)} SOL raised</span>
                                        <span>{targetSOL.toFixed(2)} SOL goal</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 shrink-0">
                                    <Link href={`/campaign/${camp.publicKey.toString()}`} className="text-[var(--color-text-secondary)] hover:text-white text-sm font-medium px-4 py-2">
                                        View
                                    </Link>
                                    {targetMet && camp.account.currentAmount.toNumber() > 0 && (
                                        <button
                                            onClick={() => handleWithdraw(camp.publicKey, camp.account)}
                                            className="bg-[var(--color-teal-600)] hover:bg-[var(--color-teal-500)] text-white px-5 py-2 rounded-lg text-sm font-bold shadow-lg shadow-teal-900/20 hover:shadow-teal-500/20 transition-all"
                                        >
                                            Withdraw Funds
                                        </button>
                                    )}
                                    {canClose && (
                                        <button
                                            onClick={() => handleClose(camp.publicKey)}
                                            className="bg-red-900/50 hover:bg-red-900 text-red-200 hover:text-white px-5 py-2 rounded-lg text-sm font-bold border border-red-500/30 transition-all"
                                        >
                                            Close Campaign
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
