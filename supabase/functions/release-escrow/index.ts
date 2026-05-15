// Release escrowed funds: 90% to the coder via Stripe Transfer, 10% platform fee.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);

    const { project_id } = await req.json();
    if (!project_id) return json({ error: "project_id required" }, 400);

    // Verify caller is the customer on this project
    const { data: project, error: projErr } = await supabase
      .from("projects")
      .select("id, customer_id, coder_id, budget_usd, status")
      .eq("id", project_id)
      .maybeSingle();
    if (projErr || !project) return json({ error: "Project not found" }, 404);
    if (project.customer_id !== userData.user.id) return json({ error: "Forbidden" }, 403);
    if (!project.coder_id) return json({ error: "Project has no assigned coder" }, 400);

    // Load escrow row
    const { data: escrow, error: escErr } = await supabase
      .from("escrow")
      .select("id, status, payment_intent_id")
      .eq("project_id", project_id)
      .maybeSingle();
    if (escErr || !escrow) return json({ error: "Escrow not found" }, 404);
    if (escrow.status !== "funded") {
      return json({ error: `Escrow is not funded (status: ${escrow.status})` }, 400);
    }

    // Load coder Stripe account
    const { data: coder, error: coderErr } = await supabase
      .from("coder_profiles")
      .select("profile_id, stripe_account_id")
      .eq("profile_id", project.coder_id)
      .maybeSingle();
    if (coderErr || !coder) return json({ error: "Coder profile not found" }, 404);
    if (!coder.stripe_account_id) {
      return json({ error: "Coder has not connected a Stripe account" }, 400);
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia" });

    // Resolve charge to use as source_transaction (keeps funds traceable)
    let sourceTransaction: string | undefined;
    if (escrow.payment_intent_id) {
      const intent = await stripe.paymentIntents.retrieve(escrow.payment_intent_id);
      sourceTransaction = (intent.latest_charge as string | null) ?? undefined;
    }

    const totalCents = Math.round(Number(project.budget_usd) * 100);
    const coderCents = Math.floor(totalCents * 0.9);

    const transfer = await stripe.transfers.create({
      amount: coderCents,
      currency: "usd",
      destination: coder.stripe_account_id,
      ...(sourceTransaction ? { source_transaction: sourceTransaction } : {}),
      metadata: { project_id, kind: "escrow_release" },
    });

    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from("escrow").update({ status: "released" }).eq("project_id", project_id),
      supabase.from("projects").update({ status: "completed" }).eq("id", project_id),
    ]);
    if (e1 || e2) {
      console.error("Status update error:", e1, e2);
      throw new Error("Transfer succeeded but status update failed");
    }

    return json({
      ok: true,
      transfer_id: transfer.id,
      amount_to_coder_cents: coderCents,
      platform_fee_cents: totalCents - coderCents,
      prompt_commendation: true,
    });
  } catch (err) {
    console.error("release-escrow error:", err);
    return json({ error: (err as Error).message }, 500);
  }
});
