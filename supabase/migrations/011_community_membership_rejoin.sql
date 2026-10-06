-- ============================================================
-- NdakoCare Community Wallet V2
-- Migration 011: Rejoin Through a New Invitation
--
-- A removed member may rejoin only after accepting
-- a new valid invitation issued by the current owner.
--
-- Existing membership IDs are preserved.
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

    v_existing_member
        public.community_members%ROWTYPE;

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


    -- 4. Require a supported invitation method.

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


    -- 5. Lock and verify the community.

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


    -- 6. Prevent owner self-acceptance.

    IF v_community.owner_id = p_user_id THEN

        RAISE EXCEPTION
            'The community owner cannot accept this invitation.';

    END IF;


    -- 7. Verify email invitation recipients.

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


    -- 8. WhatsApp/SMS links do not prove
    -- ownership of a phone number.
    --
    -- The API must authenticate the user.
    -- Confirm the supplied user exists.

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


    -- 9. Serialize membership operations
    -- for this community and user.

    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(
            v_invitation.wallet_id::text
            || ':'
            || p_user_id::text,
            0
        )
    );


    -- 10. Retrieve and lock any existing
    -- membership record.

    SELECT *
    INTO v_existing_member

    FROM public.community_members

    WHERE wallet_id = v_invitation.wallet_id

      AND user_id = p_user_id

    FOR UPDATE;


    -- 11. Handle existing membership.

    IF FOUND THEN

        -- Active members cannot accept
        -- another invitation.

        IF v_existing_member.status = 'active'
        THEN

            RAISE EXCEPTION
                'You are already an active member of this community.';

        END IF;


        -- An invited membership is not
        -- automatically activated here.

        IF v_existing_member.status = 'invited'
        THEN

            RAISE EXCEPTION
                'An existing pending membership must be resolved first.';

        END IF;


        -- Only a removed membership
        -- may be reactivated.

        IF v_existing_member.status <> 'removed'
        THEN

            RAISE EXCEPTION
                'Membership cannot be activated.';

        END IF;


        -- Reactivate the existing record.
        -- Preserve its ID and created_at.

        UPDATE public.community_members

        SET
            role = 'member',
            status = 'active'

        WHERE id = v_existing_member.id;


    ELSE

        -- 12. Create a new membership.

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

    END IF;


    -- 13. Consume the invitation only
    -- after membership creation or
    -- reactivation succeeds.

    UPDATE public.community_invitations

    SET
        accepted_by = p_user_id,
        accepted_at = now()

    WHERE id = v_invitation.id;


    -- 14. Return the community ID.

    RETURN v_invitation.wallet_id;

END;
$$;


-- Restrict execution to the server-side
-- service role, as in Migration 009.

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
