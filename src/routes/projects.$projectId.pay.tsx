import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { ArrowLeft, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/projects/$projectId/pay")({
  head: () => ({ meta: [{ title: "Fund escrow · Akda" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    return_to: typeof s.return_to === "string" ? s.return_to : undefined,
  }),
  component: PayPage,
});

type IntentResponse = {
  client_secret: string;
  publishable_key: string | null;
  amount: number;
};

function PayPage() {
  const { projectId } = Route.useParams();
  const { return_to } = Route.useSearch();
  const [intent, setIntent] = useState<IntentResponse | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: fnErr } = await supabase.functions.invoke<IntentResponse>(
        "create-payment-intent",
        { body: { project_id: projectId } },
      );
      if (cancelled) return;
      if (fnErr || !data?.client_secret) {
        setError(fnErr?.message ?? "Failed to start payment");
        return;
      }
      setIntent(data);
      if (data.publishable_key) {
        setStripePromise(loadStripe(data.publishable_key));
      } else {
        setError("Missing Stripe publishable key");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const options = useMemo(
    () => (intent ? { clientSecret: intent.client_secret, appearance: { theme: "night" as const } } : undefined),
    [intent],
  );

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="mt-6">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-akda" />
            <p className="font-mono text-xs uppercase tracking-wider text-akda">Akda Escrow · Fund project</p>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Secure your commission</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Funds are held in escrow and only released when you approve the delivery.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-card">
          {error && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </p>
          )}

          {!error && !intent && (
            <p className="text-sm text-muted-foreground">Preparing payment…</p>
          )}

          {intent && stripePromise && options && (
            <>
              <div className="mb-6 flex items-center justify-between rounded-xl border border-border bg-surface p-4">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Total to escrow</span>
                <span className="text-xl font-semibold">${(intent.amount / 100).toLocaleString()}</span>
              </div>
              <Elements stripe={stripePromise} options={options}>
                <CheckoutForm projectId={projectId} returnTo={return_to} />
              </Elements>
              <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-akda" />
                Encrypted by Stripe. Akda never sees your card.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CheckoutForm({ projectId, returnTo }: { projectId: string; returnTo?: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);

    const { error: submitErr, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (submitErr) {
      toast.error("Payment failed", { description: submitErr.message });
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      const { error: confirmErr } = await supabase.functions.invoke("confirm-escrow-funded", {
        body: { project_id: projectId, payment_intent_id: paymentIntent.id },
      });
      if (confirmErr) {
        toast.error("Payment captured but escrow update failed", { description: confirmErr.message });
        setSubmitting(false);
        return;
      }
      toast.success("Escrow funded", { description: "Project is now active." });
      navigate({ to: "/" });
    } else {
      toast(`Payment ${paymentIntent?.status ?? "pending"}`);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-akda px-4 py-3 text-sm font-medium text-primary-foreground shadow-glow transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
      >
        <Sparkles className="h-4 w-4" />
        {submitting ? "Processing…" : "Fund escrow"}
      </button>
    </form>
  );
}
