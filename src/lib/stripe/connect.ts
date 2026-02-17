import { stripe } from './client'
import type { ConnectAccountStatus, CreateConnectAccountParams, ConnectOnboardingParams } from './types'

/**
 * Create a Stripe Connect Express account for an organization
 */
export async function createConnectAccount(
  params: CreateConnectAccountParams
): Promise<string> {
  const { orgId, orgName, email, country = 'AU' } = params

  const account = await stripe.accounts.create({
    type: 'express',
    country,
    email,
    business_type: 'company',
    company: {
      name: orgName,
    },
    metadata: {
      orgId,
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  })

  return account.id
}

/**
 * Create an account link for onboarding
 */
export async function createOnboardingLink(
  params: ConnectOnboardingParams
): Promise<string> {
  const { accountId, refreshUrl, returnUrl } = params

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  })

  return accountLink.url
}

/**
 * Get the status of a Connect account
 */
export async function getAccountStatus(
  accountId: string
): Promise<ConnectAccountStatus> {
  const account = await stripe.accounts.retrieve(accountId)

  return {
    accountId: account.id,
    chargesEnabled: account.charges_enabled ?? false,
    payoutsEnabled: account.payouts_enabled ?? false,
    detailsSubmitted: account.details_submitted ?? false,
    requirements: account.requirements ?? undefined,
  }
}

/**
 * Create a login link for the Express dashboard
 */
export async function createDashboardLink(accountId: string): Promise<string> {
  const loginLink = await stripe.accounts.createLoginLink(accountId)
  return loginLink.url
}

/**
 * Check if an account is fully onboarded and can accept payments
 */
export async function isAccountReady(accountId: string): Promise<boolean> {
  const status = await getAccountStatus(accountId)
  return status.chargesEnabled && status.payoutsEnabled && status.detailsSubmitted
}
