import { getAccountHealth } from "../accounts/health";

export type GuardDecision =
  | { allowed: true; reason?: string }
  | { allowed: false; reason: string };

export async function evaluateAutomationGuard(
  accountId: string
): Promise<GuardDecision> {
  const health = await getAccountHealth(accountId);

  if (!health) {
    return {
      allowed: false,
      reason: "Account not found"
    };
  }

  if (health.state !== "ACTIVE") {
    return {
      allowed: false,
      reason: `Account is ${health.state}`
    };
  }

  if (health.riskLevel === "HIGH") {
    return {
      allowed: false,
      reason: "Account risk level is HIGH"
    };
  }

  if (health.riskLevel === "MEDIUM") {
    return {
      allowed: true,
      reason: "Account risk level is MEDIUM — proceed cautiously"
    };
  }

  return { allowed: true };
}
