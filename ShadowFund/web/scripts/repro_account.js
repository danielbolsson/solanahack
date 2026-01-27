const fs = require('fs');
const path = require('path');
const { BorshCoder, AccountClient } = require("@coral-xyz/anchor");
const { PublicKey } = require("@solana/web3.js");

const idlPath = path.resolve(__dirname, '../idl/shadow_fund.json');
const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));

console.log("------------------------------------------");
console.log("Reproduction Script: AccountClient Creation");
console.log("------------------------------------------");

try {
    console.log("1. Creating BorshCoder...");
    const coder = new BorshCoder(idl);
    console.log("   ✅ BorshCoder created.");
    console.log("      coder.accounts defined?", !!coder.accounts);
    if (coder.accounts) {
        console.log("      coder.accounts.size defined?", typeof coder.accounts.size === 'function');
    }

    console.log("2. Finding Campaign account definition...");
    const campaignDef = idl.accounts.find(a => a.name === "Campaign");
    if (!campaignDef) throw new Error("Campaign account def missing from IDL");
    console.log("   ✅ Found Campaign definition.");

    console.log("3. Creating Mock Provider...");
    const provider = {
        connection: { getMinimumBalanceForRentExemption: async () => 0 },
        publicKey: new PublicKey("11111111111111111111111111111111")
    };

    console.log("4. Attempting to create AccountClient...");
    // Constructor signature: (idl, idlAccount, programId, provider, coder)
    // Note: AccountClient might not be exported directly in some versions, but let's try.
    // If not, we use the logic inside it: coder.accounts.size("Campaign")

    console.log("   Testing coder.accounts.size('Campaign') directly:");
    const size = coder.accounts.size("Campaign");
    console.log("   ✅ Size calculated:", size);

} catch (e) {
    console.error("❌ CRASHED:");
    console.error(e);
}
