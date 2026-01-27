const fs = require('fs');
const path = require('path');

const idlPath = path.resolve(__dirname, '../idl/shadow_fund.json');

try {
    const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));

    if (idl.types && idl.accounts) {
        console.log("Fixing IDL: Embedding types into accounts...");
        idl.accounts.forEach(acc => {
            if (!acc.type) {
                const typeDef = idl.types.find(t => t.name === acc.name);
                if (typeDef) {
                    acc.type = typeDef.type;
                    console.log(`Matched ${acc.name}`);
                }
            }
        });
        // We keep 'types' array as well, just in case, or we could remove duplicated ones.
        // Usually safe to keep.

        fs.writeFileSync(idlPath, JSON.stringify(idl, null, 2));
        console.log("✅ IDL Fixed.");
    } else {
        console.log("IDL structure doesn't look like split accounts/types. Skipping.");
    }
} catch (e) {
    console.error("Error fixing IDL:", e);
}
