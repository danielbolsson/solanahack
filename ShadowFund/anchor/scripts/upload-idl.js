const anchor = require("@coral-xyz/anchor");
const { PublicKey } = require("@solana/web3.js");
const fs = require("fs");
const path = require("path");

// Env variables: ANCHOR_WALLET, ANCHOR_PROVIDER_URL
// Usage: node scripts/upload-idl.js

async function main() {
    // 1. Setup Provider
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    // 2. Load IDL
    const idlPath = path.resolve(__dirname, "../target/idl/shadow_fund.json");
    if (!fs.existsSync(idlPath)) {
        console.error("IDL not found at:", idlPath);
        process.exit(1);
    }
    const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
    const programId = new PublicKey("3UnENRqs8b2EVZAkUaWLmKwyTL7ecpuGhCLrsT4cjsdW");

    console.log("Uploading IDL for program:", programId.toString());

    try {
        // Try initialize first
        await anchor.Program.idl.init(provider, programId, idl);
        console.log("✅ IDL Init Successful");
    } catch (e) {
        if (e.message.includes("already exists")) {
            console.log("⚠️ IDL already exists. Attempting upgrade...");
            try {
                // The 'upgrade' method isn't always directly exposed on idl namespace in some versions,
                // but let's try standard approach. The CLI tool usually uses `anchor idl init/upgrade`.
                // We will shell out to the CLI if program method fails, or use the connection directly.

                // NOTE: `init` creates the account buffer. `upgrade` writes to it.
                // A simpler way for a hackathon might be just running the process exec of `anchor idl init`
                // but JS SDK is cleaner if it works.

                // Actually, program.idl.upgrade doesn't exist on all versions.
                // Let's spawn the CLI process as it is more reliable for IDL ops than the SDK sometimes.
                throw new Error("SDK IDL upgrade fallback needed");
            } catch (err) {
                console.log("Using shell command for upgrade...");
            }
        }
        else {
            console.error("Initialization Failed:", e);
        }
    }
}

// Switching to shell exec for reliability with CLI version mismatch issues we saw earlier.
const { execSync } = require("child_process");

try {
    console.log("Initializing IDL...");
    execSync(`anchor idl init --filepath target/idl/shadow_fund.json HNnG2p8trr7N1HdfMEtx4e5ARwZnamhG6X7wib9AiE12 --provider.cluster ${process.env.ANCHOR_PROVIDER_URL} --provider.wallet ${process.env.ANCHOR_WALLET}`, { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
} catch (e) {
    console.log("Init failed (likely exists), attempting upgrade...");
    try {
        execSync(`anchor idl upgrade --filepath target/idl/shadow_fund.json HNnG2p8trr7N1HdfMEtx4e5ARwZnamhG6X7wib9AiE12 --provider.cluster ${process.env.ANCHOR_PROVIDER_URL} --provider.wallet ${process.env.ANCHOR_WALLET}`, { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
        console.log("✅ IDL Upgrade Successful");
    } catch (err) {
        console.error("❌ IDL Upload Failed");
        process.exit(1);
    }
}
