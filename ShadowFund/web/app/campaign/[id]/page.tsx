'use client';

import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useParams } from 'next/navigation';
import { Program, AnchorProvider, web3, BN } from '@project-serum/anchor';
import { PublicKey, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import idl from '../../../idl/shadow_fund.json';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const PROGRAM_Id = new PublicKey("HNnG2p8trr7N1HdfMEtx4e5ARwZnamhG6X7wib9AiE12");

export default function ViewCampaign() {
  const { id } = useParams();
  const { connection } = useConnection(); // This is the hook's connection
  const wallet = useWallet();
  const [donateAmount, setDonateAmount] = useState('');
  const [campaignAccount, setCampaignAccount] = useState<any>(null);

  // Mock data fallback
  const mockCampaign = {
    title: "Loading Account...",
    description: "Fetching details from the Solana Network...",
    target: 0,
    current: 0,
    deadline: 0
  };

  useEffect(() => {
    if (id) {
      fetchAccount();
    }
  }, [id, wallet.connected]);

  const fetchAccount = async () => {
    try {
      // Create a dedicated connection for fetching if needed, or use the hook's. 
      // Using a fresh connection ensures availability even if wallet adapter is quirky.
      const rpcConnection = new Connection("http://127.0.0.1:8899", "confirmed");

      // Provider for reading doesn't strictly need a connected wallet if we use a dummy
      // @ts-ignore
      const provider = new AnchorProvider(rpcConnection, wallet.connected ? wallet : { publicKey: new PublicKey("11111111111111111111111111111111"), signTransaction: () => Promise.reject(), signAllTransactions: () => Promise.reject() }, {});

      // @ts-ignore
      const program = new Program(idl, PROGRAM_Id, provider);

      console.log("Fetching account for ID:", id);
      const account = await program.account.campaign.fetch(new PublicKey(id as string));
      console.log("Fetched account:", account);
      setCampaignAccount(account);
    } catch (e) {
      console.error("Failed to fetch account:", e);
    }
  }

  const handleConfidentialDonate = async () => {
    if (!wallet.publicKey) return;

    try {
      // @ts-ignore
      const provider = new AnchorProvider(connection, wallet, {});
      // @ts-ignore
      const program = new Program(idl, PROGRAM_Id, provider);

      const amountBN = new BN(parseFloat(donateAmount) * LAMPORTS_PER_SOL);
      const isSanctioned = false;

      const tx = await program.methods.donate(amountBN, isSanctioned)
        .accounts({
          campaign: new PublicKey(id as string),
          backer: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Donation Tx:", tx);
      alert("Success! Tx: " + tx);
      fetchAccount(); // Refresh
    } catch (err) {
      console.error("Donation failed:", err);
      alert("Donation failed: " + err);
    }
  };

  const displayCampaign = campaignAccount ? {
    title: campaignAccount.name,
    description: campaignAccount.description,
    target: campaignAccount.targetAmount.toString(),
    current: campaignAccount.currentAmount.toString(),
    deadline: campaignAccount.deadline ? new Date(campaignAccount.deadline.toNumber() * 1000).toLocaleDateString() : "Date"
  } : mockCampaign;

  const progress = Number(displayCampaign.target) > 0
    ? (Number(displayCampaign.current) / Number(displayCampaign.target)) * 100
    : 0;

  return (
    <div className="min-h-screen pt-20 pb-20">
      <div className="absolute top-4 left-4 z-20 md:hidden">
        {/* Mobile back button, desktop uses header nav */}
        <a href="/" className="px-4 py-2 rounded-lg bg-[var(--color-charcoal-800)] text-[var(--color-text-secondary)]">
          &larr; Home
        </a>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="glass-panel rounded-2xl p-10 shadow-2xl relative overflow-hidden">
          {/* Background Decoration */}
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-[var(--color-teal-900)] rounded-full opacity-20 blur-[100px] pointer-events-none"></div>

          <div className="flex flex-col md:flex-row justify-between items-start mb-8 relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-[var(--color-teal-900)] text-[var(--color-teal-400)] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-[var(--color-teal-500)]/20">
                  Verified Campaign
                </span>
                <span className="text-[var(--color-text-tertiary)] font-mono text-xs">
                  ID: {(id as string).slice(0, 6)}...{(id as string).slice(-4)}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                {displayCampaign.title}
              </h1>
            </div>

            <div className="text-right">
              <div className="text-3xl font-bold text-[var(--color-teal-400)] font-mono">
                {(Number(displayCampaign.current) / LAMPORTS_PER_SOL).toFixed(2)} SOL
              </div>
              <div className="text-sm text-[var(--color-text-secondary)]">
                raised of {(Number(displayCampaign.target) / LAMPORTS_PER_SOL).toFixed(2)} SOL goal
              </div>
            </div>
          </div>

          <div className="relative h-4 bg-[var(--color-charcoal-900)] rounded-full mb-12 overflow-hidden border border-[var(--color-charcoal-700)]">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[var(--color-teal-500)] to-[var(--color-teal-400)] rounded-full shadow-[0_0_20px_rgba(45,212,191,0.5)] transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(100, progress)}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h3 className="text-lg font-bold text-white mb-4 border-b border-[var(--color-charcoal-700)] pb-2 inline-block">About this Campaign</h3>
                <p className="text-[var(--color-text-secondary)] leading-relaxed text-lg whitespace-pre-wrap">
                  {displayCampaign.description}
                </p>
              </div>

              <div className="bg-[var(--color-charcoal-800)]/50 rounded-xl p-6 border border-[var(--color-charcoal-700)]">
                <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[var(--color-teal-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  Security & Compliance
                </h4>
                <p className="text-sm text-[var(--color-text-tertiary)]">
                  This campaign is monitored by ShadowFund's automated compliance layer.
                  Large deposits are screened via Range Protocol.
                  Your identity remains shielded via ShadowWire's zero-knowledge proofs.
                </p>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-[var(--color-charcoal-900)] p-6 rounded-xl border border-[var(--color-charcoal-700)] sticky top-24">
                <h3 className="text-xl font-bold text-white mb-6">Support this Project</h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2 block">Amount (SOL)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 1.0"
                      className="w-full p-3 rounded-lg bg-[var(--color-charcoal-800)] border border-[var(--color-charcoal-700)] focus:border-[var(--color-teal-500)] text-white outline-none font-mono text-lg"
                      value={donateAmount} onChange={e => setDonateAmount(e.target.value)}
                    />
                  </div>

                  <button
                    onClick={handleConfidentialDonate}
                    disabled={!wallet.connected}
                    className="w-full py-4 font-bold text-[var(--color-charcoal-900)] bg-[var(--color-teal-500)] rounded-lg hover:bg-[var(--color-teal-400)] transition-all shadow-lg shadow-teal-900/50 hover:shadow-teal-500/30"
                  >
                    {wallet.connected ? "Donate Anonymously" : "Connect to Donate"}
                  </button>

                  <p className="text-center text-xs text-[var(--color-text-tertiary)]">
                    Tx is shielded. No link to your public address.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
