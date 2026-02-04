import { evaluateCooldownRecovery } from "./engine";

export async function runCooldownJobs() {
    console.log("[cooldown] running recovery check...");
    await evaluateCooldownRecovery();
}

