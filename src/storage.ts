import type { WebState } from "./types";

const KEY = "word-web:v1";

export function loadWeb(): WebState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { root: null };
    const parsed = JSON.parse(raw) as WebState;
    if (!parsed || typeof parsed !== "object") return { root: null };
    return { root: parsed.root ?? null };
  } catch {
    return { root: null };
  }
}

export function saveWeb(state: WebState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore quota / privacy mode errors
  }
}

export function clearWeb(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
