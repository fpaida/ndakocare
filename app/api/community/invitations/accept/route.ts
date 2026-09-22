import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export const runtime = "nodejs";

const TOKEN_PATTERN = /^[0-9a-f]{64}$/i;

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    // 1. Require an authenticated NdakoCare session.

    const authHeader =
      request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return jsonError(
        "Authentication required.",
        401
      );
    }

    const accessToken =
      authHeader.slice("Bearer ".length).trim();

    if (!accessToken) {
      return jsonError(
        "Authentication required.",
        401
      );
    }

    // 2. Verify the authenticated user.

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const anonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      throw new Error(
        "Supabase public environment variables are missing."
      );
    }

    const authClient = createClient(
      supabaseUrl,
      anonKey,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(
      accessToken
    );

    if (userError || !user) {
      return jsonError(
        "Invalid session.",
        401
      );
    }

    // 3. Read and validate the invitation token.

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return jsonError(
        "A valid JSON request body is required.",
        400
      );
    }

    const token =
      body &&
      typeof body === "object" &&
      "token" in body &&
      typeof body.token === "string"
        ? body.token.trim()
        : "";

    if (!TOKEN_PATTERN.test(token)) {
      return jsonError(
        "Invalid invitation link.",
        400
      );
    }

    // 4. Hash the invitation token.
    // Never store the raw token in the database.

    const tokenHash =
      createHash("sha256")
        .update(token)
        .digest("hex");

    // 5. Call the protected database function.
    //
    // The user ID comes from the verified
    // Supabase session, never the request body.
    //
    // Migration 009 enforces:
    // - Matching verified email for email invitations
    // - Valid authenticated user for WhatsApp/SMS
    // - Active community
    // - Current community ownership
    // - No owner self-acceptance
    // - No duplicate membership
    // - No expired, revoked, or used invitations
    //
    // Membership creation and invitation acceptance
    // occur in one database transaction.

    const {
      data: walletId,
      error: acceptanceError,
    } = await supabaseAdmin.rpc(
      "ndakocare_accept_community_invitation",
      {
        p_token_hash: tokenHash,
        p_user_id: user.id,
      }
    );

    // 6. TEMPORARY SERVER-SIDE DIAGNOSTICS.
    //
    // Keep database details out of the browser.
    // Remove this logging after troubleshooting.
    //
    // Never log invitation tokens, access tokens,
    // recipient emails, or request bodies.

    if (acceptanceError) {
      console.error(
        "Community invitation acceptance database error:",
        {
          code: acceptanceError.code,
          message: acceptanceError.message,
          details: acceptanceError.details,
          hint: acceptanceError.hint,
        }
      );

      return jsonError(
        "This invitation is invalid, expired, already used, or unavailable for your account.",
        400
      );
    }

    // 7. Return success only after the database
    // confirms membership was created.

    return NextResponse.json(
      {
        success: true,
        walletId,
        message:
          "You have successfully joined the community.",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Community invitation acceptance failed:",
      error instanceof Error
        ? error.message
        : "Unknown error"
    );

    return jsonError(
      "Unable to accept the invitation. Please try again.",
      500
    );
  }
}