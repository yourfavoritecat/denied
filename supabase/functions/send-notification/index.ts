import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

interface NotificationRequest {
  type: string; // inquiry_received | quote_received | deposit_paid | trip_confirmed | new_message
  booking_id: string;
  recipient_user_id: string;
}

const SUBJECTS: Record<string, string> = {
  inquiry_received: "New Inquiry Received",
  quote_received: "You Received a Quote!",
  deposit_paid: "Deposit Payment Confirmed",
  trip_confirmed: "Your Trip is Confirmed!",
  new_message: "New Message on Your Booking",
};

const BODIES: Record<string, (providerName: string, procedures: string) => string> = {
  inquiry_received: (p, proc) => `
    <h2>New Inquiry from a Patient</h2>
    <p>A patient has submitted an inquiry for <strong>${proc}</strong>.</p>
    <p>Log in to your provider dashboard to review the details and submit a quote.</p>
  `,
  quote_received: (p, proc) => `
    <h2>Quote Received from ${p}</h2>
    <p>${p} has sent you a quote for <strong>${proc}</strong>.</p>
    <p>Log in to review the quote, chat with the provider, and pay the deposit to secure your spot.</p>
  `,
  deposit_paid: (p, proc) => `
    <h2>Deposit Payment Confirmed</h2>
    <p>A deposit has been paid for <strong>${proc}</strong> at ${p}.</p>
    <p>The booking is now in progress. Check your dashboard for next steps.</p>
  `,
  trip_confirmed: (p, proc) => `
    <h2>Trip Confirmed!</h2>
    <p>Your trip for <strong>${proc}</strong> at ${p} is confirmed.</p>
    <p>Check your booking details for travel dates and instructions.</p>
  `,
  new_message: (p, proc) => `
    <h2>New Message</h2>
    <p>You have a new message regarding your booking for <strong>${proc}</strong>.</p>
    <p>Log in to view and reply.</p>
  `,
};

const ADMIN_EMAIL = "cat@denied.care";

const ADMIN_INQUIRY_BODY = (providerName: string, procedures: string, patientName: string, patientEmail: string, message: string, dates: string, medicalNotes: string) => `
  <h2>🔔 New Inquiry for ${providerName}</h2>
  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
    <tr><td style="padding:6px 12px;font-weight:600;color:#555;">Patient</td><td style="padding:6px 12px;">${patientName}</td></tr>
    <tr><td style="padding:6px 12px;font-weight:600;color:#555;">Email</td><td style="padding:6px 12px;"><a href="mailto:${patientEmail}">${patientEmail}</a></td></tr>
    <tr><td style="padding:6px 12px;font-weight:600;color:#555;">Procedures</td><td style="padding:6px 12px;">${procedures}</td></tr>
    ${dates ? `<tr><td style="padding:6px 12px;font-weight:600;color:#555;">Preferred Dates</td><td style="padding:6px 12px;">${dates}</td></tr>` : ""}
    ${message ? `<tr><td style="padding:6px 12px;font-weight:600;color:#555;">Message</td><td style="padding:6px 12px;">${message}</td></tr>` : ""}
    ${medicalNotes ? `<tr><td style="padding:6px 12px;font-weight:600;color:#555;">Medical Notes</td><td style="padding:6px 12px;">${medicalNotes}</td></tr>` : ""}
  </table>
  <p>Log in to the <a href="https://denied.lovable.app/admin">Admin Dashboard</a> to respond.</p>
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, booking_id, recipient_user_id }: NotificationRequest = await req.json();

    if (!type || !booking_id) {
      throw new Error("Missing required fields: type, booking_id");
    }

    // Get booking details
    const { data: booking } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .single();

    if (!booking) throw new Error("Booking not found");

    const procedures = Array.isArray(booking.procedures)
      ? booking.procedures.map((p: any) => `${p.name}${p.quantity > 1 ? ` ×${p.quantity}` : ""}`).join(", ")
      : "procedures";
    const providerName = booking.provider_slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

    const emailsSent: string[] = [];

    // Check if this is an admin-managed provider and forward to admin email
    if (type === "inquiry_received") {
      const { data: provider } = await supabaseAdmin
        .from("providers")
        .select("admin_managed, admin_email, name")
        .eq("slug", booking.provider_slug)
        .single();

      if (provider?.admin_managed) {
        // Get patient info
        const { data: patientUser } = await supabaseAdmin.auth.admin.getUserById(booking.user_id);
        const { data: patientProfile } = await supabaseAdmin
          .from("profiles")
          .select("first_name, last_name")
          .eq("user_id", booking.user_id)
          .single();

        const patientName = [patientProfile?.first_name, patientProfile?.last_name].filter(Boolean).join(" ") || "Unknown";
        const patientEmail = patientUser?.user?.email || "N/A";
        const preferredDates = booking.preferred_dates ? (booking.preferred_dates as any).text || "" : "";

        const adminTo = provider.admin_email || ADMIN_EMAIL;
        const displayName = provider.name || providerName;

        const adminEmailRes = await resend.emails.send({
          from: "Denied.care <notifications@denied.care>",
          to: [adminTo],
          subject: `New Inquiry: ${displayName} — ${procedures}`,
          html: `
            <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
              ${ADMIN_INQUIRY_BODY(displayName, procedures, patientName, patientEmail, booking.inquiry_message || "", preferredDates, booking.medical_notes || "")}
              <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
              <p style="font-size: 12px; color: #999;">Admin notification from Denied.care</p>
            </div>
          `,
        });
        console.log("Admin notification sent:", adminEmailRes);
        emailsSent.push(adminTo);
      }
    }

    // Send standard notification to recipient if provided
    if (recipient_user_id) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(recipient_user_id);
      if (userData?.user?.email) {
        // Check notification preferences
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("notification_preferences")
          .eq("user_id", recipient_user_id)
          .single();

        const prefs = profile?.notification_preferences as Record<string, boolean> | null;
        const shouldSend = !(prefs && prefs[type] === false);

        if (shouldSend) {
          const subject = SUBJECTS[type] || "Booking Update";
          const body = BODIES[type]?.(providerName, procedures) || `<p>You have an update on your booking.</p>`;

          const emailResponse = await resend.emails.send({
            from: "Denied.care <notifications@denied.care>",
            to: [userData.user.email],
            subject,
            html: `
              <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
                ${body}
                <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
                <p style="font-size: 12px; color: #999;">You're receiving this because you have an active booking on Denied.care. 
                <a href="#">Manage notification preferences</a></p>
              </div>
            `,
          });
          console.log("Notification sent:", emailResponse);
          emailsSent.push(userData.user.email);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, emails_sent: emailsSent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Notification error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
