import { Request, Response, NextFunction } from "express";
import { evaluateRateLimit } from "./engine";
import { ActionType } from "./rules";

export function rateLimit(action: ActionType) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const accountId = req.body.accountId;
    if (!accountId) {
      return res.status(400).json({
        error: "accountId required"
      });
    }

    const result = await evaluateRateLimit(accountId, action);

    if (!result.allowed) {
      return res.status(429).json({
        error: "Rate limited",
        reason: result.reason
      });
    }

    next();
  };
}
