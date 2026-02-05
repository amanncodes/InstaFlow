import { AUTOMATION_LIMITS } from "../config/automation.config";

export type AutomationBudget = {
  remaining: number;
  used: number;
  resetAt: string;
};

export function computeDailyBudget(
  riskLevel: "LOW" | "MEDIUM" | "HIGH",
  usedToday: number
): AutomationBudget {
  const limits = AUTOMATION_LIMITS[riskLevel];
  const remaining = Math.max(0, limits.dailySequences - usedToday);

  return {
    remaining,
    used: usedToday,
    resetAt: new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ).toISOString()
  };
}
