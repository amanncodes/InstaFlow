import { prisma } from "../db";
import { EventType, Severity, EventSource } from "@prisma/client";
import { applyEventScore } from "../scoring/engine";

interface SystemEventInput {
  accountId: string;
  eventType: EventType;
  severity: Severity;
  source?: EventSource;
  payload?: Record<string, any>;
}

export async function emitSystemEvent(
  input: SystemEventInput
) {
  const {
    accountId,
    eventType,
    severity,
    source = "system",
    payload = {}
  } = input;

  await prisma.$transaction(async (tx) => {
    await tx.accountEvent.create({
      data: {
        eventId: `evt_sys_${Date.now()}`,
        accountId,
        eventType,
        severity,
        source,
        occurredAt: new Date(),
        payload
      }
    });

    // apply scoring side-effects
    await applyEventScore(accountId, eventType);
  });
}
