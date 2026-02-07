import { Router } from "express";
import fs from "fs";
import path from "path";
import { spawn, spawnSync } from "child_process";
import { getAccountHealth } from "./health";
import { prisma } from "../db";

export const accountsRouter = Router();

const resolvePython = () => {
    const repoRoot = path.join(__dirname, "..", "..", "..");
    const candidates = [
        path.join(repoRoot, "automation-engine", "login-bot", ".venv", "Scripts", "python.exe"),
        path.join(repoRoot, "automation-engine", "login-bot", ".venv", "bin", "python"),
        "python",
        "python3"
    ];
    for (const candidate of candidates) {
        if (candidate === "python" || candidate === "python3") return candidate;
        if (fs.existsSync(candidate)) return candidate;
    }
    return "python";
};

const tryExtractAvatar = (username: string) => {
    const repoRoot = path.join(__dirname, "..", "..", "..");
    const scriptPath = path.join(repoRoot, "automation-engine", "utility", "dp_extrcator.py");
    if (!fs.existsSync(scriptPath)) return;

    const python = resolvePython();
    const result = spawnSync(
        python,
        [scriptPath, "--username", username],
        { stdio: "ignore", timeout: 20000 }
    );

    if (result.error) {
        console.error("[avatar] extraction failed:", result.error.message);
    }
};

const kickOffAvatarExtraction = (username: string) => {
    const repoRoot = path.join(__dirname, "..", "..", "..");
    const scriptPath = path.join(repoRoot, "automation-engine", "utility", "dp_extrcator.py");
    if (!fs.existsSync(scriptPath)) return;

    const python = resolvePython();
    try {
        const child = spawn(python, [scriptPath, "--username", username], {
            stdio: "ignore",
            detached: true
        });
        child.unref();
    } catch (err) {
        console.error("[avatar] async extraction failed:", (err as Error).message);
    }
};

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

    const filtered = accounts.filter((account) => {
        if (account.id === "acc_001" || account.username === "acc_001") return false;
        if (account.id === account.username && /^acc_\d+$/i.test(account.id)) return false;
        return true;
    });

    const response = filtered.map((account, index) => {
        const riskLevel =
            account.trustScore >= 70 ? "LOW" : account.trustScore >= 40 ? "MEDIUM" : "HIGH";

        const displayId = `acc_${String(index + 1).padStart(3, "0")}`;
        const candidateNames = [account.id, account.username, displayId].filter(Boolean);
        const avatarFile = candidateNames.find((name) =>
            fs.existsSync(path.join(avatarsRoot, `${name}.jpg`))
        );
        const legacyFallback =
            !avatarFile && filtered.length === 1 && fs.existsSync(path.join(avatarsRoot, "acc_001.jpg"));
        const avatarUrl = avatarFile
            ? `/static/avatars/${avatarFile}.jpg`
            : legacyFallback
            ? "/static/avatars/acc_001.jpg"
            : `/api/accounts/${account.id}/avatar`;

        if (!avatarFile && !legacyFallback && account.username) {
            kickOffAvatarExtraction(account.username);
        }

        return {
            accountId: account.id,
            username: account.username,
            displayId,
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

accountsRouter.get("/:accountId/avatar", async (req, res) => {
    const { accountId } = req.params;

    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account) {
        return res.status(404).json({ error: "Account not found" });
    }

    const avatarsRoot = path.join(__dirname, "..", "..", "public", "avatars");
    const candidateNames = [account.id, account.username, "acc_001"].filter(Boolean);
    const existing = candidateNames.find((name) =>
        fs.existsSync(path.join(avatarsRoot, `${name}.jpg`))
    );

    if (existing) {
        return res.redirect(`/static/avatars/${existing}.jpg`);
    }

    // Best-effort avatar extraction on demand.
    if (account.username) {
        tryExtractAvatar(account.username);
    }

    const after = candidateNames.find((name) =>
        fs.existsSync(path.join(avatarsRoot, `${name}.jpg`))
    );
    if (after) {
        return res.redirect(`/static/avatars/${after}.jpg`);
    }

    return res.status(404).json({ error: "Avatar not available yet" });
});
