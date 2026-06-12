import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function SendBriefDialog({
  open,
  onOpenChange,
  coderUserId,
  coderName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coderUserId: string | null;
  coderName: string;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Sign in required", { description: "Please sign in to send a brief." });
      navigate({ to: "/login" });
      return;
    }
    if (!coderUserId) {
      toast.error("Coder unavailable");
      return;
    }
    const budgetNum = Number(budget);
    if (title.trim().length < 4) return toast.error("Title must be at least 4 characters");
    if (description.trim().length < 20) return toast.error("Description must be at least 20 characters");
    if (!Number.isFinite(budgetNum) || budgetNum < 1) return toast.error("Budget must be at least $1");

    setSubmitting(true);
    try {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 30);

      const { data: project, error: projectErr } = await supabase
        .from("projects")
        .insert({
          customer_id: user.id,
          coder_id: coderUserId,
          title: title.trim(),
          description: description.trim(),
          budget_usd: budgetNum,
          deadline: deadline.toISOString().slice(0, 10),
          skills: [],
          status: "open",
        })
        .select("id")
        .single();
      if (projectErr || !project) throw projectErr ?? new Error("Could not create project");

      const { error: escrowErr } = await supabase.from("escrow").insert({
        project_id: project.id,
        status: "pending",
        amount_usd: budgetNum,
      });
      if (escrowErr) throw escrowErr;

      const { data: workspace, error: wsErr } = await supabase
        .from("workspaces")
        .insert({
          project_id: project.id,
          customer_id: user.id,
          coder_id: coderUserId,
        })
        .select("id")
        .single();
      if (wsErr || !workspace) throw wsErr ?? new Error("Could not create workspace");

      toast.success("Brief sent", { description: `${coderName} has been notified.` });
      onOpenChange(false);
      navigate({ to: "/workspaces/$workspaceId", params: { workspaceId: workspace.id } });
    } catch (err: any) {
      toast.error("Could not send brief", { description: err?.message ?? "Try again in a moment." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send a brief to {coderName}</DialogTitle>
          <DialogDescription>
            Funds are held in escrow and released only when you approve the delivery.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brief-title">Project title</Label>
            <Input
              id="brief-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g. Refund pipeline for our wallet app"
              maxLength={120}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brief-description">Description</Label>
            <Textarea
              id="brief-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What outcome do you need? Include scope, tech, and timeline."
              rows={5}
              maxLength={4000}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brief-budget">Budget (USD)</Label>
            <Input
              id="brief-budget"
              type="number"
              min={1}
              step={1}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="2500"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send brief"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
