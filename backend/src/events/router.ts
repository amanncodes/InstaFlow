import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { EventSchema } from "./schema";

export const eventsRouter = Router();

eventsRouter.post("/", async (req, res) => {
  const parsed = EventSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid event payload",
      details: parsed.error.flatten()
    });
  }

  const e = parsed.data;

  await prisma.accountEvent.create({
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

  res.status(201).json({ status: "event_ingested" });
});
