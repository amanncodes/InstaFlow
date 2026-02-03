import { Router } from "express";
import { getAccountHealth } from "./health";

export const accountsRouter = Router();

accountsRouter.get("/:accountId/health", async (req, res) => {
    const { accountId } = req.params;

    const health = await getAccountHealth(accountId);

    if (!health) {
        return res.status(404).json({
            error: "Account not found"
        })
    }

    res.json(health);
});