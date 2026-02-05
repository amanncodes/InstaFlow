// src/automation/contracts/enums.ts

export enum ActionType {
  WAIT = "WAIT",

  LIKE = "LIKE",
  COMMENT = "COMMENT",
  FOLLOW = "FOLLOW",
  UNFOLLOW = "UNFOLLOW",

  VIEW_STORY = "VIEW_STORY",
  SEND_DM = "SEND_DM",

  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",

  NOOP = "NOOP"
}

export enum ActionStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  SKIPPED = "SKIPPED"
}

export enum ExecutionSurface {
  WEB = "WEB",
  MOBILE = "MOBILE"
}
