// Backup helpers: gather/apply the local preferences (settings) and small
// browser-side utilities to download a JSON string and to read a picked file.

import { theme } from "./theme.svelte";
import { zoom } from "./zoom.svelte";
import { font, type FontChoice } from "./font.svelte";
import { viewMode } from "./viewmode.svelte";

export interface SettingsBackup {
  format: "dano-settings";
  version: number;
  exported_at: number;
  theme: "system" | "light" | "dark";
  zoom: number;
  font: FontChoice;
  viewMode: "compact" | "cards";
}

export function exportSettings(): SettingsBackup {
  return {
    format: "dano-settings",
    version: 1,
    exported_at: Date.now(),
    theme: theme.choice,
    zoom: zoom.value,
    font: font.value,
    viewMode: viewMode.mode,
  };
}

export function applySettings(data: unknown): void {
  const s = data as Partial<SettingsBackup> | null;
  if (!s || s.format !== "dano-settings") {
    throw new Error("Not a valid DANO settings file.");
  }
  if (s.theme === "system" || s.theme === "light" || s.theme === "dark") theme.set(s.theme);
  if (typeof s.zoom === "number") zoom.set(s.zoom);
  if (s.font === "sans" || s.font === "serif" || s.font === "mono" || s.font === "rounded") font.set(s.font);
  if (s.viewMode === "compact" || s.viewMode === "cards") viewMode.set(s.viewMode);
}

// Trigger a save of a text payload. Prefers the native Tauri "Save As" dialog
// (lets the user choose folder + name); falls back to a browser download.
export async function saveJSON(suggestedName: string, text: string): Promise<"saved" | "cancelled"> {
  try {
    const dialog = await import("@tauri-apps/plugin-dialog");
    const fs = await import("@tauri-apps/plugin-fs");
    const path = await dialog.save({
      defaultPath: suggestedName,
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (!path) return "cancelled";
    await fs.writeTextFile(path, text);
    return "saved";
  } catch {
    // Not in Tauri (or plugin unavailable) — fall back to browser download.
    downloadJSON(suggestedName, text);
    return "saved";
  }
}

// Browser-download fallback for a text payload.
export function downloadJSON(filename: string, text: string): void {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Open a JSON file and return its parsed contents. Prefers the native Tauri
// "Open" dialog; falls back to an <input type=file> picker.
export async function openJSON(): Promise<unknown> {
  try {
    const dialog = await import("@tauri-apps/plugin-dialog");
    const fs = await import("@tauri-apps/plugin-fs");
    const path = await dialog.open({
      multiple: false,
      directory: false,
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (!path || typeof path !== "string") throw new Error("No file selected.");
    const text = await fs.readTextFile(path);
    return JSON.parse(text);
  } catch (e) {
    // If the user cancelled the native dialog, surface that; otherwise try the
    // browser picker as a fallback.
    if (e instanceof Error && e.message === "No file selected.") throw e;
    return pickJSON();
  }
}

// <input type=file> fallback picker.
export function pickJSON(): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) { reject(new Error("No file selected.")); return; }
      const reader = new FileReader();
      reader.onload = () => {
        try { resolve(JSON.parse(String(reader.result))); }
        catch { reject(new Error("Could not parse JSON.")); }
      };
      reader.onerror = () => reject(new Error("Could not read file."));
      reader.readAsText(file);
    };
    input.click();
  });
}

// A timestamped filename like dano-content-2026-05-31.json
export function backupFilename(kind: "content" | "settings"): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `dano-${kind}-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
}
