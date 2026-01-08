import { MODELS as MODEL_DEFS } from "./modelCosts.static";

export const MODELS = MODEL_DEFS.filter((m) => m.type === "live").map((m) => ({
  id: m.id,
  name: m.name,
}));

export type ModelId = (typeof MODELS)[number]["id"];


