import { prisma } from "../db";
import { SCORE_RULES } from "./rules";
import { EventType, AccountState } from "@prisma/client";

export async function applyEventScore(
  accountId: string,
  eventType: EventType
) {
  const rule = SCORE_RULES[eventType];
  if (!rule) return;

  const account = await prisma.account.findUnique({
    where: { id: accountId }
  });

  if (!account) return;

  const nextScore = Math.max(
    0,
    Math.min(100, account.trustScore + rule.delta)
  );

  let nextState: AccountState = account.state;

  if (rule.freeze || nextScore <= 20) {
    nextState = AccountState.FROZEN;
  } else if (nextScore <= 50) {
    nextState = AccountState.PAUSED;
  } else {
    nextState = AccountState.ACTIVE;
  }

  await prisma.account.update({
    where: { id: accountId },
    data: {
      trustScore: nextScore,
      state: nextState
    }
  });
}
