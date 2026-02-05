import type { BaseAction } from "../contracts";
import type { ActionExecutor, ExecutorResult } from "./executer";

export const mockExecutor: ActionExecutor = {
  async execute(action: BaseAction): Promise<ExecutorResult> {
    return {
      actionId: action.id,
      status: "SKIPPED"
    };
  }
};
