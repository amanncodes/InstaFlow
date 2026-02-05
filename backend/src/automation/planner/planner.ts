import { selectIntent } from "./intent";
import { isIntentAllowed } from "./rules";
import { buildWarmupSequence } from "./sequenceBuilder";
import { ActionSequence } from "../contracts";


export function planSequence(params: {
  accountId: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}): ActionSequence | null {
  const intent = selectIntent(params.riskLevel);

  if (!isIntentAllowed(intent, params.riskLevel)) {
    return null;
  }

  switch (intent) {
    case "WARMUP":
      return buildWarmupSequence(params.accountId);
    default:
      return null;
  }
}
