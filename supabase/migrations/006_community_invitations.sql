
-- ============================================================
-- NdakoCare Database Migration 006
-- Community Wallet V2 - Private Invitations
-- ============================================================
--
-- PURPOSE
-- Create secure, single-use invitation records for
-- private community membership.
--
-- SECURITY DESIGN
-- - Only a hash of the invitation token is stored.
-- - Invitations expire and can be revoked.
-- - An invitation can be accepted only once.
-- - The browser cannot directly create, edit, or
--   accept invitation records.
-- - Server-side workflows will verify community
--   ownership and the authenticated recipient.
--
-- IMPORTANT
-- This migration does not:
-- - generate invitation links
-- - accept invitations
-- - change community balances
-- - process payments or currency conversion
--
-- The application API will implement those workflows.
-- ============================================================

BEGIN;


-- ============================================================
-- 1. COMMUNITY INVITATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.community_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Existing Community Wallet V2 community.
  -- Use wallet_id consistently with community_members.

  wallet_id uuid NOT NULL
    REFERENCES public.community_wallets(id)
    ON DELETE CASCADE,

  -- Authenticated owner who created the invitation.

  created_by uuid NOT NULL
    REFERENCES auth.users(id),

  -- SHA-256 hash of a cryptographically random token.
  -- Never store the usable invitation token.

  token_hash text NOT NULL UNIQUE,

  -- Invitation expiration.

  expires_at timestamptz NOT NULL,

  -- User who accepted the invitation, if any.

  accepted_by uuid
    REFERENCES auth.users(id),

  accepted_at timestamptz,

  -- Owner may revoke an unused invitation.

  revoked_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),

  -- SHA-256 represented as 64 lowercase hexadecimal characters.

  CONSTRAINT community_invitations_token_hash_check
    CHECK (
      token_hash ~ '^[0-9a-f]{64}$'
    ),

  -- Expiration must be later than creation.

  CONSTRAINT community_invitations_expiration_check
    CHECK (
      expires_at > created_at
    ),

  -- Acceptance requires both user and timestamp.

  CONSTRAINT community_invitations_acceptance_check
    CHECK (
      (
        accepted_by IS NULL
        AND accepted_at IS NULL
      )
      OR
      (
        accepted_by IS NOT NULL
        AND accepted_at IS NOT NULL
      )
    ),

  -- An accepted invitation cannot also be revoked.

  CONSTRAINT community_invitations_final_state_check
    CHECK (
      accepted_at IS NULL
      OR revoked_at IS NULL
    ),

  -- Acceptance cannot precede creation or occur
  -- after the invitation's expiration.

  CONSTRAINT community_invitations_acceptance_time_check
    CHECK (
      accepted_at IS NULL
      OR (
        accepted_at >= created_at
        AND accepted_at < expires_at
      )
    ),

  -- Revocation cannot precede creation.

  CONSTRAINT community_invitations_revocation_time_check
    CHECK (
      revoked_at IS NULL
      OR revoked_at >= created_at
    )
);


-- ============================================================
-- 2. INDEXES
-- ============================================================

-- Find invitations belonging to a community.

CREATE INDEX IF NOT EXISTS
idx_community_invitations_wallet_id
ON public.community_invitations(wallet_id);


-- Find invitations created by a particular owner.

CREATE INDEX IF NOT EXISTS
idx_community_invitations_created_by
ON public.community_invitations(created_by);


-- Support expiration and cleanup queries.

CREATE INDEX IF NOT EXISTS
idx_community_invitations_expires_at
ON public.community_invitations(expires_at);


-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.community_invitations
ENABLE ROW LEVEL SECURITY;


-- No browser-accessible policies are created.
--
-- Invitation creation, validation, acceptance,
-- and revocation will be implemented through
-- authenticated server-side API routes.
--
-- Those routes must verify:
--
-- 1. The requesting user's Supabase session.
-- 2. Community ownership when creating/revoking.
-- 3. The invitation token hash when accepting.
-- 4. Expiration and revocation status.
-- 5. Whether the invitation was already accepted.
-- 6. Membership creation using wallet_id.
--
-- The acceptance operation must be atomic.


-- ============================================================
-- 4. TABLE PRIVILEGES
-- ============================================================

-- Do not expose invitation records or token hashes
-- to browser-side authenticated or anonymous clients.

REVOKE ALL
ON public.community_invitations
FROM PUBLIC, anon, authenticated;


-- ============================================================
-- 5. DOCUMENTATION
-- ============================================================

COMMENT ON TABLE public.community_invitations IS
'Private single-use community invitations. Tokens are stored only as SHA-256 hashes.';


COMMENT ON COLUMN public.community_invitations.wallet_id IS
'References community_wallets.id and matches the wallet_id naming used by community_members.';


COMMENT ON COLUMN public.community_invitations.token_hash IS
'SHA-256 hash of a cryptographically random invitation token. Never store the original token.';


COMMENT ON COLUMN public.community_invitations.accepted_by IS
'Authenticated user who accepted the invitation.';


COMMENT ON COLUMN public.community_invitations.revoked_at IS
'Timestamp when an unused invitation was revoked.';


COMMIT;

-- ============================================================
-- END OF COMMUNITY INVITATIONS MIGRATION 006
-- ============================================================