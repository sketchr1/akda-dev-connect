// Stripe webhook: payment_intent.succeeded → mark escrow funded + project active.
// Safety net in case the client-side confirm-escrow-funded call never fires.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !webhookSecret) {
    console.error("Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET");
    return new Response("Server misconfigured", { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const body = await req.text();
  const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia" });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error("Signature verification failed:", (err as Error).message);
    return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400 });
  }

  if (event.type !== "payment_intent.succeeded") {
    return new Response(JSON.stringify({ received: true, ignored: event.type }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const intent = event.data.object as Stripe.PaymentIntent;
  const projectId = intent.metadata?.project_id;
  if (!projectId) {
    console.error("payment_intent.succeeded missing metadata.project_id", intent.id);
    return new Response(JSON.stringify({ received: true, error: "no project_id" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const [{ error: escErr }, { error: projErr }] = await Promise.all([
    supabase
      .from("escrow")
      .update({ status: "funded", payment_intent_id: intent.id })
      .eq("project_id", projectId),
    supabase
      .from("projects")
      .update({ status: "active" })
      .eq("id", projectId),
  ]);

  if (escErr || projErr) {
    console.error("Update failed:", escErr, projErr);
    return new Response(JSON.stringify({ error: "DB update failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log(`stripe-webhook: project ${projectId} marked funded/active via ${intent.id}`);
  return new Response(JSON.stringify({ received: true, project_id: projectId }), {
    headers: { "Content-Type": "application/json" },
  });
});
