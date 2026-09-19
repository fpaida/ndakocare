
-- ============================================================
-- NDAKOCARE - SAVINGS V2
-- Migration: 004_savings_v2.sql
--
-- Purpose:
--   Multi-currency savings goals and contributions.
--   Customer-owned Savings records.
--   Atomic wallet-to-savings contributions.
--   Financial ledger and idempotency protection.
--
-- IMPORTANT:
--   This migration assumes the existing NdakoCare base tables
--   have already been created.
--
--   The Savings V2 changes are already installed in the
--   current development database.
--
--   Do not execute this migration again in that database
--   during the Git documentation checkpoint.
-- ============================================================


-- ------------------------------------------------------------
-- 1. SAVINGS GOAL CURRENCY
-- ------------------------------------------------------------

ALTER TABLE public.savings_goals
ADD COLUMN IF NOT EXISTS currency text;

UPDATE public.savings_goals
SET currency = 'USD'
WHERE currency IS NULL;

ALTER TABLE public.savings_goals
ALTER COLUMN currency SET DEFAULT 'USD';

ALTER TABLE public.savings_goals
ALTER COLUMN currency SET NOT NULL;


-- ------------------------------------------------------------
-- 2. SAVINGS CONTRIBUTION CURRENCY
-- ------------------------------------------------------------

ALTER TABLE public.savings_contributions
ADD COLUMN IF NOT EXISTS currency text;

UPDATE public.savings_contributions
SET currency = 'USD'
WHERE currency IS NULL;

ALTER TABLE public.savings_contributions
ALTER COLUMN currency SET DEFAULT 'USD';

ALTER TABLE public.savings_contributions
ALTER COLUMN currency SET NOT NULL;


-- ------------------------------------------------------------
-- 3. SAVINGS USER FOREIGN KEYS
--
-- Preserve the existing ownership relationships.
-- ------------------------------------------------------------

DO $$
BEGIN

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.savings_goals'::regclass
      AND conname = 'savings_goals_user_id_fkey'
  ) THEN

    ALTER TABLE public.savings_goals
    ADD CONSTRAINT savings_goals_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

  END IF;


  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.savings_contributions'::regclass
      AND conname = 'savings_contributions_user_id_fkey'
  ) THEN

    ALTER TABLE public.savings_contributions
    ADD CONSTRAINT savings_contributions_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

  END IF;


  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.savings_contributions'::regclass
      AND conname = 'savings_contributions_goal_id_fkey'
  ) THEN

    ALTER TABLE public.savings_contributions
    ADD CONSTRAINT savings_contributions_goal_id_fkey
    FOREIGN KEY (goal_id)
    REFERENCES public.savings_goals(id);

  END IF;

END;
$$;


-- ------------------------------------------------------------
-- 4. ENABLE ROW LEVEL SECURITY
-- ------------------------------------------------------------

ALTER TABLE public.savings_goals
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.savings_contributions
ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- 5. SAVINGS GOALS - CUSTOMER SELECT
-- ------------------------------------------------------------

DROP POLICY IF EXISTS
"Users can view own savings goals"
ON public.savings_goals;

CREATE POLICY
"Users can view own savings goals"
ON public.savings_goals
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);


-- ------------------------------------------------------------
-- 6. SAVINGS GOALS - CUSTOMER INSERT
-- ------------------------------------------------------------

DROP POLICY IF EXISTS
"Users can create own savings goals"
ON public.savings_goals;

CREATE POLICY
"Users can create own savings goals"
ON public.savings_goals
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);


-- ------------------------------------------------------------
-- 7. SAVINGS CONTRIBUTIONS - CUSTOMER SELECT
--
-- Contributions are created by the financial RPC.
-- Customers cannot directly insert, update, or delete
-- contributions through browser RLS policies.
-- ------------------------------------------------------------

DROP POLICY IF EXISTS
"Users can view own savings contributions"
ON public.savings_contributions;

CREATE POLICY
"Users can view own savings contributions"
ON public.savings_contributions
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);


-- ------------------------------------------------------------
-- 8. ATOMIC SAVINGS CONTRIBUTION RPC
--
-- Preserves the verified function implementation.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION
public.ndakocare_create_savings_contribution_v2(
  p_goal_id uuid,
  p_amount numeric,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$

declare
  v_user_id uuid;
  v_goal_title text;
  v_currency text;
  v_target_amount numeric;
  v_current_amount numeric;
  v_new_saved_amount numeric;
  v_goal_status text;

  v_balance_before numeric;
  v_balance_after numeric;

  v_reference text;
  v_transaction_id uuid;
  v_existing_transaction_id uuid;

begin

  ------------------------------------------------------------------
  -- 1. AUTHENTICATION
  ------------------------------------------------------------------

  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required.';
  end if;


  ------------------------------------------------------------------
  -- 2. INPUT VALIDATION
  ------------------------------------------------------------------

  if p_goal_id is null then
    raise exception 'Savings goal is required.';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Contribution amount must be greater than zero.';
  end if;

  if p_idempotency_key is null
     or length(trim(p_idempotency_key)) = 0 then
    raise exception 'Idempotency key is required.';
  end if;


  ------------------------------------------------------------------
  -- 3. SERIALIZE THIS IDEMPOTENCY KEY
  --
  -- Prevents two simultaneous requests with the same key from
  -- processing the contribution twice.
  ------------------------------------------------------------------

  perform pg_advisory_xact_lock(
    hashtextextended(
      v_user_id::text
      || ':savings:'
      || trim(p_idempotency_key),
      0
    )
  );


  ------------------------------------------------------------------
  -- 4. IDEMPOTENCY CHECK
  ------------------------------------------------------------------

  select wt.id
  into v_existing_transaction_id
  from public.wallet_transactions wt
  where wt.user_id = v_user_id
    and wt.service_type = 'savings'
    and wt.idempotency_key = trim(p_idempotency_key)
  limit 1;

  if v_existing_transaction_id is not null then
    return jsonb_build_object(
      'success', true,
      'duplicate', true,
      'transaction_id', v_existing_transaction_id
    );
  end if;


  ------------------------------------------------------------------
  -- 5. LOCK AND VERIFY THE SAVINGS GOAL
  --
  -- The browser cannot choose another user's goal or change
  -- the goal currency.
  ------------------------------------------------------------------

  select
    sg.title,
    upper(trim(sg.currency)),
    sg.target_amount,
    coalesce(sg.current_amount, 0),
    sg.status
  into
    v_goal_title,
    v_currency,
    v_target_amount,
    v_current_amount,
    v_goal_status
  from public.savings_goals sg
  where sg.id = p_goal_id
    and sg.user_id = v_user_id
  for update;

  if not found then
    raise exception 'Savings goal not found.';
  end if;

  if v_currency is null or length(v_currency) = 0 then
    raise exception 'Savings goal currency is invalid.';
  end if;

  if v_target_amount is null or v_target_amount <= 0 then
    raise exception 'Savings goal target amount is invalid.';
  end if;

  if lower(coalesce(v_goal_status, '')) <> 'active' then
    raise exception 'Savings goal is not active.';
  end if;

  v_new_saved_amount :=
    v_current_amount + p_amount;

  if v_new_saved_amount > v_target_amount then
    raise exception
      'Contribution exceeds the remaining savings goal amount.';
  end if;


  ------------------------------------------------------------------
  -- 6. LOCK THE CORRECT MULTI-CURRENCY WALLET
  ------------------------------------------------------------------

  select wb.balance
  into v_balance_before
  from public.wallet_balances wb
  where wb.user_id = v_user_id
    and upper(trim(wb.currency)) = v_currency
  for update;

  if not found then
    raise exception
      'Wallet balance not found for currency %.',
      v_currency;
  end if;

  v_balance_before :=
    coalesce(v_balance_before, 0);

  if v_balance_before < p_amount then
    raise exception 'Insufficient wallet balance.';
  end if;

  v_balance_after :=
    v_balance_before - p_amount;


  ------------------------------------------------------------------
  -- 7. DEBIT WALLET
  ------------------------------------------------------------------

  update public.wallet_balances
  set balance = v_balance_after
  where user_id = v_user_id
    and upper(trim(currency)) = v_currency;


  ------------------------------------------------------------------
  -- 8. UPDATE SAVINGS GOAL
  ------------------------------------------------------------------

  update public.savings_goals
  set current_amount = v_new_saved_amount
  where id = p_goal_id
    and user_id = v_user_id;


  ------------------------------------------------------------------
  -- 9. RECORD SAVINGS CONTRIBUTION
  ------------------------------------------------------------------

  insert into public.savings_contributions (
    goal_id,
    user_id,
    amount,
    currency
  )
  values (
    p_goal_id,
    v_user_id,
    p_amount,
    v_currency
  );


  ------------------------------------------------------------------
  -- 10. CREATE FINANCIAL REFERENCE
  ------------------------------------------------------------------

  v_reference :=
    'NDS-' ||
    upper(
      substr(
        replace(gen_random_uuid()::text, '-', ''),
        1,
        16
      )
    );


  ------------------------------------------------------------------
  -- 11. RECORD WALLET LEDGER ENTRY
  ------------------------------------------------------------------

  insert into public.wallet_transactions (
    user_id,
    transaction_type,
    amount,
    currency,
    description,
    reference,
    status,
    direction,
    balance_before,
    balance_after,
    fee,
    service_type,
    metadata,
    idempotency_key
  )
  values (
    v_user_id,
    'Savings Contribution',
    p_amount,
    v_currency,
    'Contribution to savings goal: ' || v_goal_title,
    v_reference,
    'completed',
    'debit',
    v_balance_before,
    v_balance_after,
    0,
    'savings',
    jsonb_build_object(
      'goal_id', p_goal_id,
      'goal_title', v_goal_title
    ),
    trim(p_idempotency_key)
  )
  returning id
  into v_transaction_id;


  ------------------------------------------------------------------
  -- 12. RETURN RESULT
  ------------------------------------------------------------------

  return jsonb_build_object(
    'success', true,
    'duplicate', false,
    'transaction_id', v_transaction_id,
    'reference', v_reference,
    'goal_id', p_goal_id,
    'currency', v_currency,
    'amount', p_amount,
    'wallet_balance_before', v_balance_before,
    'wallet_balance_after', v_balance_after,
    'goal_amount_before', v_current_amount,
    'goal_amount_after', v_new_saved_amount,
    'goal_target_amount', v_target_amount
  );

end;

$function$;


-- ------------------------------------------------------------
-- 9. RPC EXECUTION PERMISSIONS
--
-- Anonymous users cannot execute financial contributions.
-- Authenticated users can execute the function.
-- Service role retains execution access.
-- ------------------------------------------------------------

REVOKE ALL ON FUNCTION
public.ndakocare_create_savings_contribution_v2(
  uuid,
  numeric,
  text
)
FROM PUBLIC;

REVOKE ALL ON FUNCTION
public.ndakocare_create_savings_contribution_v2(
  uuid,
  numeric,
  text
)
FROM anon;

GRANT EXECUTE ON FUNCTION
public.ndakocare_create_savings_contribution_v2(
  uuid,
  numeric,
  text
)
TO authenticated;

GRANT EXECUTE ON FUNCTION
public.ndakocare_create_savings_contribution_v2(
  uuid,
  numeric,
  text
)
TO service_role;


-- ============================================================
-- END OF SAVINGS V2 MIGRATION
-- ============================================================