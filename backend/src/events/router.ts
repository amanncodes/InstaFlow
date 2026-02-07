import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { EventSchema } from "./schema";
import { applyEventScore } from "../scoring/engine";
import { describeEvent } from "./describe";

export const eventsRouter = Router();

eventsRouter.get("/", async (_req, res) => {
  const events = await prisma.accountEvent.findMany({
    orderBy: { occurredAt: "desc" },
    take: 200
  });

  const mapped = events.map((e) => ({
    id: e.eventId,
    accountId: e.accountId,
    type: e.eventType,
    severity: e.severity === "danger" ? "CRITICAL" : e.severity.toUpperCase(),
    description: describeEvent(e.eventType, e.payload as Prisma.JsonValue),
    timestamp: e.occurredAt.toISOString(),
    metadata: e.payload as Record<string, unknown> | null
  }));

  res.json(mapped);
});

eventsRouter.post("/", async (req, res) => {
  const parsed = EventSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid event payload",
      details: parsed.error.flatten()
    });
  }

  const e = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.account.upsert({
        where: { id: e.accountId },
        update: {},
        create: {
          id: e.accountId,
          username: e.accountId
        }
      });

      await tx.accountEvent.create({
        data: {
          eventId: e.eventId,
          accountId: e.accountId,
          sessionId: e.sessionId,
          eventType: e.eventType,
          severity: e.severity,
          source: e.source,
          occurredAt: new Date(e.occurredAt),
          payload: e.payload as Prisma.InputJsonValue
        }
      });
    });

    // ✅ apply scoring AFTER transaction
    await applyEventScore(e.accountId, e.eventType);

    return res.status(201).json({ status: "event_ingested" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Event ingestion failed" });
  }
});
