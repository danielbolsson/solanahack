"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useState, useEffect } from "react";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import idl from "../idl/shadow_fund.json";

const PROGRAM_Id = new PublicKey("3UnENRqs8b2EVZAkUaWLmKwyTL7ecpuGhCLrsT4cjsdW");

interface CampaignAccount {
  publicKey: PublicKey;
  account: {
    owner: PublicKey;
    name: string;
    description: string;
    targetAmount: BN;
    currentAmount: BN;
    deadline: BN;
  };
}

export default function Home() {
  const wallet = useWallet();
  const [campaigns, setCampaigns] = useState<CampaignAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const connection = new Connection("https://api.devnet.solana.com");
        // Read-only provider
        const provider = new AnchorProvider(connection, {
          publicKey: new PublicKey("11111111111111111111111111111111"),
          signTransaction: () => Promise.reject(),
          signAllTransactions: () => Promise.reject(),
        }, {});

        // @ts-ignore
        const program = new Program(idl as any, provider);
        const accounts = await program.account.campaign.all();

        setCampaigns(accounts as any as CampaignAccount[]);
      } catch (err) {
        console.error("Error fetching campaigns:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  return (
    <div className="min-h-screen">
      <div className="text-center mb-24 pt-12">
        <h1 className="text-7xl font-bold mb-8 tracking-tighter leading-tight text-white">
          <span>Fund the</span>
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-teal-500)] to-[var(--color-teal-400)]">
            Unseen.
          </span>
        </h1>
        <p className="text-xl text-[var(--color-text-secondary)] mb-10 max-w-2xl mx-auto leading-relaxed">
          ShadowFund is the privacy-first crowdfunding platform for the modern era.
          Support causes anonymously with zero-knowledge compliance.
        </p>

        <Link
          href="/create"
          className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--color-teal-500)] text-[var(--color-charcoal-900)] rounded-full font-bold hover:bg-[var(--color-teal-400)] hover:scale-105 transition-all shadow-[0_0_20px_rgba(45,212,191,0.3)]"
        >
          <span>Start a Campaign</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
        </Link>
      </div>

      <section>
        <div className="flex items-center justify-between mb-10 border-b border-[var(--color-charcoal-700)] pb-6">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Trending Campaigns</h2>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-lg bg-[var(--color-charcoal-800)] text-[var(--color-text-secondary)] hover:text-white text-sm font-medium transition-colors">All</button>
            <button className="px-4 py-2 rounded-lg hover:bg-[var(--color-charcoal-800)] text-[var(--color-text-secondary)] hover:text-white text-sm font-medium transition-colors">Technology</button>
            <button className="px-4 py-2 rounded-lg hover:bg-[var(--color-charcoal-800)] text-[var(--color-text-secondary)] hover:text-white text-sm font-medium transition-colors">Advocacy</button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-[var(--color-charcoal-800)] animate-pulse"></div>
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center text-[var(--color-text-secondary)] py-20 bg-[var(--color-charcoal-800)] rounded-2xl border border-dashed border-[var(--color-charcoal-700)]">
            <p className="text-lg">No campaigns active.</p>
            <p className="text-sm">Be the first to launch one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {campaigns.map((camp) => (
              <div key={camp.publicKey.toString()} className="glass-panel rounded-2xl p-6 hover-scale group cursor-pointer flex flex-col relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-teal-500)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="flex justify-between items-start mb-6">
                  {(() => {
                    const now = new Date().getTime();
                    const deadlineDate = new Date(camp.account.deadline.toNumber() * 1000).getTime();
                    const isExpired = deadlineDate <= now;
                    const isFunded = camp.account.currentAmount.toNumber() >= camp.account.targetAmount.toNumber();

                    if (isFunded) {
                      return <div className="bg-green-900/50 text-green-400 text-[10px] uppercase font-bold px-3 py-1 rounded-full tracking-wider border border-green-500/20">Funded</div>;
                    } else if (isExpired) {
                      return <div className="bg-red-900/50 text-red-400 text-[10px] uppercase font-bold px-3 py-1 rounded-full tracking-wider border border-red-500/20">Ended</div>;
                    } else {
                      return <div className="bg-[var(--color-teal-900)] text-[var(--color-teal-400)] text-[10px] uppercase font-bold px-3 py-1 rounded-full tracking-wider">Active</div>;
                    }
                  })()}
                  <div className="text-xs text-[var(--color-text-tertiary)] font-mono bg-[var(--color-charcoal-900)]/50 px-2 py-1 rounded">
                    {(() => {
                      const now = new Date().getTime();
                      const deadlineDate = new Date(camp.account.deadline.toNumber() * 1000).getTime();
                      const diff = deadlineDate - now;
                      if (diff <= 0) return "Ended";
                      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                      return `${days} Days Left`;
                    })()}
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-3 text-[var(--color-text-primary)] group-hover:text-[var(--color-teal-400)] transition-colors truncate">
                  {camp.account.name}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-8 line-clamp-3 flex-grow leading-relaxed">
                  {camp.account.description}
                </p>

                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-medium text-[var(--color-text-secondary)]">
                    <span className="text-[var(--color-text-primary)]">{(camp.account.currentAmount.toNumber() / LAMPORTS_PER_SOL).toFixed(2)} SOL</span>
                    <span className="flex items-center gap-1">
                      <span>of {(camp.account.targetAmount.toNumber() / LAMPORTS_PER_SOL).toFixed(2)} SOL</span>
                      <span className="text-[var(--color-teal-400)]">({((camp.account.currentAmount.toNumber() / camp.account.targetAmount.toNumber()) * 100).toFixed(0)}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-[var(--color-charcoal-900)] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[var(--color-teal-500)] h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(45,212,191,0.5)]"
                      style={{ width: `${Math.min(100, (camp.account.currentAmount.toNumber() / camp.account.targetAmount.toNumber()) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                <Link
                  href={`/campaign/${camp.publicKey.toString()}`}
                  className="absolute inset-0 z-10"
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
