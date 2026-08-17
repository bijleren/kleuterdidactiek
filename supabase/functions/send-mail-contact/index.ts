import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ContactMessage {
  name: string;
  email: string;
  type: string;
  subject: string;
  message: string;
  platform: string;
}

const contactReasonLabels: Record<string, string> = {
  'demo': 'Demo of meer informatie',
  'new-app': 'Nieuwe app aanvragen',
  'support': 'Ondersteuning op school',
  'pricing': 'Vraag over prijzen',
  'other': 'Andere vraag',
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const payload = await req.json();
    const record = payload.record as ContactMessage;

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not found");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const reasonLabel = contactReasonLabels[record.type] || record.type;

    const emailHtml = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
            .label { font-weight: bold; color: #3B82F6; width: 140px; vertical-align: top; }
            .value { color: #1f2937; }
            .message-row td { padding-top: 16px; }
            .message-box { background: white; padding: 16px; border-left: 4px solid #3B82F6; margin-top: 8px; white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">Nieuw Contactbericht</h2>
              <p style="margin: 8px 0 0 0; opacity: 0.9;">${record.platform}</p>
            </div>
            <div class="content">
              <table>
                <tr>
                  <td class="label">Naam:</td>
                  <td class="value">${record.name}</td>
                </tr>
                <tr>
                  <td class="label">E-mail:</td>
                  <td class="value"><a href="mailto:${record.email}">${record.email}</a></td>
                </tr>
                <tr>
                  <td class="label">Reden:</td>
                  <td class="value">${reasonLabel}</td>
                </tr>
                <tr class="message-row">
                  <td class="label">Bericht:</td>
                  <td class="value">
                    <div class="message-box">${record.message.replace(/\n/g, '<br>')}</div>
                  </td>
                </tr>
              </table>
            </div>
          </div>
        </body>
      </html>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "bijleer.school <noreply@bijleer.school>",
        to: ["info@bijleren.eu"],
        subject: `[${record.platform}] ${record.subject}`,
        html: emailHtml,
        reply_to: record.email,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("Resend API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: errorText }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const result = await resendResponse.json();
    console.log("Email sent successfully:", result);

    return new Response(
      JSON.stringify({ success: true, emailId: result.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-mail-contact:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
