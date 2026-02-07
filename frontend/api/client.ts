import {
  Account,
  AccountHealth,
  AccountEvent,
  FleetMetricPoint,
  AccountNote
} from "../types";

/**
 * API base URL (from Vite env)
 */
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:3000";

/**
 * HTTP helper
 */
async function http<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  return res.json();
}

const notesStore: Record<string, AccountNote[]> = {};

const normalizeAvatarUrl = (value?: string) => {
  if (!value) return value;
  return value.startsWith("/") ? `${API_BASE}${value}` : value;
};

const normalizeSeverity = (value?: string) => {
  if (!value) return "INFO";
  const v = value.toUpperCase();
  if (v === "DANGER" || v === "CRITICAL") return "CRITICAL";
  if (v === "WARNING" || v === "WARN") return "WARNING";
  return "INFO";
};

const normalizeEvent = (event: AccountEvent): AccountEvent => ({
  ...event,
  severity: normalizeSeverity(event.severity)
});

const normalizeAccount = (account: Account): Account => ({
  ...account,
  avatarUrl: normalizeAvatarUrl(account.avatarUrl)
});

const normalizeHealth = (health: AccountHealth): AccountHealth => ({
  ...health,
  avatarUrl: normalizeAvatarUrl(health.avatarUrl),
  recentSignals: Array.isArray(health.recentSignals)
    ? health.recentSignals.map(normalizeEvent)
    : []
});

export const api = {
  /* ---------------- ACCOUNTS ---------------- */

  getAccounts: async (): Promise<Account[]> => {
    const data = await http<Account[]>("/api/accounts");
    return data.map(normalizeAccount);
  },

  getAccountHealth: async (id: string): Promise<AccountHealth> => {
    const base = await http<AccountHealth>(`/api/accounts/${id}/health`);
    const normalized = normalizeHealth(base);

    return {
      ...normalized,
      notes: notesStore[id] ?? []
    };
  },

  /* ---------------- ADMIN ACTIONS ---------------- */

  pauseAccount: async (id: string) => {
    await http(`/api/admin/accounts/${id}/pause`, { method: "POST" });
  },

  resumeAccount: async (id: string) => {
    await http(`/api/admin/accounts/${id}/resume`, { method: "POST" });
  },

  freezeAccount: async (id: string) => {
    await http(`/api/admin/accounts/${id}/freeze`, { method: "POST" });
  },

  resetTrust: async (id: string) => {
    await http(`/api/admin/accounts/${id}/reset-trust`, { method: "POST" });
  },

  /* ---------------- EVENTS ---------------- */

  getGlobalEvents: async (): Promise<AccountEvent[]> => {
    const data = await http<AccountEvent[]>("/api/events");
    return data.map(normalizeEvent);
  },

  /* ---------------- NOTES (FRONTEND-ONLY FOR NOW) ---------------- */

  addNote: async (accountId: string, text: string) => {
    if (!notesStore[accountId]) notesStore[accountId] = [];
    notesStore[accountId].unshift({
      id: `note_${Math.random().toString(36).slice(2)}`,
      text,
      timestamp: new Date().toISOString(),
      operatorId: "OP_LOCAL"
    });
  },

  /* ---------------- FLEET METRICS ---------------- */

  getFleetMetrics: async (): Promise<FleetMetricPoint[]> => {
    return [];
  }
};
