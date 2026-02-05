export function isIntentAllowed(
  intent: AutomationIntent,
  riskLevel: "LOW" | "MEDIUM" | "HIGH"
): boolean {
  if (riskLevel === "HIGH" && intent !== "WARMUP") return false;
  return true;
}
