-- ============================================================
-- NdakoCare Community Wallet V2
-- Migration 012: Member Removal and Voluntary Departure
--
-- Preserve membership records.
-- Only active memberships can become removed.
-- Rejoining requires a new invitation (Migration 011).
-- ============================================================

BEGIN;

-- ============================================================
-- 1. Community owner removes an active member.
-- ============================================================

CREATE OR REPLACE FUNCTION
public.ndakocare_remove_community_member(
    p_wallet_id uuid,
    p_actor_id uuid,
    p_member_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_owner_id uuid;
    v_community_status text;
    v_membership_id uuid;
BEGIN

    IF p_wallet_id IS NULL
       OR p_actor_id IS NULL
       OR p_member_id IS NULL
    THEN
        RAISE EXCEPTION
            'Invalid member removal request.';
    END IF;

    -- Lock the community and verify ownership.

    SELECT owner_id, status
    INTO v_owner_id, v_community_status
    FROM public.community_wallets
    WHERE id = p_wallet_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Community not found.';
    END IF;

    IF v_owner_id <> p_actor_id THEN
        RAISE EXCEPTION
            'Only the community owner can remove members.';
    END IF;

    IF v_community_status <> 'active' THEN
        RAISE EXCEPTION
            'Community is not active.';
    END IF;

    -- The owner is represented by community_wallets.owner_id.
    -- This operation must never remove the owner.

    IF p_member_id = v_owner_id THEN
        RAISE EXCEPTION
            'The community owner cannot be removed.';
    END IF;

    -- Serialize changes for this community/member pair.

    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(
            p_wallet_id::text || ':' || p_member_id::text,
            0
        )
    );

    -- Preserve the membership row and its identity.

    UPDATE public.community_members
    SET status = 'removed'
    WHERE wallet_id = p_wallet_id
      AND user_id = p_member_id
      AND role = 'member'
      AND status = 'active'
    RETURNING id INTO v_membership_id;

    IF v_membership_id IS NULL THEN
        RAISE EXCEPTION
            'Active membership not found.';
    END IF;

    RETURN v_membership_id;

END;
$$;


-- ============================================================
-- 2. Active member leaves a community voluntarily.
-- ============================================================

CREATE OR REPLACE FUNCTION
public.ndakocare_leave_community(
    p_wallet_id uuid,
    p_actor_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_owner_id uuid;
    v_community_status text;
    v_membership_id uuid;
BEGIN

    IF p_wallet_id IS NULL
       OR p_actor_id IS NULL
    THEN
        RAISE EXCEPTION
            'Invalid community departure request.';
    END IF;

    -- Lock the community.

    SELECT owner_id, status
    INTO v_owner_id, v_community_status
    FROM public.community_wallets
    WHERE id = p_wallet_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Community not found.';
    END IF;

    -- Community owners cannot leave through this function.

    IF v_owner_id = p_actor_id THEN
        RAISE EXCEPTION
            'The community owner cannot leave through member departure.';
    END IF;

    IF v_community_status <> 'active' THEN
        RAISE EXCEPTION
            'Community is not active.';
    END IF;

    -- Use the same lock convention as invitation acceptance.

    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(
            p_wallet_id::text || ':' || p_actor_id::text,
            0
        )
    );

    -- Change only the authenticated member's own record.

    UPDATE public.community_members
    SET status = 'removed'
    WHERE wallet_id = p_wallet_id
      AND user_id = p_actor_id
      AND role = 'member'
      AND status = 'active'
    RETURNING id INTO v_membership_id;

    IF v_membership_id IS NULL THEN
        RAISE EXCEPTION
            'Active membership not found.';
    END IF;

    RETURN v_membership_id;

END;
$$;


-- ============================================================
-- 3. Restrict execution to the server-side service role.
-- ============================================================

REVOKE ALL ON FUNCTION
public.ndakocare_remove_community_member(
    uuid, uuid, uuid
)
FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION
public.ndakocare_leave_community(
    uuid, uuid
)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
public.ndakocare_remove_community_member(
    uuid, uuid, uuid
)
TO service_role;

GRANT EXECUTE ON FUNCTION
public.ndakocare_leave_community(
    uuid, uuid
)
TO service_role;

COMMIT;
