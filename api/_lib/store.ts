import { kv } from "@vercel/kv";
import type { Contest, Report, SystemSettings } from "./types";

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

export async function getReports(): Promise<Report[]> {
  return (await kv.get<Report[]>("reports")) ?? [];
}

export async function saveReports(reports: Report[]): Promise<void> {
  await kv.set("reports", reports);
}

export async function getContests(): Promise<Contest[]> {
  const data = await kv.get<Contest[]>("contests");
  if (!data || data.length === 0) {
    await kv.set("contests", DEFAULT_CONTESTS);
    return DEFAULT_CONTESTS;
  }
  return data;
}

export async function saveContests(contests: Contest[]): Promise<void> {
  await kv.set("contests", contests);
}

export async function getSettings(): Promise<SystemSettings> {
  const data = await kv.get<SystemSettings>("settings");
  if (!data) {
    await kv.set("settings", DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
  return data;
}

export async function saveSettings(settings: SystemSettings): Promise<void> {
  await kv.set("settings", settings);
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
