import { BaseAction } from "./actions";
import { AbortCondition } from "./abortConditions";

export interface ActionSequence {
  id: string;
  accountId: string;

  intent: string;              // COMMENT, FOLLOW, WARMUP, etc.
  surface: "WEB" | "MOBILE";

  actions: BaseAction[];

  abortOn?: AbortCondition[];
  createdAt: string;
}
