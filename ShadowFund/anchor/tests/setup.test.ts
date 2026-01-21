import * as anchor from "@coral-xyz/anchor";

import { PublicKey } from "@solana/web3.js";

async function main() {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.ShadowFund;

    // Generate a treasury keypair for testing
    const treasury = anchor.web3.Keypair.generate();
    console.log("Treasury Address:", treasury.publicKey.toString());

    const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
    );

    console.log("Config PDA:", configPda.toString());

    try {
        const tx = await program.methods.initializeConfig(
            treasury.publicKey,
            500 // 5% fee
        )
            .accounts({
                config: configPda,
                authority: provider.wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();

        console.log("Config Initialized! Tx:", tx);
    } catch (e) {
        console.log("Error or already initialized:", e);
    }
}

main().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
});
