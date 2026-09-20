import { apiFetch } from "./client";
import type { AppSettingsDto } from "./types";

export function getSettings(): Promise<AppSettingsDto> {
  return apiFetch<AppSettingsDto>("/api/settings");
}

export function updateSettings(settings: AppSettingsDto): Promise<AppSettingsDto> {
  return apiFetch<AppSettingsDto>("/api/settings", { method: "PUT", body: JSON.stringify(settings) });
}
