import type { ExtraLibraryEntry } from "@/types";

export function normalizeExtraLibraries(raw: unknown): ExtraLibraryEntry[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: ExtraLibraryEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const name = String((item as ExtraLibraryEntry).name ?? "").trim();
    const purpose = String((item as ExtraLibraryEntry).purpose ?? "").trim();
    if (!name) continue;
    out.push({ name, purpose });
    if (out.length >= 24) break;
  }
  return out.length ? out : undefined;
}
