import {
  ActionType,
  ActionSequence,
  ExecutionSurface
} from "../contracts";

import { Intent } from "./intent";

export function buildSequence(intent: Intent): ActionSequence {
  const now = new Date().toISOString();

  const base = {
    id: `seq_${crypto.randomUUID()}`,
    accountId: intent.accountId,
    intent: intent.type,
    surface: ExecutionSurface.MOBILE,
    createdAt: now,
    actions: []
  };

  switch (intent.type) {
    case "COMMENT":
      return {
        ...base,
        actions: [
          wait(intent.accountId, 3000, 2000),
          comment(intent.accountId),
          wait(intent.accountId, 5000, 3000)
        ]
      };

    case "VIEW_STORY":
      return {
        ...base,
        actions: [
          wait(intent.accountId, 2000, 1000),
          viewStory(intent.accountId)
        ]
      };

    default:
      throw new Error(`Unsupported intent: ${intent.type}`);
  }
}

/* ---------- action helpers ---------- */

function wait(
  accountId: string,
  durationMs: number,
  jitterMs = 0
) {
  return {
    id: `a_${crypto.randomUUID()}`,
    type: ActionType.WAIT,
    accountId,
    durationMs,
    jitterMs,
    surface: ExecutionSurface.MOBILE,
    createdAt: new Date().toISOString()
  };
}

function comment(accountId: string) {
  return {
    id: `a_${crypto.randomUUID()}`,
    type: ActionType.COMMENT,
    accountId,
    surface: ExecutionSurface.MOBILE,
    createdAt: new Date().toISOString(),
    metadata: {
      strategy: "safe_random",
      maxLength: 12
    }
  };
}

function viewStory(accountId: string) {
  return {
    id: `a_${crypto.randomUUID()}`,
    type: ActionType.VIEW_STORY,
    accountId,
    surface: ExecutionSurface.MOBILE,
    createdAt: new Date().toISOString()
  };
}
