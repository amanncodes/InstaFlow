import { AutomationAction } from "./actions";

export type AutomationIntent =
    | "WARMUP"
    | "ENGAGE"
    | "GROW"
    | "IDLE";

export type ActionSequence = {
    sequenceId: string;
    accountId: string;

    intent: AutomationIntent;
    actions: AutomationAction[];

    maxTotalDurationMs: number; // Max total duration for the entire sequence
    cooldownAfterMs: number;

    createdAt: string;
};