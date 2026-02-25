import { useCallback, useEffect } from "react";
import { LectureSession, UsageReport } from "../types";
import { sessionManager } from "../services/db";
import { logger } from "../services/logger";

import { optimizeSlides } from "../utils/imageMigration";

const LOG_SOURCE = "useSessionPersistence";

export function useSessionPersistence(params: {
  session: LectureSession;
  slides: LectureSession["slides"];
  transcript: LectureSession["transcript"];
  currentSlideIndex: number;
  slideGroups?: LectureSession["slideGroups"];
  usageReports: UsageReport[];
}) {
  const {
    session,
    slides,
    transcript,
    currentSlideIndex,
    slideGroups,
    usageReports,
  } = params;

  const saveSessionState = useCallback(async () => {
    logger.debug(LOG_SOURCE, "Saving session state to DB.");

    // Lazy migration: attempt to optimize slides if they are still PNG
    const { updatedSlides } = await optimizeSlides(slides);

    const updatedSession: LectureSession = {
      ...session,
      slides: updatedSlides,
      transcript,
      currentSlideIndex,
      slideGroups,
      usageReports,
    };
    try {
      await sessionManager.updateSession(updatedSession);
    } catch (e) {
      logger.error(LOG_SOURCE, "Failed to save session state", e);
    }
  }, [
    session,
    slides,
    transcript,
    currentSlideIndex,
    slideGroups,
    usageReports,
  ]);

  useEffect(() => {
    const debounceTimeout = setTimeout(saveSessionState, 5000); // Increased from 2s to 5s
    return () => clearTimeout(debounceTimeout);
  }, [saveSessionState]);

  // Ensure final save on window close or navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveSessionState();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveSessionState]);

  return { saveSessionState };
}
