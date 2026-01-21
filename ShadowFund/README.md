# ShadowFund 🌑

**Privacy-First Crowdfunding on Solana**

ShadowFund is a decentralized crowdfunding platform designed for the modern era, prioritizing user privacy and regulatory compliance. Built on Solana, it leverages zero-knowledge proofs to allow backers to support campaigns anonymously while ensuring ensuring compatibility with global anti-money laundering (AML) standards (via OFAC screening).

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-Hackathon%20Prototype-orange.svg)

## ✨ Key Features

- **🛡️ Shielded Donations**: Backers can donate SOL without revealing their public address on the campaign ledger (Mocked implementation using mocked ShadowWire SDK).
- **✅ Automated Compliance**: Optional integration with Range Protocol to block deposits from sanctioned (OFAC) wallets (Mocked).
- **🔒 Zero-Knowledge Proofs**: Uses Noir circuits to generating valid proofs of deposit without linking sender to receiver (Circuit implemented in `circuits/`, verification mocked on-chain).
- **💎 Premium UX**: A generic, "crypto" feel is replaced with a high-end, dark-mode "Shadow" aesthetic featuring glassmorphism and liquid animations.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, Tailwind CSS, React Hot Toast, Solana Wallet Adapter.
- **Smart Contract**: Anchor Framework (Rust).
- **Privacy Engine**: Noir (ZK-SNARKs).
- **Blockchain**: Solana (Localnet/Devnet).

## � Documentation
- [Architecture & Privacy Design](docs/ARCHITECTURE.md) - Detailed explanation of data storage, PDAs, and the Privacy Model.

## �🚀 Getting Started

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor](https://www.anchor-lang.com/docs/installation)
- [Node.js](https://nodejs.org/) (v18+)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/danielbolsson/solanahack.git
   cd solanahack/ShadowFund
   ```

2. **Install Dependencies**
   ```bash
   # Install Frontend dependencies
   cd web
   npm install
   
   # Install Anchor dependencies (from root)
   cd ..
   anchor build
   ```

### Running Locally

1. **Start Solana Validator**
   Run a local test validator in a separate terminal:
   ```bash
   solana-test-validator --reset
   ```

2. **Deploy Smart Contract**
   Build and deploy the Anchor program:
   ```bash
   anchor build
   anchor deploy
   ```
   *Note: Ensure the program ID in `anchor/programs/shadow-fund/src/lib.rs` and `Anchor.toml` matches your deployed ID.*

3. **Start Frontend**
   ```bash
   cd web
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## ⚙️ Configuration

### Setting the Treasury
To enable withdrawals and collect the 5% platform fee, you must initialize the on-chain config with your treasury address.

1.  **Navigate to anchor directory**
    ```bash
    cd anchor
    ```
2.  **Run the Initialization Script**
    Replace `<YOUR_WALLET_ADDRESS>` with the address that should receive fees.
    ```bash
    export ANCHOR_WALLET=~/.config/solana/id.json
    export ANCHOR_PROVIDER_URL=http://127.0.0.1:8899
    node scripts/initialize-treasury.js <YOUR_WALLET_ADDRESS>
    ```

## ⚠️ Privacy Implementation Note (Hackathon Status)

This project is a **functional prototype**. While the user flows and ZK circuit logic (`main.nr`) are implemented, the actual on-chain cryptographic verification is **mocked** for this demonstration due to environment limitations (missing `nargo` compiler).
- **Donations** are processed via standard transfers but are visually treated as "shielded".
- **Compliance checks** currently return `true` (pass) by default.

## 📄 License

MIT License
