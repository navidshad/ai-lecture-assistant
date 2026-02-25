import { useCallback, useEffect } from "react";
import { LectureSession, UsageReport } from "../types";
import { sessionManager } from "../services/db";
import { logger } from "../services/logger";

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
    const updatedSession: LectureSession = {
      ...session,
      slides,
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
    const debounceTimeout = setTimeout(saveSessionState, 2000);
    return () => clearTimeout(debounceTimeout);
  }, [saveSessionState]);

  return { saveSessionState };
}
