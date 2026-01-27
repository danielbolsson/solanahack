const fs = require('fs');
const path = require('path');
const { BorshAccountsCoder } = require("@coral-xyz/anchor");

// Mock IDL loading
const idlPath = path.resolve(__dirname, '../idl/shadow_fund.json');
const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));

console.log("Loaded IDL version:", idl.version);

try {
    console.log("Attempting to create BorshAccountsCoder...");
    const coder = new BorshAccountsCoder(idl);
    console.log("✅ BorshAccountsCoder created successfully.");

    // Try to resolve Campaign account layout specifically
    const campaignDef = idl.accounts.find(a => a.name === "Campaign");
    if (campaignDef) {
        console.log("Found Campaign definition. Inspecting fields...");
        campaignDef.type.fields.forEach(f => {
            console.log(`Field: ${f.name}, Type:`, JSON.stringify(f.type));
        });
    }

} catch (e) {
    console.error("❌ Error reproducing IDL issue:");
    console.error(e);

    // Manual inspection of the failure point for "defined" types
    console.log("\n--- Debugging 'defined' types ---");
    idl.accounts.forEach(acc => {
        acc.type.fields.forEach(field => {
            checkType(field.type, acc.name + "." + field.name);
        });
    });
}

function checkType(type, context) {
    if (type.defined) {
        console.log(`[${context}] Found defined type: ${JSON.stringify(type.defined)}`);
        const typeName = typeof type.defined === 'string' ? type.defined : type.defined.name;
        const found = idl.types.find(t => t.name === typeName);
        if (!found) {
            console.error(`❌ CRITICAL: Type '${typeName}' not found in idl.types!`);
        } else {
            console.log(`   ✅ Resolved to:`, found.name);
        }
    } else if (type.vec) {
        checkType(type.vec, context + " (vec)");
    }
}
