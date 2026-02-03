import { EventType } from "@prisma/client";

export type ScoreRule = {
  delta: number;
  freeze?: boolean;
};

export const SCORE_RULES: Partial<
  Record<keyof typeof EventType, ScoreRule>
> = {
  // Sessions
  SESSION_STARTED: { delta: +1 },
  SESSION_ENDED: { delta: +1 },
  SESSION_ABORTED: { delta: -2 },

  // Auth
  LOGIN_SUCCESS: { delta: +2 },
  LOGIN_FAILED: { delta: -5 },
  LOGIN_CHALLENGE: { delta: -15 },

  // Automation actions
  ACTION_ATTEMPTED: { delta: 0 },
  ACTION_SUCCESS: { delta: +1 },
  ACTION_FAILED: { delta: -3 },

  // Platform signals (MATCH SCHEMA)
  WARNING_RECEIVED: { delta: -5 },
  RATE_LIMIT_WARNING: { delta: -10 },
  TEMP_RESTRICTION: { delta: -25 },

  // Critical
  CHALLENGE_REQUIRED: { delta: -40, freeze: true },
  MANUAL_OVERRIDE: { delta: 0 }
};
