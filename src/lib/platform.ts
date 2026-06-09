// Platform seam. Nothing outside this file should branch on the runtime directly,
// so mobile (iOS/Android) can swap implementations later without touching screens.

import { invoke } from "@tauri-apps/api/core";
import { openPath } from "@tauri-apps/plugin-opener";

/** Running inside the Tauri runtime (desktop today, native mobile later). */
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/** Copy a picked file into the app data dir; returns its absolute path. */
export async function saveAttachmentFile(file: File): Promise<string> {
  const bytes = Array.from(new Uint8Array(await file.arrayBuffer()));
  return invoke<string>("save_attachment", { name: file.name, bytes });
}

/** Open a saved file with the OS default application. */
export async function openAttachment(path: string): Promise<void> {
  await openPath(path);
}

/** Treat as desktop unless we detect a small/touch viewport. */
export function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 768px)").matches;
}

export function isDesktop(): boolean {
  return !isMobileViewport();
}
