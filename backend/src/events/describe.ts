import { Prisma } from "@prisma/client";

type Payload = Prisma.JsonValue | null | undefined;

const safeString = (value: unknown) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

export const describeEvent = (eventType: string, payload: Payload): string => {
  if (!payload) {
    return `${eventType.replace(/_/g, " ")}. No payload was attached to this event.`;
  }

  if (typeof payload === "string") {
    return payload;
  }

  if (typeof payload !== "object" || Array.isArray(payload)) {
    return safeString(payload) || `${eventType.replace(/_/g, " ")}. No payload was attached to this event.`;
  }

  const data = payload as Record<string, unknown>;

  const primary =
    safeString(data.description) ||
    safeString(data.message) ||
    safeString(data.reason) ||
    safeString(data.error) ||
    "";

  const details: string[] = [];

  const pushDetail = (label: string, value: unknown) => {
    const v = safeString(value);
    if (v) details.push(`${label}=${v}`);
  };

  const knownKeys = new Set<string>();
  const remember = (key: string) => knownKeys.add(key);

  pushDetail("platform", data.platform); remember("platform");
  pushDetail("username", data.username); remember("username");
  pushDetail("target", data.target); remember("target");
  pushDetail("action", data.action); remember("action");
  pushDetail("status", data.status); remember("status");
  pushDetail("cookies", data.cookiesCount ?? data.cookies_count); remember("cookiesCount"); remember("cookies_count");
  pushDetail("ip", data.ip); remember("ip");
  pushDetail("proxy", data.proxy); remember("proxy");
  pushDetail("url", data.url); remember("url");
  pushDetail("step", data.step); remember("step");
  pushDetail("session", data.sessionId ?? data.session_id); remember("sessionId"); remember("session_id");
  pushDetail("rule", data.rule); remember("rule");

  for (const [key, value] of Object.entries(data)) {
    if (knownKeys.has(key)) continue;
    if (key === "description" || key === "message" || key === "reason" || key === "error") continue;
    const v = safeString(value);
    if (!v) continue;
    details.push(`${key}=${v}`);
  }

  const base = primary || eventType.replace(/_/g, " ");
  if (details.length === 0) {
    return base;
  }

  return `${base}. Details: ${details.join(", ")}`;
};
