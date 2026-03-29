// ============================================================
// lib/openai-constants.ts — safe to import from Client Components
// (no OpenAI SDK / no process.env side effects)
// ============================================================

export const MODEL = "gpt-5.4";
export const FAST_MODEL = "gpt-5.4-mini";
export const VERIFY_MODEL = "gpt-5.4-mini";

export const MAX_TOKENS = 32_768;
export const FAST_MAX_TOKENS = 16_384;

/**
 * Returns true when the model looks like an OpenAI reasoning model
 * (o1, o3, o4-mini, gpt-5.x …). Reasoning models silently fail or return
 * empty output when a custom `temperature` is passed alongside
 * `reasoning_effort`. Always omit temperature for these models.
 */
export function isReasoningModel(model: string): boolean {
  return /^o\d|gpt-5/i.test(model);
}
