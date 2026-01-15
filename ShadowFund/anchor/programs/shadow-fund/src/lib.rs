use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("HNnG2p8trr7N1HdfMEtx4e5ARwZnamhG6X7wib9AiE12");

#[program]
pub mod shadow_fund {
    use super::*;

    pub fn initialize_config(ctx: Context<InitializeConfig>, treasury: Pubkey, fee_basis_points: u16) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.treasury = treasury;
        config.fee_basis_points = fee_basis_points;
        config.bump = ctx.bumps.config;
        msg!("Platform Config Initialized. Treasury: {}, Fee: {} bps", treasury, fee_basis_points);
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
        require!(deadline > Clock::get()?.unix_timestamp, ErrorCode::InvalidDeadline);
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

    pub fn donate(ctx: Context<Donate>, amount: u64, is_sanctioned: bool) -> Result<()> {
        // 1. Compliance Check (Mock Range Protocol)
        require!(!is_sanctioned, ErrorCode::SanctionedAddress);

        // 2. Shielded Transfer (Mock ShadowWire)
        let campaign = &mut ctx.accounts.campaign;
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.backer.to_account_info(),
                to: campaign.to_account_info(), 
            },
        );
        system_program::transfer(cpi_context, amount)?;

        campaign.current_amount = campaign.current_amount.checked_add(amount).unwrap();

        msg!("Shielded Donation of {} received. Total: {}", amount, campaign.current_amount);
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        let config = &ctx.accounts.config;
        let treasury = &ctx.accounts.treasury;
        
        // Check Config Match
        require!(config.treasury == treasury.key(), ErrorCode::InvalidTreasury);

        // Check if target met
        require!(campaign.current_amount >= campaign.target_amount, ErrorCode::TargetNotMet);
        
        let total_amount = campaign.current_amount;
        let fee_amount = (total_amount as u128 * config.fee_basis_points as u128 / 10000) as u64;
        let creator_amount = total_amount - fee_amount;

        // Transfer Fee to Treasury
        **campaign.to_account_info().try_borrow_mut_lamports()? -= fee_amount;
        **treasury.to_account_info().try_borrow_mut_lamports()? += fee_amount;

        // Transfer Remainder to Creator
        **campaign.to_account_info().try_borrow_mut_lamports()? -= creator_amount;
        **ctx.accounts.owner.to_account_info().try_borrow_mut_lamports()? += creator_amount;
        
        msg!("Withdrawn {} to creator. Fee {} to treasury.", creator_amount, fee_amount);
        campaign.current_amount = 0; // Reset
        
        Ok(())
    }

    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        
        require!(Clock::get()?.unix_timestamp > campaign.deadline, ErrorCode::CampaignActive);
        require!(campaign.current_amount < campaign.target_amount, ErrorCode::TargetMet);

        msg!("Refunds would require ZK Proof verification of deposit notes.");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 2 + 1,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, PlatformConfig>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(campaign_id: u64)]
pub struct InitializeCampaign<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + 32 + (4 + 50) + (4 + 280) + 8 + 8 + 8 + 1,
        seeds = [b"campaign", owner.key().as_ref(), &campaign_id.to_le_bytes()],
        bump
    )]
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Donate<'info> {
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub backer: Signer<'info>,
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
    pub backer: Signer<'info>, // Recipient
    pub system_program: Program<'info, System>,
}

#[account]
pub struct PlatformConfig {
    pub treasury: Pubkey,
    pub fee_basis_points: u16, // Example: 500 = 5%
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
}

#[error_code]
pub enum ErrorCode {
    #[msg("Target amount must be positive")]
    InvalidTarget,
    #[msg("Deadline must be in the future")]
    InvalidDeadline,
    #[msg("Address is sanctioned by Range Protocol")]
    SanctionedAddress,
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
}
