export type ModelType = "live" | "auxiliary";

export interface ModelDefinition {
  id: string;
  name: string;
  type: ModelType;
  inputPer1M: number;
  outputPer1M: number;
}

export const MODEL_REGISTRY: Record<string, ModelDefinition> = {
  "gemini-2.5-flash-native-audio-preview-09-2025": {
    id: "gemini-2.5-flash-native-audio-preview-09-2025",
    name: "Gemini 2.5 Flash Native Audio",
    type: "live",
    inputPer1M: 0.1,
    outputPer1M: 0.4,
  },
  "gemini-2.0-flash-exp": {
    id: "gemini-2.0-flash-exp",
    name: "Gemini 2.0 Flash",
    type: "auxiliary",
    inputPer1M: 0.1,
    outputPer1M: 0.4,
  },
  "gemini-2.5-pro": {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro (Plan Gen)",
    type: "auxiliary",
    inputPer1M: 1.25,
    outputPer1M: 5.0,
  },
};

export const MODELS = Object.values(MODEL_REGISTRY);

export const MODEL_CONFIGS = {
  PLAN_GENERATION: MODEL_REGISTRY["gemini-2.5-pro"].id,
  MARKDOWN_FIXER: MODEL_REGISTRY["gemini-2.0-flash-exp"].id,
};

export const DEFAULT_MODEL_COST = {
  inputPer1M: 0.1,
  outputPer1M: 0.4,
};
