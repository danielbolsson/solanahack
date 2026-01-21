'use client';

import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, web3, BN } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import idl from '../../idl/shadow_fund.json';
import { toast } from 'react-hot-toast';

const PROGRAM_Id = new PublicKey("3UnENRqs8b2EVZAkUaWLmKwyTL7ecpuGhCLrsT4cjsdW");

export default function AdminPage() {
    const { connection } = useConnection();
    const wallet = useWallet();
    const [treasury, setTreasury] = useState('');
    const [fee, setFee] = useState('500'); // 5%

    const initializeConfig = async () => {
        if (!wallet.publicKey) {
            toast.error("Connect Wallet");
            return;
        }
        if (!treasury) {
            toast.error("Enter Treasury Address");
            return;
        }

        const toastId = toast.loading("Initializing Config...");

        try {
            // @ts-ignore
            const provider = new AnchorProvider(connection, wallet, {
                commitment: 'confirmed',
                preflightCommitment: 'confirmed',
            });
            // @ts-ignore
            const program = new Program(idl, PROGRAM_Id, provider);

            const [configPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("config")],
                PROGRAM_Id
            );

            // Build instruction
            const ix = await program.methods.initializeConfig(
                new PublicKey(treasury),
                parseInt(fee)
            )
                .accounts({
                    config: configPda,
                    authority: wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                })
                .instruction();

            const latestBlockhash = await connection.getLatestBlockhash('confirmed');

            const tx = new web3.Transaction({
                feePayer: wallet.publicKey,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
            }).add(ix);

            const signature = await wallet.sendTransaction(tx, connection);

            console.log("Sent signature:", signature);
            await connection.confirmTransaction({
                signature,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
            }, 'confirmed');

            console.log("Confirmed signature:", signature);
            toast.success("Config Initialized!", { id: toastId });
        } catch (e: any) {
            console.error(e);
            toast.error("Failed: " + (e.message || e.toString()), { id: toastId });
        }
    };

    return (
        <div className="min-h-screen pt-24 px-4">
            <div className="max-w-md mx-auto glass-panel p-8 rounded-2xl">
                <h1 className="text-2xl font-bold text-white mb-6">Platform Admin</h1>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase block mb-1">Treasury Address</label>
                        <input
                            type="text"
                            className="w-full p-2 rounded bg-[var(--color-charcoal-800)] text-white border border-[var(--color-charcoal-700)]"
                            value={treasury}
                            onChange={(e) => setTreasury(e.target.value)}
                            placeholder="Wallet Public Key"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase block mb-1">Fee (Basis Points)</label>
                        <input
                            type="number"
                            className="w-full p-2 rounded bg-[var(--color-charcoal-800)] text-white border border-[var(--color-charcoal-700)]"
                            value={fee}
                            onChange={(e) => setFee(e.target.value)}
                        />
                        <p className="text-xs text-[var(--color-text-tertiary)] mt-1">500 bps = 5%</p>
                    </div>

                    <button
                        onClick={initializeConfig}
                        className="w-full py-3 bg-[var(--color-teal-500)] text-[var(--color-charcoal-900)] font-bold rounded-lg hover:bg-[var(--color-teal-400)]"
                    >
                        Initialize Config
                    </button>

                    <p className="text-xs text-center text-[var(--color-text-tertiary)]">
                        Only needs to be run once per deployment.
                    </p>
                </div>
            </div>
        </div>
    );
}
