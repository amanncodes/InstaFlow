export function computeNextEligibleTime(
  lastExecutedAt: Date | null,
  minGapMinutes: number
): Date {
  const baseDelay = minGapMinutes * 60 * 1000;
  const jitter = Math.random() * baseDelay * 0.4; // ±40%
  const delay = baseDelay + jitter;

  return new Date(
    (lastExecutedAt?.getTime() ?? Date.now()) + delay
  );
}
