import React, { useCallback, useRef } from "react";
import { Dispatch, SetStateAction } from "react";
import { TranscriptEntry, ChatAttachment } from "../types";

interface UseTranscriptManagerParams {
  setTranscript: Dispatch<SetStateAction<TranscriptEntry[]>>;
  currentSlideIndexRef: React.MutableRefObject<number>;
  aiMessageOpenRef: React.MutableRefObject<boolean>;
}

/**
 * Hook for managing transcript entries
 */
export const useTranscriptManager = ({
  setTranscript,
  currentSlideIndexRef,
  aiMessageOpenRef,
}: UseTranscriptManagerParams) => {
  const addTranscriptEntry = useCallback(
    (
      text: string,
      speaker: "user" | "ai",
      options?: {
        slideNumber?: number;
        attachments?: ChatAttachment[];
        updateLastEntry?: boolean;
        estimatedCost?: number;
      }
    ) => {
      const trimmed = text.trim();
      // Skip empty messages
      if (!trimmed) {
        return;
      }

      const slideNumber =
        options?.slideNumber ?? currentSlideIndexRef.current + 1;

      setTranscript((prev) => {
        const newTranscript = [...prev];
        const lastEntry = newTranscript[newTranscript.length - 1];

        // Handle updating existing entry (for streaming transcriptions)
        if (options?.updateLastEntry && lastEntry?.speaker === speaker) {
          const trimmedText = trimmed;
          // Skip if this chunk already appears at the end of the last entry
          if ((lastEntry.text || "").endsWith(trimmedText)) {
            return prev;
          }
          // Replace with latest transcript-so-far to avoid duplicate words
          const prevText = lastEntry.text || "";
          if (text.startsWith(prevText)) {
            lastEntry.text = text;
          } else if (prevText.startsWith(text)) {
            // keep prevText (no change)
          } else {
            // fallback: append if server is sending pure deltas
            lastEntry.text = prevText + text;
          }
          // Ensure slide number is set
          if (!lastEntry.slideNumber) {
            lastEntry.slideNumber = slideNumber;
          }
        } else {
          // Add new entry
          newTranscript.push({
            speaker,
            text,
            slideNumber,
            attachments: options?.attachments,
            estimatedCost: options?.estimatedCost,
          });
          if (speaker === "ai") {
            aiMessageOpenRef.current = true;
          }
        }
        return newTranscript;
      });
    },
    [setTranscript, currentSlideIndexRef, aiMessageOpenRef]
  );

  const setEntryCost = useCallback(
    (cost: number, speaker: "ai" | "user") => {
      setTranscript((prev) => {
        const next = [...prev];
        // Find the last entry by this speaker to update
        for (let i = next.length - 1; i >= 0; i--) {
          if (next[i].speaker === speaker) {
            next[i].estimatedCost = cost;
            break;
          }
        }
        return next;
      });
    },
    [setTranscript]
  );

  return { addTranscriptEntry, setEntryCost };
};

