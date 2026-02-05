import { BaseAction } from "../contracts";

export type ExecutorResultStatus =
  | "SUCCESS"
  | "FAILURE"
  | "SKIPPED"
  | "RETRY";

export interface ExecutorResult {
  actionId: string;
  status: ExecutorResultStatus;
  error?: string;
  metadata?: Record<string, any>;
}

export interface ActionExecutor {
  execute(action: BaseAction): Promise<ExecutorResult>;
}
