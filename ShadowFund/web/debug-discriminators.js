const { sha256 } = require('js-sha256');

function getDiscriminator(preimage) {
    const hash = sha256.digest(preimage); // Returns array of bytes
    return hash.slice(0, 8);
}

const inputs = [
    "global:initialize_campaign",
    "global:initializeCampaign",
    "global:add_reward_tier",
    "global:addRewardTier"
];

console.log("--- Discriminator Debug ---");
inputs.forEach(input => {
    const disc = getDiscriminator(input);
    console.log(`${input} -> [${disc.join(', ')}]`);
});
