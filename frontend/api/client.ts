import {
  Account,
  AccountHealth,
  AccountEvent,
  MetricPoint,
  RiskAxis,
  ActivityPoint,
  PerformanceStats,
  FleetMetricPoint,
  AccountNote
} from "../types";

import { MOCK_ACCOUNTS, MOCK_EVENTS } from "./mockData";

/**
 * Toggle mock mode.
 * - true  → full UI demo without backend
 * - false → real backend integration
 */
const USE_MOCKS = false;

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

/* ------------------------------------------------------------------ */
/* ----------------------- MOCK STORES (DEV) ------------------------- */
/* ------------------------------------------------------------------ */

let accounts = [...MOCK_ACCOUNTS];
let events = [...MOCK_EVENTS];
let notesStore: Record<string, AccountNote[]> = {};

const delay = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

/* ------------------------------------------------------------------ */
/* ---------------------- VISUAL ENRICHERS --------------------------- */
/* ------------------------------------------------------------------ */

const generateAutomationLogs = (accountId: string): AccountEvent[] => {
  const actions = ["LIKE", "FOLLOW", "COMMENT", "DM"];
  const logs: AccountEvent[] = [];

  for (let i = 0; i < 8; i++) {
    const success = Math.random() > 0.15;
    const action = actions[Math.floor(Math.random() * actions.length)];
    const time = new Date(
      Date.now() - (i * 15 + Math.random() * 10) * 60000
    ).toISOString();

    logs.push({
      id: `act_${Math.random().toString(36).slice(2)}`,
      accountId,
      type: success ? "ACTION_SUCCESS" : "ACTION_RETRY",
      severity: success ? "INFO" : "WARNING",
      description: success
        ? `Executed ${action} successfully.`
        : `${action} delayed. Retrying…`,
      timestamp: time,
      metadata: { actionType: action }
    });
  }
  return logs;
};

const generateTrustHistory = (current: number): MetricPoint[] => {
  const points: MetricPoint[] = [];
  let score = current;

  for (let i = 24; i >= 0; i--) {
    const t = new Date(Date.now() - i * 3600000);
    const trend = Math.sin(i / 4) * 5;
    const noise = (Math.random() - 0.5) * 8;
    score = Math.max(5, Math.min(100, score + trend + noise));

    points.push({
      time: t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      score: Math.round(score)
    });
  }

  points[points.length - 1].score = current;
  return points;
};

const generateRiskDimensions = (risk: string): RiskAxis[] => {
  const base = risk === "HIGH" ? 35 : risk === "MEDIUM" ? 65 : 90;
  return [
    { subject: "Proxy Stability", value: base - 5 + Math.random() * 15, fullMark: 100 },
    { subject: "Request Velocity", value: base - 15 + Math.random() * 30, fullMark: 100 },
    { subject: "Session TTL", value: base - 2 + Math.random() * 10, fullMark: 100 },
    { subject: "Engagement Quality", value: base + Math.random() * 15, fullMark: 100 },
    { subject: "Auth Integrity", value: base - 10 + Math.random() * 20, fullMark: 100 }
  ].map(v => ({ ...v, value: Math.round(v.value) }));
};

const generateActivityPulse = (): ActivityPoint[] =>
  Array.from({ length: 12 }, (_, i) => ({
    hour: `${(i * 2).toString().padStart(2, "0")}:00`,
    requests: Math.floor(Math.sin(i / 11 * Math.PI) * 60 + 20 + Math.random() * 30)
  }));

const generatePerformanceStats = (risk: string): PerformanceStats => {
  const base = risk === "HIGH" ? 40 : risk === "MEDIUM" ? 75 : 98;
  return {
    success: base,
    failure: Math.round((100 - base) * 0.3),
    throttled: Math.round((100 - base) * 0.7),
    totalActions24h: Math.floor(Math.random() * 5000) + 1200
  };
};

/* ------------------------------------------------------------------ */
/* --------------------------- API ---------------------------------- */
/* ------------------------------------------------------------------ */

export const api = {
  /* ---------------- ACCOUNTS ---------------- */

  getAccounts: async (): Promise<Account[]> => {
    if (USE_MOCKS) {
      await delay(300);
      return accounts;
    }
    return http<Account[]>("/api/accounts");
  },

  getAccountHealth: async (id: string): Promise<AccountHealth> => {
    if (USE_MOCKS) {
      await delay(400);
      const acc = accounts.find(a => a.accountId === id);
      if (!acc) throw new Error("Account not found");

      const combined = [
        ...events.filter(e => e.accountId === id),
        ...generateAutomationLogs(id)
      ].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() -
          new Date(a.timestamp).getTime()
      );

      return {
        ...acc,
        recentSignals: combined,
        trustHistory: generateTrustHistory(acc.trustScore),
        riskDimensions: generateRiskDimensions(acc.riskLevel),
        activityPulse: generateActivityPulse(),
        performance: generatePerformanceStats(acc.riskLevel),
        notes: notesStore[id] ?? []
      };
    }

    const base = await http<AccountHealth>(
      `/api/accounts/${id}/health`
    );

    return {
      ...base,
      trustHistory: generateTrustHistory(base.trustScore),
      riskDimensions: generateRiskDimensions(base.riskLevel),
      activityPulse: generateActivityPulse(),
      performance: generatePerformanceStats(base.riskLevel),
      notes: notesStore[id] ?? []
    };
  },

  /* ---------------- ADMIN ACTIONS ---------------- */

  pauseAccount: async (id: string) => {
    if (USE_MOCKS) {
      accounts = accounts.map(a =>
        a.accountId === id ? { ...a, state: "PAUSED" } : a
      );
      return;
    }
    await http(`/api/admin/accounts/${id}/pause`, { method: "POST" });
  },

  resumeAccount: async (id: string) => {
    if (USE_MOCKS) {
      accounts = accounts.map(a =>
        a.accountId === id ? { ...a, state: "ACTIVE" } : a
      );
      return;
    }
    await http(`/api/admin/accounts/${id}/resume`, { method: "POST" });
  },

  freezeAccount: async (id: string) => {
    if (USE_MOCKS) {
      accounts = accounts.map(a =>
        a.accountId === id ? { ...a, state: "FROZEN" } : a
      );
      return;
    }
    await http(`/api/admin/accounts/${id}/freeze`, { method: "POST" });
  },

  resetTrust: async (id: string) => {
    if (USE_MOCKS) {
      accounts = accounts.map(a =>
        a.accountId === id
          ? { ...a, trustScore: 100, riskLevel: "LOW" }
          : a
      );
      return;
    }
    await http(`/api/admin/accounts/${id}/reset-trust`, { method: "POST" });
  },

  /* ---------------- EVENTS ---------------- */

  getGlobalEvents: async (): Promise<AccountEvent[]> => {
    if (USE_MOCKS) {
      await delay(400);
      return [...events].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() -
          new Date(a.timestamp).getTime()
      );
    }
    return http<AccountEvent[]>("/api/events");
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

  /* ---------------- FLEET METRICS (UI SYNTHETIC) ---------------- */

  getFleetMetrics: async (): Promise<FleetMetricPoint[]> => {
    await delay(300);
    return Array.from({ length: 24 }, (_, i) => ({
      time: `${i.toString().padStart(2, "0")}:00`,
      avgTrust: Math.round(70 + Math.sin(i / 3) * 10),
      totalActions: Math.round(800 + Math.cos(i / 4) * 300)
    }));
  }
};
