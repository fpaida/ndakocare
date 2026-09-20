
-- ============================================================
-- NdakoCare Database Migration 005
-- Community Wallet V2 — Database Foundation
-- ============================================================
--
-- PURPOSE
-- Private communities, existing wallet_id membership, preferred currencies,
-- multi-currency contribution records, and RLS.
--
-- IMPORTANT FINANCIAL RULE
-- NdakoCare does not hold customer funds.
-- Actual payment processing, FX conversion, and settlement
-- must be performed by an appropriately licensed partner.
--
-- This migration DOES NOT:
--   - debit customer wallets
--   - credit community balances
--   - create settled contributions
--   - simulate real payment confirmation
--   - integrate with a payment provider
--
-- Those workflows will be implemented separately.
-- ============================================================

BEGIN;


-- ============================================================
-- 1. COMMUNITY WALLETS
-- ============================================================

-- The community's preferred destination currency.
-- Existing legacy communities, if any, default to USD.

ALTER TABLE public.community_wallets
ADD COLUMN IF NOT EXISTS preferred_currency text;

UPDATE public.community_wallets
SET preferred_currency = 'USD'
WHERE preferred_currency IS NULL;

ALTER TABLE public.community_wallets
ALTER COLUMN preferred_currency SET DEFAULT 'USD';

ALTER TABLE public.community_wallets
ALTER COLUMN preferred_currency SET NOT NULL;


-- Communities are private by default.

ALTER TABLE public.community_wallets
ADD COLUMN IF NOT EXISTS visibility text;

UPDATE public.community_wallets
SET visibility = 'private'
WHERE visibility IS NULL;

ALTER TABLE public.community_wallets
ALTER COLUMN visibility SET DEFAULT 'private';

ALTER TABLE public.community_wallets
ALTER COLUMN visibility SET NOT NULL;


-- Community lifecycle.

ALTER TABLE public.community_wallets
ADD COLUMN IF NOT EXISTS status text;

UPDATE public.community_wallets
SET status = 'active'
WHERE status IS NULL;

ALTER TABLE public.community_wallets
ALTER COLUMN status SET DEFAULT 'active';

ALTER TABLE public.community_wallets
ALTER COLUMN status SET NOT NULL;


-- Restrict preferred currencies to the nine currencies
-- currently supported by NdakoCare.

ALTER TABLE public.community_wallets
DROP CONSTRAINT IF EXISTS community_wallets_currency_check;

ALTER TABLE public.community_wallets
ADD CONSTRAINT community_wallets_currency_check
CHECK (
  preferred_currency IN (
    'USD',
    'EUR',
    'XAF',
    'XOF',
    'CDF',
    'NGN',
    'KES',
    'GHS',
    'ZAR'
  )
);


ALTER TABLE public.community_wallets
DROP CONSTRAINT IF EXISTS community_wallets_visibility_check;

ALTER TABLE public.community_wallets
ADD CONSTRAINT community_wallets_visibility_check
CHECK (
  visibility = 'private'
);


ALTER TABLE public.community_wallets
DROP CONSTRAINT IF EXISTS community_wallets_status_check;

ALTER TABLE public.community_wallets
ADD CONSTRAINT community_wallets_status_check
CHECK (
  status IN (
    'active',
    'paused',
    'closed'
  )
);


-- Protect the community balance from negative values.

ALTER TABLE public.community_wallets
DROP CONSTRAINT IF EXISTS community_wallets_balance_nonnegative_check;

ALTER TABLE public.community_wallets
ADD CONSTRAINT community_wallets_balance_nonnegative_check
CHECK (
  balance IS NOT NULL
  AND balance >= 0
);


-- Link community ownership to Supabase Auth.

ALTER TABLE public.community_wallets
DROP CONSTRAINT IF EXISTS community_wallets_owner_id_fkey;

ALTER TABLE public.community_wallets
ADD CONSTRAINT community_wallets_owner_id_fkey
FOREIGN KEY (owner_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;


-- ============================================================
-- 2. COMMUNITY MEMBERSHIP
-- ============================================================

-- Existing NdakoCare schema uses wallet_id, not community_id.
-- Preserve that column and the existing community_members table.
CREATE TABLE IF NOT EXISTS public.community_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.community_wallets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_members
ADD COLUMN IF NOT EXISTS status text;

UPDATE public.community_members
SET status = 'active'
WHERE status IS NULL;

ALTER TABLE public.community_members
ALTER COLUMN status SET DEFAULT 'invited';

ALTER TABLE public.community_members
ALTER COLUMN status SET NOT NULL;

ALTER TABLE public.community_members
DROP CONSTRAINT IF EXISTS community_members_role_check;

ALTER TABLE public.community_members
ADD CONSTRAINT community_members_role_check
CHECK (role IN ('owner', 'member'));

ALTER TABLE public.community_members
DROP CONSTRAINT IF EXISTS community_members_status_check;

ALTER TABLE public.community_members
ADD CONSTRAINT community_members_status_check
CHECK (status IN ('invited', 'active', 'removed'));

-- No duplicate memberships for the same user and wallet.
CREATE UNIQUE INDEX IF NOT EXISTS community_members_wallet_user_unique
ON public.community_members(wallet_id, user_id);

CREATE INDEX IF NOT EXISTS idx_community_members_user_id
ON public.community_members(user_id);

CREATE INDEX IF NOT EXISTS idx_community_members_wallet_id
ON public.community_members(wallet_id);


-- ============================================================
-- 3. COMMUNITY CONTRIBUTIONS
-- ============================================================

-- Existing amount represents the amount credited
-- in the community's preferred currency.
--
-- Source amount and source currency describe
-- what the contributor paid through the partner.

ALTER TABLE public.community_contributions
ADD COLUMN IF NOT EXISTS source_amount numeric;


ALTER TABLE public.community_contributions
ADD COLUMN IF NOT EXISTS source_currency text;


ALTER TABLE public.community_contributions
ADD COLUMN IF NOT EXISTS currency text;


ALTER TABLE public.community_contributions
ADD COLUMN IF NOT EXISTS exchange_rate numeric;


ALTER TABLE public.community_contributions
ADD COLUMN IF NOT EXISTS fee_amount numeric;


ALTER TABLE public.community_contributions
ADD COLUMN IF NOT EXISTS fee_currency text;


-- Provider identification and settlement reference.

ALTER TABLE public.community_contributions
ADD COLUMN IF NOT EXISTS provider_id text;


ALTER TABLE public.community_contributions
ADD COLUMN IF NOT EXISTS provider_reference text;


-- Distinguish requested, processing, completed,
-- failed, and cancelled contributions.

ALTER TABLE public.community_contributions
ADD COLUMN IF NOT EXISTS status text;


ALTER TABLE public.community_contributions
ALTER COLUMN status SET DEFAULT 'pending';


-- Simulated development records must never be
-- presented as real settled customer funds.

ALTER TABLE public.community_contributions
ADD COLUMN IF NOT EXISTS is_simulated boolean;


ALTER TABLE public.community_contributions
ALTER COLUMN is_simulated SET DEFAULT false;


-- This timestamp is reserved for verified
-- partner-confirmed settlement.

ALTER TABLE public.community_contributions
ADD COLUMN IF NOT EXISTS settled_at timestamptz;


-- Store the partner quote identifier, where available.

ALTER TABLE public.community_contributions
ADD COLUMN IF NOT EXISTS quote_reference text;


-- An optional idempotency key for safe retries.

ALTER TABLE public.community_contributions
ADD COLUMN IF NOT EXISTS idempotency_key text;


-- Link contributors to Supabase Auth.

ALTER TABLE public.community_contributions
DROP CONSTRAINT IF EXISTS community_contributions_user_id_fkey;

ALTER TABLE public.community_contributions
ADD CONSTRAINT community_contributions_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;


-- Validate contribution amounts.

ALTER TABLE public.community_contributions
DROP CONSTRAINT IF EXISTS community_contributions_amount_check;

ALTER TABLE public.community_contributions
ADD CONSTRAINT community_contributions_amount_check
CHECK (
  amount IS NULL
  OR amount > 0
);


ALTER TABLE public.community_contributions
DROP CONSTRAINT IF EXISTS community_contributions_source_amount_check;

ALTER TABLE public.community_contributions
ADD CONSTRAINT community_contributions_source_amount_check
CHECK (
  source_amount IS NULL
  OR source_amount > 0
);


ALTER TABLE public.community_contributions
DROP CONSTRAINT IF EXISTS community_contributions_exchange_rate_check;

ALTER TABLE public.community_contributions
ADD CONSTRAINT community_contributions_exchange_rate_check
CHECK (
  exchange_rate IS NULL
  OR exchange_rate > 0
);


ALTER TABLE public.community_contributions
DROP CONSTRAINT IF EXISTS community_contributions_fee_check;

ALTER TABLE public.community_contributions
ADD CONSTRAINT community_contributions_fee_check
CHECK (
  fee_amount IS NULL
  OR fee_amount >= 0
);


ALTER TABLE public.community_contributions
DROP CONSTRAINT IF EXISTS community_contributions_status_check;

ALTER TABLE public.community_contributions
ADD CONSTRAINT community_contributions_status_check
CHECK (
  status IS NULL
  OR status IN (
    'pending',
    'processing',
    'completed',
    'failed',
    'cancelled'
  )
);


-- Prevent duplicate provider settlement references.

CREATE UNIQUE INDEX IF NOT EXISTS
community_contributions_provider_reference_unique
ON public.community_contributions (
  provider_id,
  provider_reference
)
WHERE
  provider_id IS NOT NULL
  AND provider_reference IS NOT NULL;


-- Prevent duplicate contribution requests.

CREATE UNIQUE INDEX IF NOT EXISTS
community_contributions_user_idempotency_unique
ON public.community_contributions (
  user_id,
  idempotency_key
)
WHERE
  idempotency_key IS NOT NULL;


-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.community_wallets
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.community_members
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.community_contributions
ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 5. COMMUNITY ACCESS HELPERS
-- ============================================================

-- SECURITY DEFINER avoids recursive RLS when checking membership.
-- These read-only helpers use the authenticated caller's auth.uid().
-- The database function owner must be a trusted role with permission
-- to read the underlying tables; never grant function ownership to users.

CREATE OR REPLACE FUNCTION public.ndakocare_is_active_community_member(
  p_community_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.community_members AS cm
    WHERE cm.wallet_id = p_community_id
      AND cm.user_id = (SELECT auth.uid())
      AND cm.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.ndakocare_is_community_owner(
  p_community_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.community_wallets AS cw
    WHERE cw.id = p_community_id
      AND cw.owner_id = (SELECT auth.uid())
  );
$$;

REVOKE ALL
ON FUNCTION public.ndakocare_is_active_community_member(uuid)
FROM PUBLIC, anon;

REVOKE ALL
ON FUNCTION public.ndakocare_is_community_owner(uuid)
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.ndakocare_is_active_community_member(uuid)
TO authenticated;

GRANT EXECUTE
ON FUNCTION public.ndakocare_is_community_owner(uuid)
TO authenticated;


-- ============================================================
-- 6. COMMUNITY WALLET AND MEMBERSHIP POLICIES
-- ============================================================

-- Owners and active members may read their communities.

DROP POLICY IF EXISTS
"community_wallets_owner_select"
ON public.community_wallets;

DROP POLICY IF EXISTS
"community_wallets_access_select"
ON public.community_wallets;

CREATE POLICY
"community_wallets_access_select"
ON public.community_wallets
FOR SELECT
TO authenticated
USING (
  owner_id = (SELECT auth.uid())
  OR public.ndakocare_is_active_community_member(id)
);

-- An authenticated user may create a private community
-- under their own ownership with an initial zero balance.

DROP POLICY IF EXISTS
"community_wallets_owner_insert"
ON public.community_wallets;

CREATE POLICY
"community_wallets_owner_insert"
ON public.community_wallets
FOR INSERT
TO authenticated
WITH CHECK (
  owner_id = (SELECT auth.uid())
  AND balance = 0
  AND visibility = 'private'
  AND status = 'active'
);

-- Users may read their own membership records.
-- Owners may read membership records for communities they own.

DROP POLICY IF EXISTS
"community_members_self_select"
ON public.community_members;

DROP POLICY IF EXISTS
"community_members_access_select"
ON public.community_members;

CREATE POLICY
"community_members_access_select"
ON public.community_members
FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR public.ndakocare_is_community_owner(wallet_id)
);

-- No browser UPDATE/DELETE policy for community wallets.
-- No browser INSERT/UPDATE/DELETE policy for membership.
-- Invitations and membership changes require server-side workflows.
-- Community balances must not be edited directly from the browser.


-- ============================================================
-- 7. CONTRIBUTION POLICIES
-- ============================================================

-- Contributors may view their own contribution records.

DROP POLICY IF EXISTS
"community_contributions_self_select"
ON public.community_contributions;

CREATE POLICY
"community_contributions_self_select"
ON public.community_contributions
FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.uid())
);


-- No direct browser-side contribution INSERT,
-- UPDATE, or DELETE policies.
--
-- A verified provider settlement workflow
-- will create completed contribution records.


-- ============================================================
-- 8. TABLE PRIVILEGES
-- ============================================================

-- Prevent direct browser-side community balance changes.

REVOKE UPDATE, DELETE
ON public.community_wallets
FROM PUBLIC, anon, authenticated;


-- Prevent direct browser-side membership changes.

REVOKE INSERT, UPDATE, DELETE
ON public.community_members
FROM PUBLIC, anon, authenticated;


-- Prevent direct browser-side financial record changes.

REVOKE INSERT, UPDATE, DELETE
ON public.community_contributions
FROM PUBLIC, anon, authenticated;


-- Authenticated users can read only rows
-- permitted by their RLS policies.

GRANT SELECT
ON public.community_wallets
TO authenticated;

GRANT INSERT
ON public.community_wallets
TO authenticated;

GRANT SELECT
ON public.community_members
TO authenticated;

GRANT SELECT
ON public.community_contributions
TO authenticated;


-- ============================================================
-- 9. DOCUMENTATION
-- ============================================================

COMMENT ON TABLE public.community_wallets IS
'NdakoCare community fundraising records. Customer funds are managed by licensed financial partners.';


COMMENT ON TABLE public.community_members IS
'Private community membership and access records.';


COMMENT ON TABLE public.community_contributions IS
'Community contribution records, including source currency, destination currency, provider reference, and settlement status.';


COMMENT ON COLUMN public.community_wallets.balance IS
'Displayed community balance in preferred_currency. Real funds must be confirmed by the licensed partner before crediting.';


COMMENT ON COLUMN public.community_contributions.is_simulated IS
'Identifies development-only simulated contribution records. Simulated transactions must never be represented as real settled funds.';


COMMIT;

-- ============================================================
-- END OF COMMUNITY WALLET V2 MIGRATION 005
-- ============================================================