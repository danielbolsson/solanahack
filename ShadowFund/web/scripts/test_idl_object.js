const { BorshAccountsCoder } = require("@coral-xyz/anchor");

// Minimal IDL with object-format defined type
const idl = {
    version: "0.1.0",
    name: "shadow_fund",
    instructions: [],
    accounts: [
        {
            name: "Campaign",
            type: {
                kind: "struct",
                fields: [
                    {
                        name: "tiers",
                        type: {
                            vec: {
                                defined: { name: "RewardTier" }
                            }
                        }
                    }
                ]
            }
        }
    ],
    types: [
        {
            name: "RewardTier",
            type: {
                kind: "struct",
                fields: [
                    { name: "amount", type: "u64" }
                ]
            }
        }
    ]
};

try {
    console.log("Testing object format: { defined: { name: 'RewardTier' } }");
    const coder = new BorshAccountsCoder(idl);
    console.log("✅ Object format worked!");
} catch (e) {
    console.error("❌ Object format failed:", e);
}
