import {
  ActionType,
  ActionStatus,
  ExecutionSurface
} from "./actionTypes";

export interface BaseAction {
  id: string;
  type: ActionType;
  accountId: string;
  surface: ExecutionSurface;
  createdAt: string;
  status?: ActionStatus;
  retries?: number;
  maxRetries?: number;
  metadata?: Record<string, any>;
}

export interface WaitAction extends BaseAction {
  type: ActionType.WAIT;
  durationMs: number;
  jitterMs?: number;
  maxDurationMs?: number;
}
