'use client';

import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, web3, BN } from '@project-serum/anchor';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import idl from '../../idl/shadow_fund.json';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { toast } from 'react-hot-toast';

const PROGRAM_Id = new PublicKey("3UnENRqs8b2EVZAkUaWLmKwyTL7ecpuGhCLrsT4cjsdW");

interface Tier {
  name: string;
  description: string;
  amount: string;
  limit: string;
}

export default function CreateCampaign() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [complianceMode, setComplianceMode] = useState(false);

  // Reward Tiers State
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [newTier, setNewTier] = useState<Tier>({ name: '', description: '', amount: '', limit: '' });

  const [txHash, setTxHash] = useState('');
  const [createdCampaignAddress, setCreatedCampaignAddress] = useState('');

  const addTier = () => {
    if (!newTier.name || !newTier.amount) return toast.error("Name and Amount are required");
    setTiers([...tiers, newTier]);
    setNewTier({ name: '', description: '', amount: '', limit: '' });
  };

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const createCampaign = async () => {
    if (!wallet.publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    const toastId = toast.loading('Creating campaign...');

    try {
      // @ts-ignore
      const provider = new AnchorProvider(connection, wallet, {});
      // @ts-ignore
      const program = new Program(idl, PROGRAM_Id, provider);

      const campaignId = new BN(Date.now());

      const [campaignPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("campaign"), wallet.publicKey.toBuffer(), campaignId.toArrayLike(Buffer, 'le', 8)],
        PROGRAM_Id
      );

      console.log("Creating campaign...", { title, description, target, deadline, complianceMode, campaignPda: campaignPda.toString() });

      if (!title || !description || !target || !deadline) {
        throw new Error("Please fill in all fields");
      }

      const targetBN = new BN(parseFloat(target) * LAMPORTS_PER_SOL);
      const deadlineBN = new BN(new Date(deadline).getTime() / 1000);

      const addTierIxs = await Promise.all(tiers.map(async (tier) => {
        const amountBN = new BN(parseFloat(tier.amount) * LAMPORTS_PER_SOL);
        const limitVal = tier.limit ? parseInt(tier.limit) : 0;
        return await program.methods.addRewardTier(
          tier.name,
          tier.description || "",
          amountBN,
          limitVal
        )
          .accounts({
            campaign: campaignPda,
            owner: wallet.publicKey as PublicKey,
          })
          .instruction();
      }));

      const tx = await program.methods.initializeCampaign(
        campaignId,
        title,
        description,
        targetBN,
        deadlineBN
      )
        .accounts({
          campaign: campaignPda,
          owner: wallet.publicKey as PublicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .postInstructions(addTierIxs)
        .rpc();

      console.log("Transaction:", tx);
      setTxHash(tx);
      setCreatedCampaignAddress(campaignPda.toString());

      toast.success('Campaign launched successfully!', { id: toastId });
    } catch (err: any) {
      console.error("Error creating campaign:", err);
      let message = err.message || "Failed to create campaign";
      if (message.includes("0x1")) { // Insufficient funds error often has this code or text
        message = "Insufficient funds for transaction fee";
      }
      toast.error(message, { id: toastId });
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-20">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 gradient-text">Launch a Vision</h1>
          <p className="text-[var(--color-text-secondary)]">Create a privacy-preserving funding campaign in seconds.</p>
        </div>

        <div className="glass-panel rounded-2xl p-10 shadow-2xl">
          <div className="space-y-8">
            <div>
              <label className="block mb-2 text-sm font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Campaign Title</label>
              <input
                type="text"
                placeholder="e.g. Open Source Privacy Tool"
                className="w-full p-4 rounded-lg bg-[var(--color-charcoal-900)] border border-[var(--color-charcoal-700)] focus:border-[var(--color-teal-500)] text-[var(--color-text-primary)] placeholder-gray-600 outline-none transition-all"
                value={title} onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Description</label>
              <textarea
                placeholder="Tell your story..."
                className="w-full p-4 rounded-lg bg-[var(--color-charcoal-900)] border border-[var(--color-charcoal-700)] focus:border-[var(--color-teal-500)] text-[var(--color-text-primary)] placeholder-gray-600 outline-none h-40 transition-all font-sans"
                value={description} onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 text-sm font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Target (SOL)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="100.0"
                  className="w-full p-4 rounded-lg bg-[var(--color-charcoal-900)] border border-[var(--color-charcoal-700)] focus:border-[var(--color-teal-500)] text-[var(--color-text-primary)] outline-none transition-all"
                  value={target} onChange={e => setTarget(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Deadline</label>
                <input
                  type="date"
                  className="w-full p-4 rounded-lg bg-[var(--color-charcoal-900)] border border-[var(--color-charcoal-700)] focus:border-[var(--color-teal-500)] text-[var(--color-text-primary)] outline-none transition-all"
                  value={deadline} onChange={e => setDeadline(e.target.value)}
                />
              </div>
            </div>

            {/* Reward Tiers Section */}
            <div className="bg-[var(--color-charcoal-900)] p-6 rounded-xl border border-[var(--color-charcoal-700)]">
              <h3 className="text-lg font-bold text-white mb-4">Reward Tiers</h3>

              {tiers.length > 0 && (
                <div className="space-y-3 mb-6">
                  {tiers.map((t, i) => (
                    <div key={i} className="flex justify-between items-center bg-[var(--color-charcoal-800)] p-3 rounded-lg border border-[var(--color-charcoal-600)]">
                      <div>
                        <div className="font-bold text-white">{t.name} <span className="text-[var(--color-teal-400)]">({t.amount} SOL)</span></div>
                        <div className="text-xs text-[var(--color-text-secondary)]">{t.description.substring(0, 50)}...</div>
                      </div>
                      <button onClick={() => removeTier(i)} className="text-red-400 hover:text-red-300 text-sm">Remove</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-4">
                <input type="text" placeholder="Tier Name (e.g. VIP)" className="p-3 bg-[var(--color-charcoal-800)] rounded-lg text-white" value={newTier.name} onChange={e => setNewTier({ ...newTier, name: e.target.value })} />
                <input type="number" placeholder="Price (SOL)" className="p-3 bg-[var(--color-charcoal-800)] rounded-lg text-white" value={newTier.amount} onChange={e => setNewTier({ ...newTier, amount: e.target.value })} />
                <input type="number" placeholder="Limit (0 = Ultd)" className="p-3 bg-[var(--color-charcoal-800)] rounded-lg text-white" value={newTier.limit} onChange={e => setNewTier({ ...newTier, limit: e.target.value })} />
                <input type="text" placeholder="Description" className="p-3 bg-[var(--color-charcoal-800)] rounded-lg text-white" value={newTier.description} onChange={e => setNewTier({ ...newTier, description: e.target.value })} />
              </div>
              <button onClick={addTier} type="button" className="w-full py-2 bg-[var(--color-charcoal-800)] hover:bg-[var(--color-charcoal-700)] text-[var(--color-teal-400)] rounded-lg text-sm font-bold border border-[var(--color-charcoal-600)]">+ Add Tier</button>
            </div>

            <div className="flex items-center space-x-4 p-5 bg-[var(--color-charcoal-900)] rounded-xl border border-[var(--color-charcoal-700)] hover:border-[var(--color-charcoal-700)] transition-colors group">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id="compliance"
                  checked={complianceMode}
                  onChange={e => setComplianceMode(e.target.checked)}
                  className="peer h-6 w-6 cursor-pointer appearance-none rounded-md border border-gray-600 bg-[var(--color-charcoal-800)] transition-all checked:border-[var(--color-teal-500)] checked:bg-[var(--color-teal-500)]"
                />
                <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <label htmlFor="compliance" className="text-sm text-[var(--color-text-secondary)] cursor-pointer flex-1">
                <span className="font-bold text-[var(--color-text-primary)] block mb-1">Enable Regulatory Compliance</span>
                Blocks deposits from OFAC-sanctioned wallets (via Range Protocol).
              </label>
            </div>

            <button
              onClick={createCampaign}
              disabled={!wallet.connected}
              className="w-full py-4 font-bold text-[var(--color-charcoal-900)] bg-[var(--color-teal-500)] rounded-lg hover:bg-[var(--color-teal-400)] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(45,212,191,0.2)] hover:shadow-[0_0_30px_rgba(45,212,191,0.4)]"
            >
              {wallet.connected ? "Launch Campaign" : "Connect Wallet to Launch"}
            </button>
          </div>

          {txHash && (
            <div className="mt-8 p-4 bg-[var(--color-charcoal-900)] border border-[var(--color-teal-900)] text-[var(--color-teal-400)] text-xs rounded-lg font-mono break-all flex items-center gap-3">
              <div className="w-2 h-2 bg-[var(--color-teal-500)] rounded-full animate-pulse"></div>
              Transaction sent: {txHash}
            </div>
          )}

          {createdCampaignAddress && (
            <div className="mt-8 p-6 bg-gradient-to-br from-[var(--color-teal-900)] to-[var(--color-charcoal-900)] border border-[var(--color-teal-500)] rounded-xl text-center shadow-2xl">
              <div className="w-16 h-16 bg-[var(--color-teal-500)] text-[var(--color-charcoal-900)] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Campaign Live</h3>
              <p className="text-[var(--color-teal-100)] mb-6">Your vision is now on-chain.</p>
              <a
                href={`/campaign/${createdCampaignAddress}`}
                className="inline-flex items-center px-6 py-3 bg-[var(--color-charcoal-900)] hover:bg-[var(--color-charcoal-800)] text-white font-medium rounded-lg transition-colors border border-[var(--color-teal-500)]"
              >
                View Campaign &rarr;
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
