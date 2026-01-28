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

## 5. Implemented Safety Features

### Sanctions Screening (OFAC Compliance)
To prevent illicit usage while maintaining privacy, we integrated a sanctions check directly into the smart contract.

*   **Mechanism**: The contract derives a PDA `[b"sanctioned", user_key]`.
*   **Check**: In the `donate` instruction, the contract verifies this account is **NOT** initialized or has no data.
*   **Enforcement**: If a user is on the blocklist (marked by the Admin), the transaction reverts with `ErrorCode::SanctionedAddress`.

### Integrity via Nullifiers
Even in a private system, we must ensure fairness (no double-spending).

*   **Mechanism**: Every ZK proof generates a unique deterministic **Nullifier** (`Hash(secret + campaign_id)`).
*   **Check**: The contract stores this Nullifier on-chain (`Nullifier` PDA).
*   **Enforcement**: If the same Nullifier is seen again, the contract rejects the transaction (`ErrorCode::AccountAlreadyInitialized`), preventing a user from secretly donating the same funds twice.
