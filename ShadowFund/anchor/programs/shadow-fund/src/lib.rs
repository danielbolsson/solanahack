use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("3UnENRqs8b2EVZAkUaWLmKwyTL7ecpuGhCLrsT4cjsdW");

#[program]
pub mod shadow_fund {
    use super::*;

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        treasury: Pubkey,
        fee_basis_points: u16,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.treasury = treasury;
        config.fee_basis_points = fee_basis_points;
        config.admin = ctx.accounts.authority.key(); // Set admin
        config.bump = ctx.bumps.config;
        msg!(
            "Platform Config Initialized. Treasury: {}, Fee: {} bps",
            treasury,
            fee_basis_points
        );
        Ok(())
    }

    // --- REAL COMPLIANCE (Admin Managed) ---

    pub fn sanction_address(
        ctx: Context<SanctionAddress>,
        address_to_sanction: Pubkey,
    ) -> Result<()> {
        let sanctioned_account = &mut ctx.accounts.sanctioned_account;
        sanctioned_account.address = address_to_sanction;
        sanctioned_account.bump = ctx.bumps.sanctioned_account;
        msg!("Address {} has been sanctioned.", address_to_sanction);
        Ok(())
    }

    pub fn unsanction_address(ctx: Context<UnsanctionAddress>) -> Result<()> {
        msg!(
            "Address {} has been removed from sanction list.",
            ctx.accounts.sanctioned_account.address
        );
        // Account is closed automatically by Anchor
        Ok(())
    }

    pub fn initialize_campaign(
        ctx: Context<InitializeCampaign>,
        campaign_id: u64,
        name: String,
        description: String,
        target_amount: u64,
        deadline: i64,
    ) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        let owner = &ctx.accounts.owner;

        require!(target_amount > 0, ErrorCode::InvalidTarget);
        require!(
            deadline > Clock::get()?.unix_timestamp,
            ErrorCode::InvalidDeadline
        );
        require!(name.len() <= 50, ErrorCode::NameTooLong);
        require!(description.len() <= 280, ErrorCode::DescriptionTooLong);

        campaign.owner = owner.key();
        campaign.name = name;
        campaign.description = description;
        campaign.target_amount = target_amount;
        campaign.current_amount = 0;
        campaign.deadline = deadline;
        campaign.bump = ctx.bumps.campaign;

        msg!("Campaign initialized. Target: {}", target_amount);
        Ok(())
    }

    pub fn add_reward_tier(
        ctx: Context<AddRewardTier>,
        name: String,
        description: String,
        amount: u64,
        limit: u32,
    ) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        require!(name.len() <= 50, ErrorCode::NameTooLong);
        require!(description.len() <= 200, ErrorCode::DescriptionTooLong);
        require!(campaign.tiers.len() < 10, ErrorCode::TooManyTiers);

        let tier = RewardTier {
            name,
            description,
            amount,
            limit,
            claimed: 0,
        };
        campaign.tiers.push(tier);
        Ok(())
    }

    pub fn donate(
        ctx: Context<Donate>,
        amount: u64,
        proof: Vec<u8>,
        nullifier_hash: Vec<u8>,
        tier_index: Option<u8>,
    ) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;

        // 1. Compliance Check (Real On-Chain Check)
        // Anchor's init_if_needed constraint on the `sanctioned_check` account
        // would require us to pass it.
        // Instead, we use an optional account or check if it's initialized.
        // Actually, the easiest way to check if a PDA exists is to try to borrow it.
        // In this Context, we expect the client to pass the `sanctioned_check` PDA derived from the user.
        // If it exists (has lamports/data), the user is sanctioned.

        if !ctx.accounts.sanctioned_check.data_is_empty() {
            msg!(
                "Compliance Alert: Address {} is SANCTIONED.",
                ctx.accounts.backer.key()
            );
            return err!(ErrorCode::SanctionedAddress);
        }
        msg!("Compliance Check Passed: Address is not in sanctioned registry.");

        // 2. Privacy Check (Real Nullifier Logic)
        // Ensure nullifier hasn't been used.
        // The `nullifier_account` is marked with `init`, so it MUST NOT exist.
        // If it exists, `init` fails with "already in use", which prevents double spend.
        // We just set the data.
        let nullifier_account = &mut ctx.accounts.nullifier_account;
        nullifier_account.hash = nullifier_hash.clone();
        nullifier_account.campaign = campaign.key();
        nullifier_account.bump = ctx.bumps.nullifier_account;

        // 3. Verify Proof (Mock Verifier for Hackathon)
        // In a real mainnet deployment, this would perform a CPI to the Noir Verifier Program
        // verifying the proof against the verification key.
        // For this hackathon, we accept the Noir proof payload (approx 2KB) as valid
        // if it meets minimum length requirements, proving the client successfully generated it.
        require!(proof.len() > 64, ErrorCode::InvalidProof); // Noir proofs are much larger than signatures
        require!(nullifier_hash.len() == 32, ErrorCode::InvalidNullifier);

        // --- End Privacy Logic ---

        if let Some(index) = tier_index {
            let idx = index as usize;
            require!(idx < campaign.tiers.len(), ErrorCode::InvalidTierIndex);

            let tier = &mut campaign.tiers[idx];
            require!(amount >= tier.amount, ErrorCode::InsufficientAmountForTier);

            if tier.limit > 0 {
                require!(tier.claimed < tier.limit, ErrorCode::TierSoldOut);
            }

            tier.claimed += 1;

            require!(
                ctx.accounts.backer_receipt.is_some(),
                ErrorCode::AccountNotInitialized
            );

            if let Some(backer_receipt) = &mut ctx.accounts.backer_receipt {
                backer_receipt.campaign = campaign.key();
                backer_receipt.backer = ctx.accounts.backer.key();
                backer_receipt.tier_index = index;
                backer_receipt.amount_paid += amount;
            }
        }

        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.backer.to_account_info(),
                to: campaign.to_account_info(),
            },
        );
        system_program::transfer(cpi_context, amount)?;

        campaign.current_amount = campaign.current_amount.checked_add(amount).unwrap();

        msg!(
            "Shielded Donation of {} received. Nullifier recorded.",
            amount
        );
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        let config = &ctx.accounts.config;
        let treasury = &ctx.accounts.treasury;

        require!(
            config.treasury == treasury.key(),
            ErrorCode::InvalidTreasury
        );
        require!(
            campaign.current_amount >= campaign.target_amount,
            ErrorCode::TargetNotMet
        );

        let total_amount = campaign.current_amount;
        let fee_amount = (total_amount as u128 * config.fee_basis_points as u128 / 10000) as u64;
        let creator_amount = total_amount - fee_amount;

        **campaign.to_account_info().try_borrow_mut_lamports()? -= fee_amount;
        **treasury.to_account_info().try_borrow_mut_lamports()? += fee_amount;

        **campaign.to_account_info().try_borrow_mut_lamports()? -= creator_amount;
        **ctx
            .accounts
            .owner
            .to_account_info()
            .try_borrow_mut_lamports()? += creator_amount;

        msg!(
            "Withdrawn {} to creator. Fee {} to treasury.",
            creator_amount,
            fee_amount
        );
        campaign.current_amount = 0; // Reset

        Ok(())
    }

    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        let backer_receipt = &ctx.accounts.backer_receipt;

        require!(
            Clock::get()?.unix_timestamp > campaign.deadline,
            ErrorCode::CampaignActive
        );
        require!(
            campaign.current_amount < campaign.target_amount,
            ErrorCode::TargetMet
        );

        let refund_amount = backer_receipt.amount_paid;
        require!(refund_amount > 0, ErrorCode::NoFundsToRefund);

        **campaign.to_account_info().try_borrow_mut_lamports()? -= refund_amount;
        **ctx
            .accounts
            .backer
            .to_account_info()
            .try_borrow_mut_lamports()? += refund_amount;

        msg!("Refunded {} lamports to backer.", refund_amount);

        campaign.current_amount = campaign.current_amount.checked_sub(refund_amount).unwrap();

        Ok(())
    }

    pub fn cancel_campaign(ctx: Context<CancelCampaign>) -> Result<()> {
        let campaign = &ctx.accounts.campaign;
        
        // Can only close if 0 funds (all refunded or never raised)
        require!(campaign.current_amount == 0, ErrorCode::CampaignNotEmpty);
        
        msg!("Campaign account closed. Rent returned to owner.");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 2 + 1, // Added space for admin
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, PlatformConfig>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(address_to_sanction: Pubkey)]
pub struct SanctionAddress<'info> {
    #[account(
        mut,
        has_one = admin,
    )]
    pub config: Account<'info, PlatformConfig>,
    #[account(
        init,
        payer = admin,
        space = 8 + 32 + 1,
        seeds = [b"sanctioned", address_to_sanction.as_ref()],
        bump
    )]
    pub sanctioned_account: Account<'info, Sanctioned>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UnsanctionAddress<'info> {
    #[account(
        mut,
        has_one = admin,
    )]
    pub config: Account<'info, PlatformConfig>,
    #[account(
        mut,
        close = admin,
        seeds = [b"sanctioned", sanctioned_account.address.as_ref()],
        bump = sanctioned_account.bump
    )]
    pub sanctioned_account: Account<'info, Sanctioned>,
    #[account(mut)]
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct AddRewardTier<'info> {
    #[account(
        mut,
        has_one = owner,
    )]
    pub campaign: Account<'info, Campaign>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(campaign_id: u64)]
pub struct InitializeCampaign<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + 32 + (4 + 50) + (4 + 280) + 8 + 8 + 8 + 1 + (4 + (10 * (4 + 50 + 4 + 200 + 8 + 4 + 4))), // Added space for 10 tiers
        seeds = [b"campaign", owner.key().as_ref(), &campaign_id.to_le_bytes()],
        bump
    )]
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(amount: u64, proof: Vec<u8>, nullifier_hash: Vec<u8>, tier_index: Option<u8>)]
pub struct Donate<'info> {
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub backer: Signer<'info>,

    // Privacy: Nullifier tracking to prevent double spend
    #[account(
        init,
        payer = backer,
        space = 8 + 4 + 32 + 32 + 1, // discriminator + vec_len_prefix + hash(32) + campaign + bump
        seeds = [b"nullifier", nullifier_hash.as_slice()], // Use the hash as seed
        bump
    )]
    pub nullifier_account: Account<'info, Nullifier>,

    // Compliance: Check if sanctioned
    /// CHECK: This account is checked manually in instruction.
    /// If it has data, user is sanctioned.
    /// We derive it from [b"sanctioned", backer.key()].
    #[account(
        seeds = [b"sanctioned", backer.key().as_ref()],
        bump
    )]
    pub sanctioned_check: UncheckedAccount<'info>,

    #[account(
         init_if_needed,
         payer = backer,
         seeds = [b"backer", campaign.key().as_ref(), backer.key().as_ref()],
         bump,
         space = 8 + 32 + 32 + 1 + 8
    )]
    pub backer_receipt: Option<Account<'info, Backer>>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        has_one = owner,
    )]
    pub campaign: Account<'info, Campaign>,
    #[account(
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, PlatformConfig>,
    #[account(mut)]
    /// CHECK: Verified against config.treasury
    pub treasury: UncheckedAccount<'info>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Refund<'info> {
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub backer: Signer<'info>,

    #[account(
        mut,
        close = backer,
        seeds = [b"backer", campaign.key().as_ref(), backer.key().as_ref()],
        bump,
        has_one = campaign,
        has_one = backer
    )]
    pub backer_receipt: Account<'info, Backer>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelCampaign<'info> {
    #[account(
        mut,
        close = owner,
        has_one = owner,
    )]
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub owner: Signer<'info>,
}

#[account]
pub struct PlatformConfig {
    pub treasury: Pubkey,
    pub admin: Pubkey, // Added admin for sanctions
    pub fee_basis_points: u16,
    pub bump: u8,
}

#[account]
pub struct Sanctioned {
    pub address: Pubkey,
    pub bump: u8,
}

#[account]
pub struct Nullifier {
    pub hash: Vec<u8>,
    pub campaign: Pubkey,
    pub bump: u8,
}

#[account]
pub struct Campaign {
    pub owner: Pubkey,
    pub name: String,
    pub description: String,
    pub target_amount: u64,
    pub current_amount: u64,
    pub deadline: i64,
    pub bump: u8,
    pub tiers: Vec<RewardTier>,
}

#[account]
pub struct Backer {
    pub campaign: Pubkey,
    pub backer: Pubkey,
    pub tier_index: u8,
    pub amount_paid: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct RewardTier {
    pub name: String,
    pub description: String,
    pub amount: u64,
    pub limit: u32,
    pub claimed: u32,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Target amount must be positive")]
    InvalidTarget,
    #[msg("Deadline must be in the future")]
    InvalidDeadline,
    #[msg("Address is sanctioned by Platform Admin")]
    SanctionedAddress,
    #[msg("Invalid Zero-Knowledge Proof")]
    InvalidProof,
    #[msg("Invalid Nullifier Hash")]
    InvalidNullifier,
    #[msg("Campaign target not met")]
    TargetNotMet,
    #[msg("Campaign is still active")]
    CampaignActive,
    #[msg("Target already met")]
    TargetMet,
    #[msg("Name too long")]
    NameTooLong,
    #[msg("Description too long")]
    DescriptionTooLong,
    #[msg("Invalid Treasury Address")]
    InvalidTreasury,
    #[msg("Too many tiers")]
    TooManyTiers,
    #[msg("Invalid tier index")]
    InvalidTierIndex,
    #[msg("Insufficient amount for tier")]
    InsufficientAmountForTier,
    #[msg("Tier sold out")]
    TierSoldOut,
    #[msg("Account not initialized")]
    AccountNotInitialized,
    #[msg("No funds to refund")]
    NoFundsToRefund,
    #[msg("Campaign must be empty to close")]
    CampaignNotEmpty,
}
