import { neon } from "@neondatabase/serverless";
import type { Contest, Report, SystemSettings } from "./types.js";

const sql = neon(process.env.DATABASE_URL!);

const DEFAULT_SETTINGS: SystemSettings = { adminPasscode: "admin123" };

const DEFAULT_CONTESTS: Contest[] = [
  {
    id: "default-contest",
    name: "Cuộc thi trực tuyến 2026",
    year: "2026",
    status: "active",
    createdAt: new Date().toISOString()
  }
];

let schemaReady: Promise<void> | null = null;
function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS kv (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `;
    })();
  }
  return schemaReady;
}

async function kvGet<T>(key: string): Promise<T | null> {
  await ensureSchema();
  const rows = (await sql`SELECT value FROM kv WHERE key = ${key}`) as Array<{
    value: T;
  }>;
  return rows.length === 0 ? null : rows[0].value;
}

async function kvSet(key: string, value: unknown): Promise<void> {
  await ensureSchema();
  await sql`
    INSERT INTO kv (key, value, updated_at)
    VALUES (${key}, ${JSON.stringify(value)}::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value, updated_at = NOW()
  `;
}

export async function getReports(): Promise<Report[]> {
  return (await kvGet<Report[]>("reports")) ?? [];
}

export async function saveReports(reports: Report[]): Promise<void> {
  await kvSet("reports", reports);
}

export async function getContests(): Promise<Contest[]> {
  const data = await kvGet<Contest[]>("contests");
  if (!data || data.length === 0) {
    await kvSet("contests", DEFAULT_CONTESTS);
    return DEFAULT_CONTESTS;
  }
  return data;
}

export async function saveContests(contests: Contest[]): Promise<void> {
  await kvSet("contests", contests);
}

export async function getSettings(): Promise<SystemSettings> {
  const data = await kvGet<SystemSettings>("settings");
  if (!data) {
    await kvSet("settings", DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
  return data;
}

export async function saveSettings(settings: SystemSettings): Promise<void> {
  await kvSet("settings", settings);
}

export function formatDateTimeVN(isoOrDateStr?: string): string {
  if (!isoOrDateStr) return "";
  try {
    const d = new Date(isoOrDateStr);
    return (
      d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }) +
      " " +
      d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    );
  } catch {
    return isoOrDateStr;
  }
}
