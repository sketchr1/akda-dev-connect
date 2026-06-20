// Create a Stripe Connect Express account for a coder and return the onboarding URL.
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

    const userId = userData.user.id;
    const email = userData.user.email ?? undefined;

    const { data: cp, error: cpErr } = await supabase
      .from("coder_profiles")
      .select("profile_id, stripe_account_id")
      .eq("profile_id", userId)
      .maybeSingle();
    if (cpErr || !cp) {
      return new Response(JSON.stringify({ error: "Coder profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia" });

    let accountId = cp.stripe_account_id ?? null;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email,
        capabilities: {
          transfers: { requested: true },
        },
        metadata: { user_id: userId },
      });
      accountId = account.id;

      const { error: updateErr } = await supabase
        .from("coder_profiles")
        .update({ stripe_account_id: accountId })
        .eq("profile_id", userId);
      if (updateErr) {
        console.error("Failed to save stripe_account_id:", updateErr);
        throw new Error("Failed to save Stripe account");
      }
    }

    const { return_url } = await req.json().catch(() => ({ return_url: null }));
    const origin = req.headers.get("origin") ?? "";
    const refresh = return_url || `${origin}/`;

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refresh,
      return_url: refresh,
      type: "account_onboarding",
    });

    return new Response(
      JSON.stringify({ url: link.url, account_id: accountId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("create-connect-account error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
