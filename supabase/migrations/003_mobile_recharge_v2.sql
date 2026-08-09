-- ============================================================
-- NdakoCare Database Migration 003
-- Mobile Recharge V2
-- ============================================================
--
-- Purpose:
-- Extend the existing mobile_recharges table so recharge
-- requests can store country and currency information.
--
-- Existing recharge records are preserved.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Add destination country ISO code
-- Examples:
-- CF = Central African Republic
-- CM = Cameroon
-- ------------------------------------------------------------

ALTER TABLE public.mobile_recharges
ADD COLUMN IF NOT EXISTS country_code text;


-- ------------------------------------------------------------
-- 2. Add destination country display name
-- ------------------------------------------------------------

ALTER TABLE public.mobile_recharges
ADD COLUMN IF NOT EXISTS country text;


-- ------------------------------------------------------------
-- 3. Add currency used for the recharge
-- Examples:
-- XAF, XOF, USD
-- ------------------------------------------------------------

ALTER TABLE public.mobile_recharges
ADD COLUMN IF NOT EXISTS currency text;


-- ------------------------------------------------------------
-- 4. Ensure new recharge requests receive a timestamp
-- ------------------------------------------------------------

ALTER TABLE public.mobile_recharges
ALTER COLUMN created_at SET DEFAULT now();


-- ------------------------------------------------------------
-- 5. Ensure new recharge requests default to Pending
-- ------------------------------------------------------------

ALTER TABLE public.mobile_recharges
ALTER COLUMN status SET DEFAULT 'Pending';


-- ------------------------------------------------------------
-- 6. Prevent negative recharge amounts
-- ------------------------------------------------------------

ALTER TABLE public.mobile_recharges
DROP CONSTRAINT IF EXISTS mobile_recharges_amount_check;

ALTER TABLE public.mobile_recharges
ADD CONSTRAINT mobile_recharges_amount_check
CHECK (amount IS NULL OR amount > 0);


-- ------------------------------------------------------------
-- 7. Index country code for future reporting/filtering
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_mobile_recharges_country_code
ON public.mobile_recharges(country_code);