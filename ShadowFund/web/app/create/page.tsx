'use client';

import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, web3, BN } from '@project-serum/anchor';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import idl from '../../idl/shadow_fund.json';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const PROGRAM_Id = new PublicKey("HNnG2p8trr7N1HdfMEtx4e5ARwZnamhG6X7wib9AiE12");

export default function CreateCampaign() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [complianceMode, setComplianceMode] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [createdCampaignAddress, setCreatedCampaignAddress] = useState('');

  const createCampaign = async () => {
    if (!wallet.publicKey) return;

    try {
      // @ts-ignore
      const provider = new AnchorProvider(connection, wallet, {});
      // @ts-ignore
      const program = new Program(idl, PROGRAM_Id, provider);

      // Derive campaign PDA with unique ID (timestamp) to allow multiple campaigns per user
      const campaignId = new BN(Date.now());

      const [campaignPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("campaign"), wallet.publicKey.toBuffer(), campaignId.toArrayLike(Buffer, 'le', 8)],
        PROGRAM_Id
      );

      console.log("Creating campaign...", { title, description, target, deadline, complianceMode, campaignPda: campaignPda.toString() });

      const targetBN = new BN(parseFloat(target) * LAMPORTS_PER_SOL);
      const deadlineBN = new BN(new Date(deadline).getTime() / 1000);

      const tx = await program.methods.initializeCampaign(
        campaignId,
        title,
        description,
        targetBN,
        deadlineBN
      )
        .accounts({
          campaign: campaignPda,
          owner: wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Transaction:", tx);
      setTxHash(tx);
      setCreatedCampaignAddress(campaignPda.toString());
      // alert("Campaign Created! Tx: " + tx);
    } catch (err) {
      console.error("Error creating campaign:", err);
      alert("Error: " + err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-10 flex flex-col items-center">
      <div className="absolute top-4 right-4">
        <WalletMultiButton />
      </div>
      <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
        Start a ShadowFund
      </h1>

      <div className="w-full max-w-lg space-y-4 bg-gray-800 p-8 rounded-xl shadow-2xl">
        <div>
          <label className="block mb-2 text-gray-300">Campaign Title</label>
          <input
            type="text"
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-purple-500 outline-none"
            value={title} onChange={e => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-2 text-gray-300">Description</label>
          <textarea
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-purple-500 outline-none h-32"
            value={description} onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 text-gray-300">Target (SOL)</label>
            <input
              type="number"
              step="0.1"
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-purple-500 outline-none"
              value={target} onChange={e => setTarget(e.target.value)}
            />
          </div>
          <div>
            <label className="block mb-2 text-gray-300">Deadline</label>
            <input
              type="date"
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-purple-500 outline-none"
              value={deadline} onChange={e => setDeadline(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center space-x-3 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
          <input
            type="checkbox"
            id="compliance"
            checked={complianceMode}
            onChange={e => setComplianceMode(e.target.checked)}
            className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
          />
          <label htmlFor="compliance" className="text-sm text-gray-300 cursor-pointer">
            <span className="font-bold text-white">Enable Range Compliance</span>
            <br />Blocks deposits from sanctioned wallets (OFAC).
          </label>
        </div>

        <button
          onClick={createCampaign}
          disabled={!wallet.connected}
          className="w-full py-3 mt-4 font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {wallet.connected ? "Launch Campaign" : "Connect Wallet"}
        </button>

        {txHash && (
          <div className="mt-4 p-2 bg-green-900/50 text-green-200 text-xs break-all rounded">
            Tx: {txHash}
          </div>
        )}

        {createdCampaignAddress && (
          <div className="mt-8 p-6 bg-green-900/30 border border-green-500 rounded-xl text-center">
            <h3 className="text-xl font-bold text-green-400 mb-2">Campaign Launch Successful!</h3>
            <p className="text-gray-300 mb-4">Your campaign is live on the ShadowFund list.</p>
            <p className="text-xs text-gray-500 mb-4 break-all">ID: {createdCampaignAddress}</p>
            <a
              href={`/campaign/${createdCampaignAddress}`}
              className="inline-block px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors"
            >
              View Campaign &rarr;
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
