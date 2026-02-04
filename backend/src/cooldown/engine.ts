import { prisma } from "../db";
import { COOLDOWN_RULES } from "./rules";
import { EventType } from "@prisma/client";

export async function evaluateCooldownRecovery() {
  const pausedAccounts = await prisma.account.findMany({
    where: { state: "PAUSED" }
  });

  for (const account of pausedAccounts) {
    const lastEvent = await prisma.accountEvent.findFirst({
      where: {
        accountId: account.id,
        eventType: { in: Object.keys(COOLDOWN_RULES) as EventType[] }
      },
      orderBy: { occurredAt: "desc" }
    });

    if (!lastEvent) continue;

    const rule = COOLDOWN_RULES[lastEvent.eventType];
    if (!rule) continue;

    const recoverAt =
      new Date(lastEvent.occurredAt.getTime() +
      rule.cooldownMinutes * 60 * 1000);

    if (new Date() < recoverAt) continue;

    // ✅ Recover account
    await prisma.account.update({
      where: { id: account.id },
      data: {
        state: "ACTIVE",
        trustScore: Math.min(
          100,
          account.trustScore + rule.recoverTrust
        )
      }
    });
  }
}
