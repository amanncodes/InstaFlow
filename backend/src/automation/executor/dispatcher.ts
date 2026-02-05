import { BaseAction } from "../contracts";
import { ActionExecutor, ExecutorResult } from "./executor";
import { mockExecutor } from "./mockExecutor";

export async function dispatchAction(
  action: BaseAction
): Promise<ExecutorResult> {
  // 🔒 In future: route based on surface, account, region
  const executor: ActionExecutor = mockExecutor;

  return executor.execute(action);
}
