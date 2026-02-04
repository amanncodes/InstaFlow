import { Request, Response, NextFunction } from "express";
import { evaluateAutomationGuard } from "./engine";
import { error } from "node:console";

export async function automationGuard(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const accountId =
        req.body.accountId || req.params.accountId;
    
    if (!accountId) {
        return res.status(400).json({
            error: "Missing accountId in request. accountId is required in automation guard middleware."
        });
    }

    const decision = await evaluateAutomationGuard(accountId);

    if (!decision.allowed) {
        return res.status(403).json({
            error: `Automation guard blocked the request`,
            reason: decision.reason
        });
    }

    // Optional: surface warnings
    if (decision.reason) {
        res.setHeader("X-Automation-Guard-Warning", decision.reason);
    }

    next();
}