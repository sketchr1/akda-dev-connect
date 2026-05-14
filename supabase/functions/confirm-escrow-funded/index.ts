// Verify a PaymentIntent succeeded then mark escrow funded + project active.
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

    const { data: userData, error: userErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { project_id, payment_intent_id } = await req.json();
    if (!project_id || !payment_intent_id) {
      return new Response(JSON.stringify({ error: "project_id and payment_intent_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller owns the project
    const { data: project, error: projErr } = await supabase
      .from("projects")
      .select("id, customer_id")
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

    // Verify with Stripe (don't trust the client)
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia" });
    const intent = await stripe.paymentIntents.retrieve(payment_intent_id);
    if (intent.metadata?.project_id !== project_id) {
      return new Response(JSON.stringify({ error: "Intent does not match project" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (intent.status !== "succeeded") {
      return new Response(JSON.stringify({ error: `Payment not completed (${intent.status})` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [{ error: escErr }, { error: projUpdateErr }] = await Promise.all([
      supabase
        .from("escrow")
        .update({ status: "funded", payment_intent_id })
        .eq("project_id", project_id),
      supabase
        .from("projects")
        .update({ status: "active" })
        .eq("id", project_id),
    ]);

    if (escErr || projUpdateErr) {
      console.error("Update error:", escErr, projUpdateErr);
      throw new Error("Failed to update escrow/project status");
    }

    return new Response(JSON.stringify({ ok: true, status: "funded" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("confirm-escrow-funded error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
