import { ExecutorResult } from "./executor";

export type ExecutionFeedback = ExecutorResult & {
  accountId: string;
  intent: string;
  timestamp: string;
};
