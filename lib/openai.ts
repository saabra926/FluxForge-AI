
import OpenAI from "openai";

export {
  MODEL,
  FAST_MODEL,
  VERIFY_MODEL,
  MAX_TOKENS,
  FAST_MAX_TOKENS,
  isReasoningModel,
} from "./openai-constants";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? "missing-key",
  maxRetries: 1,
  timeout: 240_000, // 4 min – reasoning models need extra time for their think-phase
});
