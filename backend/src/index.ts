import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  await prisma.accountEvent.create({
    data: {
      eventId: crypto.randomUUID(),
      accountId: "acc_001",
      sessionId: "sess_001",
      eventType: "SESSION_STARTED",
      severity: "info",
      source: "automation_worker",
      occurredAt: new Date(),
      payload: {
        session: {
          device: "pixel_7",
          proxy: "proxy_in_4g_1",
          timezone: "Asia/Kolkata"
        }
      }
    }
  });

  console.log(" [INFO] InstaFlow event inserted");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
