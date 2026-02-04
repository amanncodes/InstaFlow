export type ActionType = 
    | "COMMENT"
    | "POST"
    | "FOLLOW"
    | "LIKE"
    | "DM";

export interface RateLimitRule {
    max: number;
    windowSec: number;
    cooldownSec?: number;
}

export const RATE_LIMIT_RULES: Record<ActionType, RateLimitRule> = {
    COMMENT: {
        max: 30,
        windowSec: 60 *60,  // 30 comments per hour
        cooldownSec: 30 * 60   // 30 minutes cooldown
    },
    POST: {
        max: 5,
        windowSec: 60 * 60
    },
    FOLLOW: {
        max: 50,
        windowSec: 60 * 60,
        cooldownSec: 60 * 60
    },
    LIKE: {
        max: 100,
        windowSec: 60 * 60
    },
    DM: {
        max: 20,
        windowSec: 60 * 60,
        cooldownSec: 2 * 60 * 60
    }
};