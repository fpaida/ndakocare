import { randomBytes, createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export const runtime = "nodejs";

const INVITATION_LIFETIME_DAYS = 7;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PHONE_PATTERN =
  /^\+[1-9][0-9]{1,14}$/;

type InvitationMethod =
  | "email"
  | "whatsapp"
  | "sms";

function jsonError(
  message: string,
  status: number
) {
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

export async function POST(
  request: NextRequest
) {
  try {
    // 1. Require a bearer token.

    const authHeader =
      request.headers.get("authorization");

    if (
      !authHeader?.startsWith("Bearer ")
    ) {
      return jsonError(
        "Authentication required.",
        401
      );
    }

    const accessToken =
      authHeader
        .slice("Bearer ".length)
        .trim();

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

    // 3. Read and validate the request.

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return jsonError(
        "A valid JSON request body is required.",
        400
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return jsonError(
        "A valid invitation request is required.",
        400
      );
    }

    const input =
      body as Record<string, unknown>;

    const walletId =
      typeof input.walletId === "string"
        ? input.walletId.trim()
        : "";

    if (!UUID_PATTERN.test(walletId)) {
      return jsonError(
        "A valid community ID is required.",
        400
      );
    }

    // 4. Require a supported invitation method.

    const methodInput =
      input.invitationMethod;

    if (
      methodInput !== "email" &&
      methodInput !== "whatsapp" &&
      methodInput !== "sms"
    ) {
      return jsonError(
        "Choose email, WhatsApp, or SMS.",
        400
      );
    }

    const invitationMethod:
      InvitationMethod = methodInput;

    // 5. Validate optional recipient name.

    if (
      input.recipientName !== undefined &&
      input.recipientName !== null &&
      typeof input.recipientName !== "string"
    ) {
      return jsonError(
        "Recipient name must be text.",
        400
      );
    }

    const recipientName =
      typeof input.recipientName === "string"
        ? input.recipientName.trim()
        : "";

    if (recipientName.length > 120) {
      return jsonError(
        "Recipient name is too long.",
        400
      );
    }

    // 6. Validate the intended recipient.

    let recipientEmail: string | null =
      null;

    let recipientPhone: string | null =
      null;

    if (invitationMethod === "email") {
      if (
        typeof input.recipientEmail !==
        "string"
      ) {
        return jsonError(
          "Recipient email is required.",
          400
        );
      }

      const email =
        input.recipientEmail
          .trim()
          .toLowerCase();

      if (
        email.length > 254 ||
        !EMAIL_PATTERN.test(email)
      ) {
        return jsonError(
          "Enter a valid email address.",
          400
        );
      }

      recipientEmail = email;
    } else {
      if (
        typeof input.recipientPhone !==
        "string"
      ) {
        return jsonError(
          "Recipient phone number is required.",
          400
        );
      }

      const phone =
        input.recipientPhone.trim();

      if (!PHONE_PATTERN.test(phone)) {
        return jsonError(
          "Enter an international phone number, such as +23675000000.",
          400
        );
      }

      recipientPhone = phone;
    }

    // 7. Verify community ownership.
    // Never trust an owner ID from the browser.

    const {
      data: community,
      error: communityError,
    } = await supabaseAdmin
      .from("community_wallets")
      .select(
        "id, owner_id, name, status"
      )
      .eq("id", walletId)
      .maybeSingle();

    if (communityError) {
      throw communityError;
    }

    if (!community) {
      return jsonError(
        "Community not found.",
        404
      );
    }

    if (community.owner_id !== user.id) {
      return jsonError(
        "Only the community owner can create invitations.",
        403
      );
    }

    if (community.status !== "active") {
      return jsonError(
        "Invitations are unavailable for this community.",
        409
      );
    }

    // 8. Generate a secure invitation token.
    // Store only its SHA-256 hash.

    const token =
      randomBytes(32).toString("hex");

    const tokenHash =
      createHash("sha256")
        .update(token)
        .digest("hex");

    const expiresAt =
      new Date(
        Date.now() +
          INVITATION_LIFETIME_DAYS *
            24 *
            60 *
            60 *
            1000
      ).toISOString();

    // 9. Save the recipient-aware invitation.

    const {
      data: invitation,
      error: insertError,
    } = await supabaseAdmin
      .from("community_invitations")
      .insert({
        wallet_id: community.id,
        created_by: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,

        recipient_name:
          recipientName || null,

        invitation_method:
          invitationMethod,

        recipient_email:
          recipientEmail,

        recipient_phone:
          recipientPhone,

        delivery_status: "pending",
      })
      .select(
        "id, expires_at"
      )
      .single();

    if (insertError) {
      throw insertError;
    }

    // 10. Return the private invitation path
    // to the authenticated community owner.
    //
    // Creating this record does not mean
    // an email, SMS, or WhatsApp message
    // has been delivered.

    const invitationPath =
      `/community-wallet/invite?token=${encodeURIComponent(
        token
      )}`;

    return NextResponse.json(
      {
        success: true,
        invitationId:
          invitation.id,

        communityName:
          community.name,

        invitationMethod,

        recipientName:
          recipientName || null,

        invitationPath,

        expiresAt:
          invitation.expires_at,

        deliveryStatus:
          "pending",
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    // Never return database internals,
    // private tokens, or configuration
    // details in an error response.

    console.error(
      "Community invitation creation failed:",
      error instanceof Error
        ? error.message
        : "Unknown error"
    );

    return jsonError(
      "Unable to create the invitation. Please try again.",
      500
    );
  }
}