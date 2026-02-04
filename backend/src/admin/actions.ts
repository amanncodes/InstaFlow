import { prisma } from "../db";
import { emitSystemEvent } from "../events/system";
import { AccountState } from "@prisma/client";

export async function pauseAccount(
  accountId: string,
  reason = "manual_pause"
) {
  await prisma.account.update({
    where: { id: accountId },
    data: { state: "PAUSED" }
  });

  await emitSystemEvent({
    accountId,
    eventType: "MANUAL_OVERRIDE",
    severity: "warning",
    payload: { action: "PAUSE", reason }
  });
}

export async function resumeAccount(
  accountId: string,
  reason = "manual_resume"
) {
  await prisma.account.update({
    where: { id: accountId },
    data: { state: "ACTIVE" }
  });

  await emitSystemEvent({
    accountId,
    eventType: "MANUAL_OVERRIDE",
    severity: "info",
    payload: { action: "RESUME", reason }
  });
}

export async function resetTrustScore(
  accountId: string,
  trustScore = 100
) {
  await prisma.account.update({
    where: { id: accountId },
    data: { trustScore }
  });

  await emitSystemEvent({
    accountId,
    eventType: "MANUAL_OVERRIDE",
    severity: "info",
    payload: { action: "RESET_TRUST", trustScore }
  });
}

export async function freezeAccount(
  accountId: string,
  reason = "severe_violation"
) {
  await prisma.account.update({
    where: { id: accountId },
    data: { state: "FROZEN" }
  });

  await emitSystemEvent({
    accountId,
    eventType: "MANUAL_OVERRIDE",
    severity: "danger",
    payload: { action: "FREEZE", reason }
  });
}
