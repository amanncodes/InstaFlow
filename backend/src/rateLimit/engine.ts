import { RATE_LIMIT_RULES, ActionType } from "./rules";
import { recordAction, countActionsInWindow } from "./store";
import { emitSystemEvent } from "../events/system";
import { count } from "node:console";

export async function evaluateRateLimit(
    accountId: string,
    action: ActionType
) {
    const rule = RATE_LIMIT_RULES[action];
    if (!rule) {
        return {
            allowed: true
        };
    }

    const windowStart = new Date(
        Date.now() - rule.windowSec * 1000
    );

    const count = await countActionsInWindow(
        accountId,
        action,
        windowStart
    );

    if (count >= rule.max) {
        // Emit warning event
        await emitSystemEvent({
            accountId,
            eventType: "RATE_LIMIT_WARNING",
            severity: "warning",
            source: "system",
            payload: { action, count }
        });

        return {
            allowed: false,
            reason: `Rate limit exceeded for action ${action}. Count in last ${rule.windowSec} seconds: ${count}`
        };
    }

    // Record successful attempt
    await recordAction(accountId, action);

    return {
        allowed: true
    };
}