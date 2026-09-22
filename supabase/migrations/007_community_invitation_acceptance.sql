
-- NdakoCare Community Wallet V2
-- Migration 007: Atomic invitation acceptance
--
-- The application server must first authenticate the user.
-- Only the server-side service role may call this function.
-- No wallet balances or contributions are changed.

CREATE OR REPLACE FUNCTION public.ndakocare_accept_community_invitation(
  p_token_hash text,
  p_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_invitation public.community_invitations%ROWTYPE;
  v_community public.community_wallets%ROWTYPE;
  v_existing_member_id uuid;
BEGIN
  IF p_user_id IS NULL
     OR p_token_hash IS NULL
     OR p_token_hash !~ '^[0-9a-f]{64}$'
  THEN
    RAISE EXCEPTION 'Invalid invitation request.';
  END IF;

  -- Lock this invitation so concurrent attempts cannot
  -- both consume the same single-use link.

  SELECT *
  INTO v_invitation
  FROM public.community_invitations
  WHERE token_hash = p_token_hash
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation is invalid or unavailable.';
  END IF;

  IF v_invitation.accepted_at IS NOT NULL
     OR v_invitation.revoked_at IS NOT NULL
     OR v_invitation.expires_at <= now()
  THEN
    RAISE EXCEPTION 'Invitation is invalid or unavailable.';
  END IF;

  -- Lock the community and verify it is still active.
  -- An invitation from a former owner must not remain valid.

  SELECT *
  INTO v_community
  FROM public.community_wallets
  WHERE id = v_invitation.wallet_id
  FOR UPDATE;

  IF NOT FOUND
     OR v_community.status <> 'active'
     OR v_community.owner_id <> v_invitation.created_by
  THEN
    RAISE EXCEPTION 'Community invitation is unavailable.';
  END IF;

  IF v_community.owner_id = p_user_id THEN
    RAISE EXCEPTION 'The community owner cannot accept this invitation.';
  END IF;

  -- Serialize membership acceptance for this user/community,
  -- including attempts made with different invitation links.

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      v_invitation.wallet_id::text || ':' || p_user_id::text,
      0
    )
  );

  SELECT id
  INTO v_existing_member_id
  FROM public.community_members
  WHERE wallet_id = v_invitation.wallet_id
    AND user_id = p_user_id
  LIMIT 1;

  IF v_existing_member_id IS NOT NULL THEN
    RAISE EXCEPTION 'You already have a membership record for this community.';
  END IF;

  -- Both writes occur in the same database transaction.
  -- If either fails, neither is committed.

  INSERT INTO public.community_members (
    wallet_id,
    user_id,
    role,
    status
  )
  VALUES (
    v_invitation.wallet_id,
    p_user_id,
    'Member',
    'active'
  );

  UPDATE public.community_invitations
  SET
    accepted_by = p_user_id,
    accepted_at = now()
  WHERE id = v_invitation.id;

  RETURN v_invitation.wallet_id;
END;
$$;

-- The function must never be callable directly from
-- an anonymous or authenticated browser session.
-- The server verifies the session before supplying p_user_id.

REVOKE ALL ON FUNCTION
  public.ndakocare_accept_community_invitation(text, uuid)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.ndakocare_accept_community_invitation(text, uuid)
TO service_role;