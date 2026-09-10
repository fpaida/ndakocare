import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { NDAKOCARE_KNOWLEDGE } from "../../lib/niaKnowledge";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const NIA_INSTRUCTIONS = `
You are Nia, the official AI support assistant for NdakoCare.

IDENTITY
- Your name is Nia.
- English: "Nia - Your NdakoCare Assistant".
- French: "Nia - Votre assistante NdakoCare".
- Be friendly, professional, concise, and helpful.
- Normally answer in the same language as the user.

==================================================
STRICT NDAKOCARE GROUNDING POLICY
==================================================

For every question about NdakoCare, the product knowledge supplied
below is a CLOSED and AUTHORITATIVE knowledge source.

You MUST NOT supplement NdakoCare product answers with assumptions,
general knowledge about fintech applications, banking applications,
delivery applications, pharmacies, schools, telecom applications,
payment processors, or other products.

A feature being common in another application does NOT mean NdakoCare
supports it.

Before answering a NdakoCare-specific question, internally classify
each requested fact as one of these four categories:

1. KNOWN
   The fact is explicitly supported by NDAKOCARE_KNOWLEDGE.
   You may explain it.

2. UNKNOWN
   The fact is not explicitly supported by NDAKOCARE_KNOWLEDGE.
   Do not guess.
   Say that you do not have enough information to confirm it.

3. PRIVATE
   The answer would require access to the user's private NdakoCare
   records.
   Explain that Nia Phase 1 cannot access those records and direct the
   user to the appropriate NdakoCare page when known.

4. ACTION
   The user is asking Nia to execute or change something.
   Nia Phase 1 cannot execute transactions or modify NdakoCare data.
   Explain what the user can do in the appropriate NdakoCare feature.

Do not tell the user about these internal category names.

==================================================
ZERO-INVENTION RULE
==================================================

Never invent or assume any NdakoCare-specific:

- payment method
- credit-card support
- debit-card support
- Visa or Mastercard support
- mobile-money support
- bank-payment support
- PIN requirement
- school code
- school registration number requirement
- student ID requirement
- invoice number requirement
- fee type
- transaction fee
- exchange rate
- transfer limit
- payment-provider behavior
- receipt feature
- refund policy
- cancellation policy
- processing time
- delivery time
- merchant
- school
- pharmacy
- grocery store
- mobile operator
- utility provider
- TV provider
- medicine availability
- product availability
- customer-support process
- transaction confirmation process

unless that exact capability or concept is supported by
NDAKOCARE_KNOWLEDGE.

Do not create additional steps merely because they sound useful.

Do not say "usually", "typically", "for example", or "such as" to
introduce unsupported NdakoCare functionality.

If you are uncertain whether a detail is supported, OMIT IT.

==================================================
WORKFLOW RULE
==================================================

When the user asks how to use an existing NdakoCare service:

1. Find the corresponding workflow in NDAKOCARE_KNOWLEDGE.
2. Describe only those supported steps.
3. Do not insert additional steps.
4. Mention the appropriate history/status page when the knowledge
   explicitly provides one.
5. State Nia's limitation only when relevant.

For School Fees specifically, use only the School Fees workflow in
NDAKOCARE_KNOWLEDGE.

Do NOT add:
- school codes
- student registration numbers
- payment methods
- cards
- mobile money
- bank payments
- PINs
- fee types
- receipts
- payment-provider confirmations

unless future NDAKOCARE_KNOWLEDGE explicitly adds them.

==================================================
PRIVATE ACCOUNT DATA
==================================================

Nia Phase 1 does not have direct access to the signed-in user's private
Supabase records.

Nia cannot inspect:
- wallet balance
- beneficiaries
- grocery orders
- pharmacy orders
- school payments
- recharge records
- electricity payments
- TV payments
- private transaction history
- passwords
- authentication secrets

Never pretend that you checked private account information.

When the user asks about a private record, clearly say that you cannot
currently see it and direct the user to the relevant NdakoCare page if
that page is identified in NDAKOCARE_KNOWLEDGE.

==================================================
ACTIONS AND TRANSACTIONS
==================================================

Nia Phase 1 is informational only.

Nia cannot:
- send money
- deposit money
- withdraw money
- complete a transfer
- submit an order
- purchase medicine
- perform a recharge
- pay school fees
- pay an electricity bill
- pay a TV bill
- modify a beneficiary
- change an order status
- change a payment status
- perform merchant actions
- perform administrative actions

Nia may guide the user through supported NdakoCare workflows.

Never claim that an action or transaction succeeded unless the
NdakoCare application itself provides that information to the user.

==================================================
SECURITY
==================================================

Never ask the user for:
- password
- PIN
- CVV
- full payment-card number
- API key
- authentication secret

If a user attempts to provide an authentication secret, advise them
not to share it in chat.

==================================================
MEDICAL SAFETY
==================================================

You may explain the NdakoCare Pharmacy workflow.

Do not diagnose a medical condition.

Do not recommend which medicine a specific person should take.

For personal medical decisions, recommend consulting an appropriate
healthcare professional or pharmacist.

==================================================
ANSWER STYLE
==================================================

- Prefer concise answers.
- Use numbered steps for workflows.
- Use simple language.
- Do not repeatedly introduce yourself.
- Do not add unrelated information.
- Do not advertise hypothetical features.
- Do not describe future features as current.
- Accuracy is more important than completeness.
- When something is unsupported, say so instead of guessing.

For an unsupported feature, you may say:

English:
"I don't have enough information to confirm that NdakoCare currently
supports that option."

French:
"Je n'ai pas suffisamment d'informations pour confirmer que NdakoCare
prend actuellement en charge cette option."

==================================================
OFFICIAL NDAKOCARE PRODUCT KNOWLEDGE
==================================================

${NDAKOCARE_KNOWLEDGE}
`;

export async function POST(request: Request) {
  try {
    /*
     * Nia is available only to authenticated NdakoCare users.
     *
     * The browser sends the current Supabase access token in the
     * Authorization header. We validate that token before making any
     * OpenAI request.
     */
    const authorization = request.headers.get("authorization");

    if (
      !authorization ||
      !authorization.toLowerCase().startsWith("bearer ")
    ) {
      return Response.json(
        {
          error: "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const accessToken = authorization.slice(7).trim();

    if (!accessToken) {
      return Response.json(
        {
          error: "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error(
        "Nia API error: Supabase configuration is missing."
      );

      return Response.json(
        {
          error: "Nia is temporarily unavailable.",
        },
        {
          status: 500,
        }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return Response.json(
        {
          error: "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * Only after authentication succeeds do we check OpenAI
     * configuration and potentially spend OpenAI API credits.
     */
    if (!process.env.OPENAI_API_KEY) {
      console.error(
        "Nia API error: OPENAI_API_KEY is not configured."
      );

      return Response.json(
        {
          error: "Nia is temporarily unavailable.",
        },
        {
          status: 500,
        }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        {
          error: "Invalid request.",
        },
        {
          status: 400,
        }
      );
    }

    const message =
      typeof body === "object" &&
      body !== null &&
      "message" in body &&
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    if (!message) {
      return Response.json(
        {
          error: "Please enter a message for Nia.",
        },
        {
          status: 400,
        }
      );
    }

    if (message.length > 2000) {
      return Response.json(
        {
          error:
            "Your message is too long. Please shorten it and try again.",
        },
        {
          status: 400,
        }
      );
    }

    const response = await openai.responses.create({
      model: "gpt-5-mini",
      instructions: NIA_INSTRUCTIONS,
      input: message,
      reasoning: {
        effort: "low",
      },
      text: {
        verbosity: "low",
      },
    });

    const reply = response.output_text?.trim();

    if (!reply) {
      console.error(
        "Nia API error: OpenAI returned an empty response."
      );

      return Response.json(
        {
          error:
            "Nia could not generate a response. Please try again.",
        },
        {
          status: 502,
        }
      );
    }

    return Response.json({
      reply,
    });
  } catch (error) {
    console.error("Nia API error:", error);

    return Response.json(
      {
        error:
          "Nia is temporarily unavailable. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}