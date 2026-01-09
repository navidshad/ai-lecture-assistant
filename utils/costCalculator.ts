import { TokenUsage, UsageReport } from "../types";
import {
  MODEL_REGISTRY,
} from "../constants/modelCosts.static";

export function calculateEstimatedCost(
  modelId: string,
  usage: TokenUsage
): number {
  const modelDef = MODEL_REGISTRY[modelId];

  const promptTokens = usage.promptTokens || 0;
  const completionTokens = usage.completionTokens || 0;

  const inputCost = (promptTokens / 1_000_000) * modelDef.inputPer1M;
  const outputCost = (completionTokens / 1_000_000) * modelDef.outputPer1M;

  const total = inputCost + outputCost;
  return isNaN(total) ? 0 : total;
}

export function calculateTotalSessionCost(reports: UsageReport[]): number {
  return reports.reduce((total, report) => {
    return total + calculateEstimatedCost(report.modelId, report.usage);
  }, 0);
}

export function formatCost(cost: number): string {
  if (cost === 0) return '$0.00';
  // Use Intl.NumberFormat for cleaner currency formatting with higher precision for small amounts
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(cost);
}
