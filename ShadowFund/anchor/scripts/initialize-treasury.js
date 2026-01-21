const anchor = require("@coral-xyz/anchor");
// Use anchor.web3 to ensure version compatibility
const { PublicKey, Keypair } = anchor.web3;

// USAGE: ANCHOR_WALLET=~/.config/solana/id.json node scripts/initialize-treasury.js <TREASURY_PUBKEY>

async function main() {
    // 1. Setup Provider
    // Ensure env vars are used if not provided by anchor CLI
    if (!process.env.ANCHOR_PROVIDER_URL || !process.env.ANCHOR_WALLET) {
        console.warn("⚠️ ANCHOR_PROVIDER_URL or ANCHOR_WALLET not set. Defaults might fail in standalone node execution.");
    }
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    // 2. Load Program
    const idl = require("../target/idl/shadow_fund.json");
    const programId = new PublicKey("3UnENRqs8b2EVZAkUaWLmKwyTL7ecpuGhCLrsT4cjsdW");
    const program = new anchor.Program(idl, programId, provider);

    // 3. Get Treasury Argument
    const treasuryKey = process.argv[2];
    if (!treasuryKey) {
        console.error("Usage: node scripts/initialize-treasury.js <TREASURY_PUBKEY>");
        process.exit(1);
    }

    let treasuryPubkey;
    try {
        treasuryPubkey = new PublicKey(treasuryKey);
    } catch (e) {
        console.error("Invalid Public Key:", treasuryKey);
        process.exit(1);
    }

    console.log(`Initializing Treasury to: ${treasuryPubkey.toString()}`);
    console.log("Fee: 5% (500 bps)");

    // 4. Find PDA
    const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId
    );

    try {
        const tx = await program.methods.initializeConfig(
            treasuryPubkey,
            500
        )
            .accounts({
                config: configPda,
                authority: provider.wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();

        console.log("✅ Platform Config Initialized!");
        console.log("Tx Signature:", tx);
    } catch (e) {
        if (e.message && e.message.includes("already in use")) {
            console.log("⚠️ Config already initialized. (Programs are immutable for this demo context usually, or need an update instruction)");
        } else {
            console.error("❌ Error:", e);
        }
    }
}

main().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
});
