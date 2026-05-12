import portfolio1 from "@/assets/portfolio-1.jpg";
import portfolio2 from "@/assets/portfolio-2.jpg";
import portfolio3 from "@/assets/portfolio-3.jpg";

export type CoderStatus = "open" | "working" | "busy";

export interface PortfolioItem {
  title: string;
  description: string;
  image: string;
  client: string;
}

export interface Coder {
  id: string;
  name: string;
  handle: string;
  title: string;
  bio: string;
  homeLanguage: string;
  fluency: string[];
  status: CoderStatus;
  commendations: number;
  hourlyRate: number;
  yearsExperience: number;
  location: string;
  initials: string;
  accent: string;
  portfolio: PortfolioItem[];
  discord?: { handle: string; verified: boolean };
}

export const coders: Coder[] = [
  {
    id: "mira-delgado",
    name: "Mira Delgado",
    handle: "@miracode",
    title: "Full-stack engineer · payments & APIs",
    bio: "Eight years building production payment systems for fintech in SEA. I write boring code on purpose — boring code ships.",
    homeLanguage: "Tagalog",
    fluency: ["TypeScript", "Python", "Go", "PostgreSQL"],
    status: "open",
    commendations: 142,
    hourlyRate: 85,
    yearsExperience: 8,
    location: "Manila, PH",
    initials: "MD",
    accent: "from-blue-500 to-cyan-400",
    portfolio: [
      { title: "Hatid Wallet", description: "Cross-border remittance infra processing $4M/month with sub-second settlement.", image: portfolio1, client: "Hatid Financial" },
      { title: "Reps Tracker", description: "Native iOS fitness companion with adaptive program engine.", image: portfolio2, client: "Studio Ironwood" },
    ],
  },
  {
    id: "kenji-arroyo",
    name: "Kenji Arroyo",
    handle: "@kenji.dev",
    title: "Backend & infra · Java / Kotlin",
    bio: "I migrate legacy monoliths without breaking your weekends. Specialty: JVM systems at scale.",
    homeLanguage: "English",
    fluency: ["Java", "Kotlin", "Rust", "Kubernetes"],
    status: "working",
    commendations: 98,
    hourlyRate: 110,
    yearsExperience: 11,
    location: "Cebu, PH",
    initials: "KA",
    accent: "from-indigo-500 to-blue-500",
    portfolio: [
      { title: "Veritas Ledger", description: "Event-sourced ledger handling 12k TPS for a regional bank.", image: portfolio3, client: "Veritas Bank" },
      { title: "Arc Dashboard", description: "Internal ops dashboard cutting investigation time by 70%.", image: portfolio1, client: "Arc Logistics" },
    ],
  },
  {
    id: "aileen-park",
    name: "Aileen Park",
    handle: "@aileenpark",
    title: "Product engineer · React & design systems",
    bio: "I turn Figma into shipped product. Design systems, component libraries, accessibility — pixel by pixel.",
    homeLanguage: "Korean",
    fluency: ["TypeScript", "React", "Swift", "CSS"],
    status: "open",
    commendations: 207,
    hourlyRate: 95,
    yearsExperience: 7,
    location: "Seoul, KR",
    initials: "AP",
    accent: "from-violet-500 to-fuchsia-500",
    portfolio: [
      { title: "Lumen DS", description: "Open-source design system adopted by 40+ engineering teams.", image: portfolio2, client: "Lumen Co." },
      { title: "Fold Editor", description: "Collaborative document editor with real-time presence.", image: portfolio1, client: "Fold Inc." },
    ],
  },
  {
    id: "diego-marquez",
    name: "Diego Marquez",
    handle: "@diegoml",
    title: "ML engineer · vision & inference",
    bio: "Computer vision systems for retail and manufacturing. Edge inference is my love language.",
    homeLanguage: "Spanish",
    fluency: ["Python", "C++", "CUDA", "PyTorch"],
    status: "busy",
    commendations: 76,
    hourlyRate: 130,
    yearsExperience: 9,
    location: "Mexico City, MX",
    initials: "DM",
    accent: "from-emerald-500 to-teal-400",
    portfolio: [
      { title: "Stockwatch CV", description: "Shelf monitoring across 800 retail stores using on-device vision.", image: portfolio3, client: "Stockwatch" },
    ],
  },
  {
    id: "noor-rahman",
    name: "Noor Rahman",
    handle: "@noor.codes",
    title: "Mobile lead · iOS & Android",
    bio: "Cross-platform mobile from prototype to App Store. Shipped 30+ apps across health, finance, and travel.",
    homeLanguage: "Bahasa",
    fluency: ["Swift", "Kotlin", "Dart", "TypeScript"],
    status: "open",
    commendations: 118,
    hourlyRate: 90,
    yearsExperience: 10,
    location: "Jakarta, ID",
    initials: "NR",
    accent: "from-amber-500 to-orange-500",
    portfolio: [
      { title: "Tide Health", description: "Telemedicine platform serving 1.2M patients across Indonesia.", image: portfolio2, client: "Tide Health" },
      { title: "Wayfarer", description: "Offline-first travel companion with map tile caching.", image: portfolio1, client: "Wayfarer Co." },
    ],
  },
  {
    id: "olivia-chen",
    name: "Olivia Chen",
    handle: "@oliviac",
    title: ".NET architect · enterprise systems",
    bio: "Enterprise C# since the .NET Framework days. I bring structure to chaos and tests to legacy code.",
    homeLanguage: "Mandarin",
    fluency: ["C#", "F#", "TypeScript", "Azure"],
    status: "working",
    commendations: 154,
    hourlyRate: 120,
    yearsExperience: 14,
    location: "Singapore",
    initials: "OC",
    accent: "from-sky-500 to-blue-600",
    portfolio: [
      { title: "Helix CRM", description: "Multi-tenant CRM rebuild — 6x faster, 40% lower infra cost.", image: portfolio1, client: "Helix Group" },
      { title: "Sentinel Audit", description: "Compliance audit pipeline for regulated financial entities.", image: portfolio3, client: "Sentinel Audit" },
    ],
  },
];

export const getCoder = (id: string) => coders.find((c) => c.id === id);

export const statusConfig: Record<CoderStatus, { label: string; dot: string; text: string; bg: string }> = {
  open: { label: "Open for Work", dot: "bg-status-open", text: "text-status-open", bg: "bg-status-open/10 border-status-open/30" },
  working: { label: "Working", dot: "bg-status-working", text: "text-status-working", bg: "bg-status-working/10 border-status-working/30" },
  busy: { label: "Busy", dot: "bg-status-busy", text: "text-status-busy", bg: "bg-status-busy/10 border-status-busy/30" },
};
