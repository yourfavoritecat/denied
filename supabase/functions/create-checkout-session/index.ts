import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user?.email) throw new Error("User not authenticated");

    const { booking_id } = await req.json();
    if (!booking_id) throw new Error("booking_id is required");

    // Fetch booking
    const { data: booking, error: bookingError } = await supabaseClient
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .eq("user_id", userData.user.id)
      .single();

    if (bookingError || !booking) throw new Error("Booking not found");
    if (!booking.quoted_price) throw new Error("No quote on this booking yet");

    const quotedPrice = Number(booking.quoted_price);
    const depositAmount = Math.round(quotedPrice * 0.25 * 100); // cents
    const commissionAmount = Math.round(depositAmount * 0.17); // 17% of deposit

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check existing Stripe customer
    const customers = await stripe.customers.list({ email: userData.user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) customerId = customers.data[0].id;

    const origin = req.headers.get("origin") || "https://denied.care";

    // Create checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : userData.user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Deposit for booking at ${booking.provider_slug}`,
              description: `25% deposit for medical procedure booking`,
            },
            unit_amount: depositAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/booking/${booking_id}?status=success`,
      cancel_url: `${origin}/booking/${booking_id}?status=cancelled`,
      metadata: {
        booking_id,
        user_id: userData.user.id,
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Save checkout session ID to booking
    await supabaseClient
      .from("bookings")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", booking_id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
