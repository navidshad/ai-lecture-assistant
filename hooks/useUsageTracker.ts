import { useState, useCallback, useMemo, useRef } from "react";
import { UsageReport, TokenUsage } from "../types";
import { calculateTotalSessionCost } from "../utils/costCalculator";

/**
 * Hook to manage AI usage reports and cost calculation.
 * Extracted from useGeminiLive to provide a clean "Usage Store" interface.
 */
export const useUsageTracker = (initialReports: UsageReport[]) => {
  const [reports, setReports] = useState<UsageReport[]>(initialReports);
  
  // We keep track of the cumulative total tokens from all PREVIOUSLY completed turns
  // to calculate the delta for the current turn.
  // promptTokenCount (from API) = Entire History + New Input
  // Delta Input = promptTokenCount - History
  const previousSessionTotalTokensRef = useRef(0);

  const estimatedCost = useMemo(() => {
    return calculateTotalSessionCost(reports);
  }, [reports]);

  /**
   * Processes incoming usage metadata from the Live API.
   * Calculates the delta usage for the current turn and updates the report list.
   */
  const trackLiveTurnUsage = useCallback((params: {
    modelId: string;
    usageMetadata: any;
    isFinal: boolean;
    tag?: string;
  }) => {
    const { modelId, usageMetadata, isFinal, tag = 'slide_conversation' } = params;

    const promptTokens = usageMetadata.promptTokenCount ?? usageMetadata.prompt_token_count ?? 0;
    const completionTokens = (
      usageMetadata.responseTokenCount ??
      usageMetadata.response_token_count ??
      usageMetadata.candidatesTokenCount ??
      usageMetadata.candidates_token_count ??
      0
    ) + (usageMetadata.thoughtsTokenCount ?? 0);
    const totalTokens = usageMetadata.totalTokenCount ?? usageMetadata.total_token_count ?? 0;

    const inputDelta = Math.max(0, promptTokens - previousSessionTotalTokensRef.current);
    const turnUsage: TokenUsage = {
      promptTokens: inputDelta,
      completionTokens: completionTokens,
      totalTokens: inputDelta + completionTokens,
    };

    const report: UsageReport = {
      modelId,
      usage: turnUsage,
      timestamp: Date.now(),
      callType: isFinal ? "live_turn" : "live_turn_ongoing",
      tag,
    };

    setReports((prev) => {
      const next = [...prev];
      const lastIdx = next.length - 1;
      
      // If the last report is an ongoing turn report, replace it with the new update
      if (lastIdx >= 0 && next[lastIdx].callType === "live_turn_ongoing") {
        next[lastIdx] = report;
      } else {
        // Otherwise, this is the start of a new turn
        next.push(report);
      }
      return next;
    });

    if (isFinal) {
      previousSessionTotalTokensRef.current = totalTokens;
    }

    return turnUsage;
  }, []);

  /**
   * Adds a generic report (e.g., plan generation, markdown fix).
   */
  const addReport = useCallback((report: UsageReport) => {
    setReports((prev) => [...prev, report]);
  }, []);

  return {
    reports,
    estimatedCost,
    trackLiveTurnUsage,
    addReport,
    setReports,
  };
};
