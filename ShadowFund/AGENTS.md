# AGENTS.md - ShadowFund

Guidelines for AI coding agents working in this repository.

## Project Overview

ShadowFund is a privacy-first crowdfunding platform on Solana using zero-knowledge proofs.

**Architecture:**
- `anchor/` - Solana smart contract (Anchor/Rust)
- `web/` - Next.js frontend (TypeScript/React)
- `circuits/` - Zero-knowledge circuits (Noir)

---

## Build / Lint / Test Commands

### Anchor (Smart Contract)
```bash
cd anchor
anchor build                                    # Build program
anchor deploy                                   # Deploy to devnet
anchor test                                     # Run all tests
yarn run mocha -t 1000000 tests/<file>.ts       # Run single test
npm run lint                                    # Check formatting (Prettier)
npm run lint:fix                                # Fix formatting
```

### Web (Frontend)
```bash
cd web
npm install                                     # Install dependencies
npm run dev                                     # Development server
npm run build                                   # Production build
npm run lint                                    # ESLint
```

### Circuits (Noir ZK)
```bash
cd circuits
nargo compile                                   # Compile circuit
nargo prove                                     # Generate proof
```

### Local Development
```bash
solana-test-validator --reset                   # Start local validator
cd anchor && anchor build && anchor deploy      # Deploy locally
node scripts/initialize-treasury.js <WALLET>   # Initialize treasury
cd web && npm run dev                           # Start frontend
```

---

## Code Style Guidelines

### TypeScript / React (web/)

**Imports:** React/Next.js first, external libraries, then local imports with `@/` alias.

**Components:**
- Functional components: `export default function ComponentName()`
- Client components: `"use client";` directive at top
- PascalCase for component names

**TypeScript:**
- Strict mode enabled
- Define interfaces for complex types
- Use `@ts-ignore` sparingly with documentation

**Styling:**
- Tailwind CSS with CSS variables: `var(--color-teal-500)`
- Glass morphism: `glass-panel` class
- Mobile-first responsive: `md:`, `lg:` breakpoints

**Error Handling:**
```typescript
const toastId = toast.loading('Creating...');
try {
  // operation
  toast.success('Success!', { id: toastId });
} catch (err: any) {
  console.error('Error:', err);
  toast.error(err.message || 'Failed', { id: toastId });
}
```

### Rust / Anchor (anchor/)

**Naming:**
- `snake_case` for functions/variables
- `PascalCase` for types/structs/enums
- `SCREAMING_SNAKE_CASE` for constants

**Anchor Patterns:**
- Program ID: `declare_id!("...")`
- Instructions in `#[program]` module
- PDAs with `seeds` and `bump` attributes
- Validation with `require!()` macro

**Error Handling:**
```rust
#[error_code]
pub enum ErrorCode {
    #[msg("Target amount must be positive")]
    InvalidTarget,
}
```

**Account Validation:**
- `has_one` for ownership checks
- `/// CHECK:` comments for unchecked accounts

### Noir Circuits (circuits/)
- Compiler: `>=0.22.0`
- Use `std::hash::pedersen_hash` for commitments
- Document public vs private inputs

---

## Project-Specific Patterns

**Program ID:** `3UnENRqs8b2EVZAkUaWLmKwyTL7ecpuGhCLrsT4cjsdW`

**PDA Seeds:**
- Config: `[b"config"]`
- Campaign: `[b"campaign", owner_pubkey, campaign_id]`
- Backer: `[b"backer", campaign_pubkey, backer_pubkey]`

**Fee:** 5% (500 basis points)

**IDL:** Copy `anchor/target/idl/shadow_fund.json` to `web/idl/` after builds

---

## Testing

- Framework: Mocha/Chai in `anchor/tests/`
- Timeout: 1000000ms for blockchain ops
- Provider: `anchor.AnchorProvider.env()`

---

## Important Notes

1. ZK verification is mocked (hackathon prototype)
2. Compliance checks return `true` by default
3. Update IDL in `web/idl/` after `anchor build`
4. Default cluster: devnet (see `Anchor.toml`)
5. Initialize treasury before withdrawals work
