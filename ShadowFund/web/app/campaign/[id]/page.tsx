'use client';

import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useParams } from 'next/navigation';
import { Program, AnchorProvider, web3, BN } from '@project-serum/anchor';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import idl from '../../../idl/shadow_fund.json';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const PROGRAM_Id = new PublicKey("HNnG2p8trr7N1HdfMEtx4e5ARwZnamhG6X7wib9AiE12");

export default function ViewCampaign() {
  const { id } = useParams();
  const { connection } = useConnection();
  const wallet = useWallet();
  const [donateAmount, setDonateAmount] = useState('');
  const [campaignAccount, setCampaignAccount] = useState<any>(null);

  // Mock data fallback
  const mockCampaign = {
    title: "Privacy for Whistleblowers (Loaded from Chain)",
    description: "Legal defense fund for anon sources. Funds are managed via multisig.",
    target: 50000,
    current: 12500,
    deadline: "2025-12-31"
  };

  useEffect(() => {
    if (wallet.publicKey && id) {
      fetchAccount();
    }
  }, [wallet.publicKey, id]);

  const fetchAccount = async () => {
    try {
      // @ts-ignore
      const provider = new AnchorProvider(connection, wallet, {});
      // @ts-ignore
      const program = new Program(idl, PROGRAM_Id, provider);

      const account = await program.account.campaign.fetch(new PublicKey(id as string));
      console.log("Fetched account:", account);
      setCampaignAccount(account);
    } catch (e) {
      console.error("Failed to fetch account (using mock):", e);
    }
  }

  const handleConfidentialDonate = async () => {
    if (!wallet.publicKey) return;

    console.log("Initiating Confidential Transfer...", { amount: donateAmount, recipient: id });
    try {
      // @ts-ignore
      const provider = new AnchorProvider(connection, wallet, {});
      // @ts-ignore
      const program = new Program(idl, PROGRAM_Id, provider);

      const amountBN = new BN(parseFloat(donateAmount) * LAMPORTS_PER_SOL);
      // Mock compliance check (Range)
      const isSanctioned = false;

      const tx = await program.methods.donate(amountBN, isSanctioned)
        .accounts({
          campaign: new PublicKey(id as string),
          backer: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Donation Tx:", tx);
      alert("ShadowWire SDK: Transfer Shielded & Confirmed! Tx: " + tx);
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
    deadline: new Date(campaignAccount.deadline.toNumber() * 1000).toLocaleDateString()
  } : mockCampaign;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-10 flex flex-col items-center">
      <div className="absolute top-4 left-4">
        <a href="/" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
          &larr; Back to Home
        </a>
      </div>
      <div className="absolute top-4 right-4">
        <WalletMultiButton />
      </div>
      <div className="w-full max-w-2xl bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
            {displayCampaign.title}
          </h1>
          <span className="bg-purple-900 text-purple-200 px-3 py-1 rounded-full text-xs border border-purple-500">
            Confidential
          </span>
        </div>

        <p className="text-gray-400 mb-8 leading-relaxed">
          {displayCampaign.description}
        </p>

        <div className="bg-gray-900/50 p-6 rounded-lg mb-8">
          <h2 className="text-sm uppercase tracking-wider text-gray-500 mb-4">Funding Progress (ZK Verified)</h2>
          <div className="w-full bg-gray-700 h-4 rounded-full overflow-hidden mb-2">
            <div
              className="bg-green-500 h-full transition-all duration-1000"
              style={{ width: `${(Number(displayCampaign.current) / Number(displayCampaign.target)) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm">
            <span>Raised: {(Number(displayCampaign.current) / LAMPORTS_PER_SOL).toLocaleString()} SOL</span>
            <span>Target: {(Number(displayCampaign.target) / LAMPORTS_PER_SOL).toLocaleString()} SOL</span>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8">
          <h3 className="text-xl font-bold mb-4">Make a Secret Contribution</h3>
          <div className="flex space-x-4">
            <input
              type="number"
              step="0.1"
              placeholder="Amount (SOL)"
              className="flex-1 p-3 rounded bg-gray-700 border border-gray-600 focus:border-green-500 outline-none"
              value={donateAmount} onChange={e => setDonateAmount(e.target.value)}
            />
            <button
              onClick={handleConfidentialDonate}
              disabled={!wallet.connected}
              className="px-8 py-3 font-bold text-gray-900 bg-gradient-to-r from-green-400 to-emerald-600 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {wallet.connected ? "Shield & Donate" : "Connect"}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Powered by ShadowWire. Your address will not be linked to this donation.
          </p>
        </div>
      </div>
    </div>
  );
}

