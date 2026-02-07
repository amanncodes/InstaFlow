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
    return "No additional details were provided for this event.";
  }

  if (typeof payload === "string") {
    return payload;
  }

  if (typeof payload !== "object" || Array.isArray(payload)) {
    return safeString(payload) || "No additional details were provided for this event.";
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

  pushDetail("platform", data.platform);
  pushDetail("username", data.username);
  pushDetail("target", data.target);
  pushDetail("action", data.action);
  pushDetail("status", data.status);
  pushDetail("cookies", data.cookiesCount ?? data.cookies_count);
  pushDetail("ip", data.ip);
  pushDetail("proxy", data.proxy);
  pushDetail("url", data.url);
  pushDetail("step", data.step);
  pushDetail("session", data.sessionId ?? data.session_id);
  pushDetail("rule", data.rule);

  const base = primary || eventType.replace(/_/g, " ");
  if (details.length === 0) {
    return base;
  }

  return `${base}. Details: ${details.join(", ")}`;
};
