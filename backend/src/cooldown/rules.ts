import { EventType } from "@prisma/client";

export interface CooldownRule {
    cooldownMinutes: number;
    recoverTrust: number;
}

export const COOLDOWN_RULES: Partial<Record<EventType, CooldownRule>> = {
    RATE_LIMIT_WARNING: {
        cooldownMinutes: 30,
        recoverTrust: 5,
    },
    TEMP_RESTRICTION: {
        cooldownMinutes: 120,
        recoverTrust: 10,
    },
    CHALLENGE_REQUIRED: {
        cooldownMinutes: 360,
        recoverTrust: 20,
    }
};