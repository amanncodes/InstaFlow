export type AutomationIntentType =
  | "WARMUP"
  | "ENGAGE"
  | "GROW"
  | "IDLE"
  | "COMMENT"
  | "VIEW_STORY";

export interface Intent {
  type: AutomationIntentType;
  accountId: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}

export function selectIntent(
  accountId: string,
  riskLevel: "LOW" | "MEDIUM" | "HIGH"
): Intent {
  if (riskLevel === "HIGH") {
    return { type: "WARMUP", accountId, riskLevel };
  }

  if (riskLevel === "MEDIUM") {
    return { type: "ENGAGE", accountId, riskLevel };
  }

  return {
    type: Math.random() < 0.3 ? "GROW" : "ENGAGE",
    accountId,
    riskLevel
  };
}
