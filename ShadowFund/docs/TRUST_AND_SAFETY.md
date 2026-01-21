# Trust & Verification Models

Ensuring a campaign is legitimate is the hardest problem in anonymous crowdfunding. Since ShadowFund protects the privacy of backers, we must ensure the *creators* are accountable without necessarily doxing them to the entire world, or finding trustless verifiable ways to ensure safety.

Here are the architectural methods we can use to prove legitimacy:

## 1. On-Chain Identity & Reputation (Social Proof)
Connect the campaign to established Web3 identities.

*   **Method**: Integrate **Solana Name Service (.sol)**, **Dialect**, or **Civic**.
*   **How it works**:
    *   The contract checks if the `owner` wallet resolves to a valid `.sol` domain (e.g., `builder.sol`).
    *   Display verified Twitter/X accounts linked via centralized or decentralized identity providers.
*   **Pros**: Easy to verify, leverages existing reputation.
*   **Cons**: Requires the creator to be public (pseudonymous reputation).

## 2. Milestone-Based Unlocking (Escrow)
Funds are not released all at once. They are vested based on progress.

*   **Method**: Smart Contract Escrow.
*   **How it works**:
    *   Campaign raises 1000 SOL.
    *   Creator gets 10% immediately.
    *   Remaining 90% is locked.
    *   Creator requests unlock for "Milestone 1: Prototype".
    *   **Backers Vote** (using their `Backer` receipts) to approve or reject the release.
*   **Pros**: Trustless, protects funds.
*   **Cons**: High friction for backers to vote; complex logic.

## 3. Multisig Treasury (Shared Custody)
Funds go to a shared wallet controlled by multiple reputable entities, not a single person.

*   **Method**: Integrate **Squads** (Solana Multisig).
*   **How it works**:
    *   The "Creator" address is actually a 3-of-5 multisig.
    *   Signers could include the lead dev, a community representitive, and a neutral auditor.
*   **Pros**: High security check.
*   **Cons**: Hard for individual creators to organize.

## 4. Auditor "Stamps of Approval" (Centralized/Federated)
A trusted third party manually verifies the project.

*   **Method**: An `is_verified` boolean in the `Campaign` struct.
*   **How it works**:
    *   ShadowFund (the platform admin) performs KYC/KYB on the creator off-chain.
    *   The Admin wallet signs a transaction to set `campaign.verified = true`.
    *   UI displays a "Verified" badge.
*   **Pros**: Simple for users ("Blue checkmark").
*   **Cons**: Centralized; requires ShadowFund to act as arbiter.

## Recommended Implementation for ShadowFund

For the MVP, we recommend **Option 1 (Social Proof)** + **Option 4 (Admin Verification)**.

1.  **Add `website` and `socials` fields** to `Campaign` struct (Transparency).
2.  **Add `verified_by_admin` flag** (Safety).
