// Create a Stripe PaymentIntent for a project's escrow and persist the intent id.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const publishableKey = Deno.env.get("STRIPE_PUBLISHABLE_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify caller
    const { data: userData, error: userErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { project_id } = await req.json();
    if (!project_id || typeof project_id !== "string") {
      return new Response(JSON.stringify({ error: "project_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up project + escrow; ensure caller owns the project
    const { data: project, error: projErr } = await supabase
      .from("projects")
      .select("id, customer_id, budget_usd, title, status")
      .eq("id", project_id)
      .maybeSingle();
    if (projErr || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (project.customer_id !== userData.user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: escrow, error: escErr } = await supabase
      .from("escrow")
      .select("id, status, payment_intent_id")
      .eq("project_id", project_id)
      .maybeSingle();
    if (escErr || !escrow) {
      return new Response(JSON.stringify({ error: "Escrow row missing" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (escrow.status === "funded" || escrow.status === "released") {
      return new Response(JSON.stringify({ error: "Escrow already funded" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia" });
    const amountCents = Math.round(Number(project.budget_usd) * 100);

    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        project_id: project.id,
        escrow_id: escrow.id,
        customer_id: userData.user.id,
        project_title: project.title,
      },
    });

    const { error: updateErr } = await supabase
      .from("escrow")
      .update({ payment_intent_id: intent.id })
      .eq("id", escrow.id);
    if (updateErr) console.error("Failed to save intent id:", updateErr);

    return new Response(
      JSON.stringify({
        client_secret: intent.client_secret,
        publishable_key: publishableKey ?? null,
        amount: amountCents,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("create-payment-intent error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
