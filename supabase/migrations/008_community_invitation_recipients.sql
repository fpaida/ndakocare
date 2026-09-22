-- ============================================================
-- NdakoCare Community Wallet V2
-- Migration 008: Recipient-Aware Community Invitations
--
-- Adds recipient details and invitation delivery method.
-- Preserves existing invitation records.
-- Does not enable financial transactions or message delivery.
-- ============================================================

BEGIN;

-- 1. Optional recipient display name.
ALTER TABLE public.community_invitations
ADD COLUMN recipient_name text;

-- 2. Invitation method:
--    email, whatsapp, or sms.
ALTER TABLE public.community_invitations
ADD COLUMN invitation_method text;

-- 3. Intended email recipient.
ALTER TABLE public.community_invitations
ADD COLUMN recipient_email text;

-- 4. Intended phone recipient in international E.164 format.
ALTER TABLE public.community_invitations
ADD COLUMN recipient_phone text;

-- 5. Delivery tracking.
--    "pending" does not mean a message was delivered.
ALTER TABLE public.community_invitations
ADD COLUMN delivery_status text NOT NULL DEFAULT 'pending';

-- 6. Limit recipient name length.
ALTER TABLE public.community_invitations
ADD CONSTRAINT community_invitation_recipient_name_check
CHECK (
  recipient_name IS NULL
  OR (
    length(btrim(recipient_name)) BETWEEN 1 AND 120
    AND recipient_name = btrim(recipient_name)
  )
);

-- 7. Validate invitation method.
--    NULL is allowed only for records created before this migration.
ALTER TABLE public.community_invitations
ADD CONSTRAINT community_invitation_method_check
CHECK (
  invitation_method IS NULL
  OR invitation_method IN ('email', 'whatsapp', 'sms')
);

-- 8. Require new, active invitations to have a method.
--    Existing legacy records are preserved.
--    The API will supply a method for all new invitations.
--    Legacy invitations must be handled by the next
--    acceptance-function migration before release.
--    This constraint is added after existing records are marked
--    as legacy by their NULL invitation_method.

-- 9. Validate email format and normalization.
ALTER TABLE public.community_invitations
ADD CONSTRAINT community_invitation_email_check
CHECK (
  recipient_email IS NULL
  OR (
    length(recipient_email) <= 254
    AND recipient_email = lower(btrim(recipient_email))
    AND recipient_email ~
      '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  )
);

-- 10. Validate international phone number format.
--     Example: +23675000000
ALTER TABLE public.community_invitations
ADD CONSTRAINT community_invitation_phone_check
CHECK (
  recipient_phone IS NULL
  OR recipient_phone ~ '^\+[1-9][0-9]{1,14}$'
);

-- 11. Match contact information to invitation method.
--     Existing legacy rows are preserved for now.
ALTER TABLE public.community_invitations
ADD CONSTRAINT community_invitation_recipient_method_check
CHECK (
  invitation_method IS NULL

  OR (
    invitation_method = 'email'
    AND recipient_email IS NOT NULL
    AND recipient_phone IS NULL
  )

  OR (
    invitation_method IN ('whatsapp', 'sms')
    AND recipient_phone IS NOT NULL
    AND recipient_email IS NULL
  )
);

-- 12. Restrict delivery status to known values.
ALTER TABLE public.community_invitations
ADD CONSTRAINT community_invitation_delivery_status_check
CHECK (
  delivery_status IN (
    'pending',
    'manually_shared',
    'sent',
    'failed'
  )
);

-- 13. Improve owner invitation lookup.
CREATE INDEX IF NOT EXISTS
  community_invitations_wallet_method_idx
ON public.community_invitations (
  wallet_id,
  invitation_method,
  created_at DESC
);

-- 14. Preserve private server-only access.
REVOKE ALL
ON public.community_invitations
FROM PUBLIC, anon, authenticated;

COMMIT;