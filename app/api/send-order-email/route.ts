import { Resend } from "resend";

const resend = new Resend(
  process.env.RESEND_API_KEY
);

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const {
      customerEmail,
      customerName,
      country,
      city,
      deliveryType,
      items,
    } = body;

    const data =
      await resend.emails.send({
        from:
          "NdakoCare <onboarding@resend.dev>",

        to: [customerEmail],

        subject:
          "NdakoCare Grocery Order Confirmation",

        html: `
          <div style="font-family: Arial; padding: 20px;">

            <h1 style="color:#008037;">
              NdakoCare
            </h1>

            <h2>
              Grocery Order Received
            </h2>

            <p>
              Hello ${customerName},
            </p>

            <p>
              Your grocery order has been received successfully.
            </p>

            <hr />

            <p>
              <strong>Country:</strong>
              ${country}
            </p>

            <p>
              <strong>City:</strong>
              ${city}
            </p>

            <p>
              <strong>Delivery:</strong>
              ${deliveryType}
            </p>

            <p>
              <strong>Items:</strong>
            </p>

            <div
              style="
                background:#f4f4f4;
                padding:15px;
                border-radius:10px;
              "
            >
              ${items.replace(
                /\n/g,
                "<br/>"
              )}
            </div>

            <p
              style="
                margin-top:30px;
                color:#555;
              "
            >
              Thank you for using
              NdakoCare ❤️
            </p>

          </div>
        `,
      });

    return Response.json(data);

  } catch (error) {
    return Response.json({
      error,
    });
  }
}
