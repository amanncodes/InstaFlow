import { prisma } from "../db";
import { ActionType } from "./rules";

export async function recordAction(
  accountId: string,
  action: ActionType
) {
  await prisma.accountEvent.create({
    data: {
      eventId: `evt_${Date.now()}`,
      accountId,
      eventType: "ACTION_ATTEMPTED",
      severity: "info",
      source: "system",
      occurredAt: new Date(),
      payload: { action }
    }
  });
}

export async function countActionsInWindow(
  accountId: string,
  action: ActionType,
  since: Date
) {
  return prisma.accountEvent.count({
    where: {
      accountId,
      eventType: "ACTION_ATTEMPTED",
      occurredAt: { gte: since },
      payload: {
        path: ["action"],
        equals: action
      }
    }
  });
}
