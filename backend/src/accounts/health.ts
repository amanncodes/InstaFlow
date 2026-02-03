import { prisma } from "../db";

export async function getAccountHealth(accountId: string) {
    const account = await prisma.account.findUnique({
        where: { id: accountId },
        include: {
            events: {
                orderBy: { occurredAt: "desc"},
                take: 5,
                select: {
                    eventType: true,
                    severity: true,
                    occurredAt: true
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
    
    return {
        accountId: account.id,
        state: account.state,
        trustScore,
        riskLevel,
        lastEventAt: account.events[0]?.occurredAt ?? null,
        recentSignals: account.events
    };
}