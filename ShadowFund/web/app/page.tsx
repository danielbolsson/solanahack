"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useState, useEffect } from "react";
import { Program, AnchorProvider, BN } from "@project-serum/anchor";
import idl from "../idl/shadow_fund.json";

const PROGRAM_Id = new PublicKey("HNnG2p8trr7N1HdfMEtx4e5ARwZnamhG6X7wib9AiE12");

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
        const connection = new Connection("http://127.0.0.1:8899");
        // Read-only provider (or use window.solana if available, but consistent mock is safer for read-only if unconnected)
        const provider = new AnchorProvider(connection, {
          publicKey: new PublicKey("11111111111111111111111111111111"),
          signTransaction: () => Promise.reject(),
          signAllTransactions: () => Promise.reject(),
        }, {});

        // @ts-ignore
        const program = new Program(idl, PROGRAM_Id, provider);
        const accounts = await program.account.campaign.all();

        // Map to simpler structure if needed, but 'all()' returns { publicKey, account }
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
    <div className="min-h-screen bg-black text-white p-4">
      <div className="absolute top-4 right-4 z-10">
        <WalletMultiButton />
      </div>

      <div className="max-w-6xl mx-auto pt-20">
        <header className="text-center mb-16">
          <h1 className="text-6xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            ShadowFund
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Privacy-First Crowdfunding. Fund causes anonymously.
          </p>

          <Link
            href="/create"
            className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold hover:opacity-90 transition-opacity"
          >
            Start a Campaign
          </Link>
        </header>

        <section>
          <h2 className="text-3xl font-bold mb-8 border-b border-gray-800 pb-4">Latest Campaigns</h2>

          {loading ? (
            <div className="text-center text-gray-500 py-20">Loading campaigns...</div>
          ) : campaigns.length === 0 ? (
            <div className="text-center text-gray-500 py-20">
              No campaigns found. Be the first to start one!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((camp) => (
                <div key={camp.publicKey.toString()} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-purple-500 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-purple-900/30 text-purple-400 text-xs px-2 py-1 rounded">
                      Fundraiser
                    </div>
                    {/* Mock Status based on deadline */}
                    <div className="text-xs text-gray-500">
                      End: {new Date(camp.account.deadline.toNumber() * 1000).toLocaleDateString()}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold mb-2 truncate">
                    {camp.account.name}
                  </h3>
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                    {camp.account.description}
                  </p>

                  <div className="w-full bg-gray-800 rounded-full h-2.5 mb-4">
                    <div
                      className="bg-purple-600 h-2.5 rounded-full"
                      style={{ width: `${Math.min(100, (camp.account.currentAmount.toNumber() / camp.account.targetAmount.toNumber()) * 100)}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-sm text-gray-400 mb-6">
                    <span>Raised: {(camp.account.currentAmount.toNumber() / LAMPORTS_PER_SOL).toFixed(2)} SOL</span>
                    <span>Target: {(camp.account.targetAmount.toNumber() / LAMPORTS_PER_SOL).toFixed(2)} SOL</span>
                  </div>

                  <Link
                    href={`/campaign/${camp.publicKey.toString()}`}
                    className="block w-full py-2 bg-gray-800 hover:bg-gray-700 text-center rounded transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
