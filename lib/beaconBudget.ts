/**
 * Budget Tiers & Expense Alignment System Utilities for Solo-No-More Beacons
 * Simplified to 4 clear, crowd-friendly choices:
 * - 50-50 Split
 * - 40-60 Split
 * - Host Treats
 * - Applicant Treats Host
 */

export interface BudgetTier {
  id: string;
  label: string;
  short: string;
  badgeBg: string;
  badgeBorder: string;
  badgeColor: string;
}

export const BUDGET_TIERS: BudgetTier[] = [
  {
    id: "50_50",
    label: "🤝 50-50 Split",
    short: "50-50 Split",
    badgeBg: "rgba(255, 160, 92, 0.12)",
    badgeBorder: "rgba(255, 160, 92, 0.28)",
    badgeColor: "#FFA05C",
  },
  {
    id: "40_60",
    label: "⚖️ 40-60 Split",
    short: "40-60 Split",
    badgeBg: "rgba(168, 85, 247, 0.15)",
    badgeBorder: "rgba(168, 85, 247, 0.35)",
    badgeColor: "#C084FC",
  },
  {
    id: "host_treats",
    label: "🎁 Host Treats",
    short: "Host Treats",
    badgeBg: "rgba(39, 201, 63, 0.12)",
    badgeBorder: "rgba(39, 201, 63, 0.28)",
    badgeColor: "#27C93F",
  },
  {
    id: "applicant_treats",
    label: "☕ Applicant Treats Host",
    short: "Applicant Treats Host",
    badgeBg: "rgba(59, 130, 246, 0.15)",
    badgeBorder: "rgba(59, 130, 246, 0.35)",
    badgeColor: "#60A5FA",
  },
];

export function parseBeaconMeta(rawDescription: string | null): {
  description: string;
  budgetTier: string;
  customQuestion: string;
} {
  if (!rawDescription) {
    return {
      description: "",
      budgetTier: BUDGET_TIERS[0].label,
      customQuestion: "",
    };
  }

  let budgetTier = BUDGET_TIERS[0].label;
  let customQuestion = "";
  let cleanDesc = rawDescription;

  const budgetMatch = cleanDesc.match(/\[BUDGET:\s*([^\]]+)\]/);
  if (budgetMatch) {
    const rawTier = budgetMatch[1].trim();
    // Normalize or match existing tier
    const found = BUDGET_TIERS.find(
      (b) =>
        b.label.toLowerCase() === rawTier.toLowerCase() ||
        b.short.toLowerCase() === rawTier.toLowerCase() ||
        rawTier.toLowerCase().includes(b.short.toLowerCase())
    );
    budgetTier = found ? found.label : rawTier;
    cleanDesc = cleanDesc.replace(budgetMatch[0], "");
  }

  const questionMatch = cleanDesc.match(/\[QUESTION:\s*([^\]]+)\]/);
  if (questionMatch) {
    customQuestion = questionMatch[1].trim();
    cleanDesc = cleanDesc.replace(questionMatch[0], "");
  }

  return {
    description: cleanDesc.trim(),
    budgetTier,
    customQuestion,
  };
}

export function formatBeaconDescription(
  cleanDesc: string,
  budgetTier?: string,
  customQuestion?: string
): string {
  let result = cleanDesc.trim();
  if (budgetTier) {
    result += `\n[BUDGET: ${budgetTier.trim()}]`;
  }
  if (customQuestion && customQuestion.trim()) {
    result += `\n[QUESTION: ${customQuestion.trim()}]`;
  }
  return result.trim();
}
