import { Router } from "express";
import fs from "fs";
import path from "path";
import { getAccountHealth } from "./health";
import { prisma } from "../db";

export const accountsRouter = Router();

accountsRouter.get("/", async (_req, res) => {
    const accounts = await prisma.account.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            events: {
                orderBy: { occurredAt: "desc" },
                take: 1,
                select: { occurredAt: true }
            }
        }
    });

    if (!accounts.length) {
        return res.json([]);
    }

    const avatarsRoot = path.join(__dirname, "..", "..", "public", "avatars");

    const response = accounts.map((account) => {
        const riskLevel =
            account.trustScore >= 70 ? "LOW" : account.trustScore >= 40 ? "MEDIUM" : "HIGH";

        const candidateNames = [account.id, account.username].filter(Boolean);
        const avatarFile = candidateNames.find((name) =>
            fs.existsSync(path.join(avatarsRoot, `${name}.jpg`))
        );
        const avatarUrl = avatarFile ? `/static/avatars/${avatarFile}.jpg` : "";

        return {
            accountId: account.id,
            username: account.username,
            state: account.state,
            trustScore: account.trustScore,
            riskLevel,
            lastEventAt: account.events[0]?.occurredAt ?? null,
            avatarUrl
        };
    });

    res.json(response);
});

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
