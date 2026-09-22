-- ============================================================
-- NdakoCare Community Wallet V2
-- Migration 009: Secure Recipient Verification
--
-- Email invitations:
--   Require the authenticated user's verified email
--   to match the intended recipient.
--
-- WhatsApp and SMS invitations:
--   Require an authenticated user and a valid link.
--   Phone ownership is NOT claimed to be verified.
--
-- All invitations:
--   Must be active, unused, unexpired, and issued
--   by the current owner of an active community.
--
-- Membership creation and invitation acceptance
-- occur in one database transaction.
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION
public.ndakocare_accept_community_invitation(
    p_token_hash text,
    p_user_id uuid
)
RETURNS uuid

LANGUAGE plpgsql

SECURITY DEFINER

SET search_path = ''

AS $$
DECLARE

    v_invitation
        public.community_invitations%ROWTYPE;

    v_community
        public.community_wallets%ROWTYPE;

    v_existing_member_id uuid;

    v_user_email text;

    v_email_confirmed_at timestamptz;

BEGIN

    -- 1. Validate the request.

    IF p_user_id IS NULL
       OR p_token_hash IS NULL
       OR p_token_hash !~ '^[0-9a-f]{64}$'
    THEN

        RAISE EXCEPTION
            'Invalid invitation request.';

    END IF;


    -- 2. Lock the invitation to prevent
    -- simultaneous acceptance.

    SELECT *
    INTO v_invitation

    FROM public.community_invitations

    WHERE token_hash = p_token_hash

    FOR UPDATE;


    IF NOT FOUND THEN

        RAISE EXCEPTION
            'Invitation is invalid or unavailable.';

    END IF;


    -- 3. Reject used, revoked, or expired links.

    IF v_invitation.accepted_at IS NOT NULL
       OR v_invitation.revoked_at IS NOT NULL
       OR v_invitation.expires_at <= now()
    THEN

        RAISE EXCEPTION
            'Invitation is invalid or unavailable.';

    END IF;


    -- 4. Reject legacy invitations that do not
    -- identify an invitation method and recipient.

    IF v_invitation.invitation_method IS NULL
       OR v_invitation.invitation_method NOT IN (
           'email',
           'whatsapp',
           'sms'
       )
    THEN

        RAISE EXCEPTION
            'Invitation is invalid or unavailable.';

    END IF;


    -- 5. Verify that the community is active
    -- and that its current owner issued the link.

    SELECT *
    INTO v_community

    FROM public.community_wallets

    WHERE id = v_invitation.wallet_id

    FOR UPDATE;


    IF NOT FOUND
       OR v_community.status <> 'active'
       OR v_community.owner_id <>
          v_invitation.created_by
    THEN

        RAISE EXCEPTION
            'Community invitation is unavailable.';

    END IF;


    -- 6. Prevent an owner from accepting
    -- an invitation to their own community.

    IF v_community.owner_id = p_user_id THEN

        RAISE EXCEPTION
            'The community owner cannot accept this invitation.';

    END IF;


    -- 7. Verify the recipient's identity
    -- for email invitations.

    IF v_invitation.invitation_method = 'email'
    THEN

        SELECT
            lower(btrim(email)),
            email_confirmed_at

        INTO
            v_user_email,
            v_email_confirmed_at

        FROM auth.users

        WHERE id = p_user_id;


        IF NOT FOUND
           OR v_user_email IS NULL
           OR v_email_confirmed_at IS NULL
           OR v_user_email <>
              v_invitation.recipient_email
        THEN

            RAISE EXCEPTION
                'Invitation is unavailable for this account.';

        END IF;

    END IF;


    -- 8. WhatsApp and SMS links do not
    -- prove ownership of a phone number.
    --
    -- The server API must authenticate the
    -- recipient before calling this function.
    --
    -- Confirm the supplied user ID exists.

    IF v_invitation.invitation_method IN (
        'whatsapp',
        'sms'
    )
    THEN

        PERFORM 1

        FROM auth.users

        WHERE id = p_user_id;


        IF NOT FOUND THEN

            RAISE EXCEPTION
                'Invitation is unavailable for this account.';

        END IF;

    END IF;


    -- 9. Serialize membership creation for
    -- the same community and user.

    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(
            v_invitation.wallet_id::text
            || ':'
            || p_user_id::text,
            0
        )
    );


    -- 10. Prevent duplicate membership.

    SELECT id
    INTO v_existing_member_id

    FROM public.community_members

    WHERE wallet_id = v_invitation.wallet_id

      AND user_id = p_user_id

    LIMIT 1;


    IF v_existing_member_id IS NOT NULL
    THEN

        RAISE EXCEPTION
            'You already have a membership record for this community.';

    END IF;


    -- 11. Create active membership.

    INSERT INTO public.community_members (
        wallet_id,
        user_id,
        role,
        status
    )

    VALUES (
        v_invitation.wallet_id,
        p_user_id,
        'member',
        'active'
    );


    -- 12. Consume the invitation.

    UPDATE public.community_invitations

    SET
        accepted_by = p_user_id,
        accepted_at = now()

    WHERE id = v_invitation.id;


    -- 13. Return the community ID only
    -- after all checks and writes succeed.

    RETURN v_invitation.wallet_id;

END;
$$;


-- ============================================================
-- Restrict function execution.
--
-- Only the server-side service role may call
-- this function. Browser clients cannot call
-- it directly.
-- ============================================================

REVOKE ALL

ON FUNCTION
public.ndakocare_accept_community_invitation(
    text,
    uuid
)

FROM PUBLIC, anon, authenticated;


GRANT EXECUTE

ON FUNCTION
public.ndakocare_accept_community_invitation(
    text,
    uuid
)

TO service_role;


COMMIT;