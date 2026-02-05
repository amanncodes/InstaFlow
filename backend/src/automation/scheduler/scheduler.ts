import { computeDailyBudget } from "./budget";
import { computeNextEligibleTime } from "./cadence";

export function canScheduleSequence(params: {
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  sequencesUsedToday: number;
  lastSequenceAt: Date | null;
}): { allowed: boolean; reason?: string; nextEligibleAt?: Date } {
  const budget = computeDailyBudget(
    params.riskLevel,
    params.sequencesUsedToday
  );

  if (budget.remaining <= 0) {
    return { allowed: false, reason: "DAILY_LIMIT_REACHED" };
  }

  const nextAllowedAt = computeNextEligibleTime(
    params.lastSequenceAt,
    AUTOMATION_LIMITS[params.riskLevel].minGapMinutes
  );

  if (nextAllowedAt > new Date()) {
    return {
      allowed: false,
      reason: "COOLDOWN_ACTIVE",
      nextEligibleAt: nextAllowedAt
    };
  }

  return { allowed: true };
}
