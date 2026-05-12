import { coders } from "./coders";

export type WorkspaceStage =
  | "initialized"
  | "escrow"
  | "development"
  | "review"
  | "released";

export interface WorkspaceMessage {
  from: "customer" | "coder" | "system";
  author: string;
  body: string;
  timestamp: string;
}

export interface WorkspaceDelivery {
  title: string;
  note: string;
  timestamp: string;
  files: string[];
}

export interface Workspace {
  id: string;
  projectName: string;
  coderId: string;
  customerName: string;
  customerInitials: string;
  amount: number;
  stage: WorkspaceStage;
  deadline: string;
  brief: string;
  messages: WorkspaceMessage[];
  deliveries: WorkspaceDelivery[];
}

export const workspaces: Workspace[] = [
  {
    id: "ws-001",
    projectName: "Hatid Wallet — Refund Pipeline",
    coderId: "mira-delgado",
    customerName: "Liana Cruz",
    customerInitials: "LC",
    amount: 4800,
    stage: "review",
    deadline: "May 24, 2026",
    brief:
      "Build the refund + chargeback pipeline against the existing Hatid ledger. Must handle partial refunds, audit trail, and Slack notifications for ops.",
    messages: [
      { from: "system", author: "Akda", body: "Funds locked in escrow. Development started.", timestamp: "May 12, 09:01" },
      { from: "customer", author: "Liana Cruz", body: "Welcome aboard! Brief and Figma are in the pinned message.", timestamp: "May 12, 09:14" },
      { from: "coder", author: "Mira Delgado", body: "Got it. Spinning up a sandbox today, first cut by Friday.", timestamp: "May 12, 09:30" },
      { from: "coder", author: "Mira Delgado", body: "Delivery v1 uploaded — covers full refund + partial. Try the staging link.", timestamp: "May 18, 17:42" },
    ],
    deliveries: [
      {
        title: "v1 — Full + partial refunds",
        note: "Staging up at refund-staging.hatid.test. All ledger writes are double-entry. Slack webhook stub included.",
        timestamp: "May 18, 17:42",
        files: ["refund-pipeline.zip", "schema-v1.sql", "README.md"],
      },
    ],
  },
  {
    id: "ws-002",
    projectName: "Lumen DS — Token migration",
    coderId: "aileen-park",
    customerName: "Tomás Rivera",
    customerInitials: "TR",
    amount: 2200,
    stage: "development",
    deadline: "Jun 02, 2026",
    brief: "Migrate the existing Lumen tokens from SCSS to CSS variables and ship a codemod for consumers.",
    messages: [
      { from: "system", author: "Akda", body: "Funds locked in escrow.", timestamp: "May 09, 11:00" },
      { from: "coder", author: "Aileen Park", body: "Codemod scaffolding done. Running against 3 internal apps next.", timestamp: "May 11, 14:20" },
    ],
    deliveries: [],
  },
];

export const getWorkspace = (id: string) => workspaces.find((w) => w.id === id);
export const getWorkspacesForCoder = (coderId: string) =>
  workspaces.filter((w) => w.coderId === coderId);

export const stageOrder: WorkspaceStage[] = [
  "initialized",
  "escrow",
  "development",
  "review",
  "released",
];

export const stageLabels: Record<WorkspaceStage, string> = {
  initialized: "Payment Initialized",
  escrow: "Funds in Escrow",
  development: "Development",
  review: "Review / Tweaks",
  released: "Payment Released",
};

export const COMMISSION_RATE = 0.1;

export interface EarningsRow {
  workspaceId: string;
  project: string;
  customer: string;
  status: "released" | "in-escrow" | "pending";
  gross: number;
  date: string;
}

export const earnings: Record<string, EarningsRow[]> = {
  "mira-delgado": [
    { workspaceId: "ws-001", project: "Hatid Wallet — Refund Pipeline", customer: "Liana Cruz", status: "in-escrow", gross: 4800, date: "May 12" },
    { workspaceId: "past-009", project: "Hatid — KYC review queue", customer: "Liana Cruz", status: "released", gross: 3600, date: "Apr 28" },
    { workspaceId: "past-007", project: "Banco Norte — Webhook retry", customer: "R. Mendoza", status: "released", gross: 2100, date: "Apr 14" },
    { workspaceId: "past-003", project: "Tindahan POS — Tax engine", customer: "M. Ocampo", status: "released", gross: 5400, date: "Mar 22" },
  ],
};

// Quick reverse lookup
export const coderIdToName = Object.fromEntries(coders.map((c) => [c.id, c.name]));
