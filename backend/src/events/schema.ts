import { z } from "zod";

export const EventSchema = z.object({
  eventId: z.string().min(1),
  accountId: z.string().min(1),
  sessionId: z.string().optional(),

  eventType: z.enum([
    "SESSION_STARTED",
    "SESSION_ENDED",
    "SESSION_ABORTED",
    "LOGIN_SUCCESS",
    "LOGIN_CHALLENGE",
    "LOGIN_FAILED",
    "LOGOUT",
    "ACTION_ATTEMPTED",
    "ACTION_SUCCESS",
    "ACTION_FAILED",
    "ACTION_BLOCKED",
    "WARNING_RECEIVED",
    "TEMP_RESTRICTION",
    "SHADOWBAN_SUSPECTED",
    "ACCOUNT_PAUSED",
    "ACCOUNT_RESUMED",
    "ACCOUNT_FROZEN",
    "MANUAL_OVERRIDE"
  ]),

  severity: z.enum(["info", "warning", "danger"]),
  source: z.enum(["automation_worker", "manual", "system"]),

  occurredAt: z.string().datetime(),
  payload: z.record(z.string(), z.unknown()) 
});

export type EventInput = z.infer<typeof EventSchema>;
