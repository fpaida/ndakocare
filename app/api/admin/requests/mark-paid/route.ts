import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const authHeader =
      request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const accessToken =
      authHeader.replace("Bearer ", "").trim();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

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
      return NextResponse.json(
        { error: "Invalid session." },
        { status: 401 }
      );
    }

    const {
      data: profile,
      error: profileError,
    } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (!profile?.is_admin) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const reference =
      typeof body?.reference === "string"
        ? body.reference.trim()
        : "";

    if (!reference) {
      return NextResponse.json(
        { error: "Request reference is required." },
        { status: 400 }
      );
    }

    const {
      data,
      error,
    } = await supabaseAdmin.rpc(
      "ndakocare_mark_request_paid",
      {
        p_reference: reference,
      }
    );

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        result: data,
      },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unexpected server error.";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}