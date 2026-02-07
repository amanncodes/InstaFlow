import { prisma } from "../db";
import fs from "fs";
import path from "path";
import { describeEvent } from "../events/describe";

export async function getAccountHealth(accountId: string) {
    const account = await prisma.account.findUnique({
        where: { id: accountId },
        include: {
            events: {
                orderBy: { occurredAt: "desc"},
                take: 5,
                select: {
                    eventId: true,
                    eventType: true,
                    severity: true,
                    occurredAt: true,
                    source: true,
                    payload: true
                }
            }
        }
    });

    if (!account) return null;

    const trustScore = account.trustScore;

    const riskLevel = 
        trustScore >= 70
            ? "LOW"
            : trustScore >= 40
            ? "MEDIUM"
            : "HIGH";
    
    const avatarsRoot = path.join(__dirname, "..", "..", "public", "avatars");
    const candidateNames = [account.id, account.username].filter(Boolean);
    const avatarFile = candidateNames.find((name) =>
        fs.existsSync(path.join(avatarsRoot, `${name}.jpg`))
    );

    const avatarUrl = avatarFile ? `/static/avatars/${avatarFile}.jpg` : "";

    const recentSignals = account.events.map((event) => ({
        id: event.eventId,
        accountId: account.id,
        type: event.eventType,
        severity: event.severity === "danger" ? "CRITICAL" : event.severity.toUpperCase(),
        description: describeEvent(event.eventType, event.payload as any),
        timestamp: event.occurredAt.toISOString(),
        metadata: event.payload as Record<string, unknown> | null,
        source: event.source
    }));

    return {
        accountId: account.id,
        username: account.username,
        state: account.state,
        trustScore,
        riskLevel,
        lastEventAt: account.events[0]?.occurredAt ?? null,
        avatarUrl,
        recentSignals
    };
}
