import { Slide, ChatAttachment, ImageOptimizationSettings } from "../types";
import { logger } from "./logger";
import { processImage } from "../utils/imageProcessor";

const LOG_SOURCE = "geminiLiveMessaging";

export type SendMessageOptions = {
  slide?: Slide;
  text?: string | string[];
  attachments?: ChatAttachment[];
  turnComplete?: boolean;
};

interface MessagingDependencies {
  sessionOpenRef: { current: boolean };
  runWithOpenSession: (runner: (session: any) => void) => void;
  imageSettings?: ImageOptimizationSettings;
  forceTextOnly?: boolean;
}

/**
 * Creates a sendMessage function for Gemini Live session
 */
export const createSendMessage = ({
  sessionOpenRef,
  runWithOpenSession,
  imageSettings,
  forceTextOnly,
}: MessagingDependencies) => {
  const sendMessage = async (options: SendMessageOptions) => {
    logger.debug(LOG_SOURCE, "sendMessage called.");
    if (!sessionOpenRef.current) {
      logger.warn(
        LOG_SOURCE,
        "Attempted to send but session is not open. Ignoring."
      );
      return;
    }
    const { slide, text, attachments } = options;
    const turnComplete = options.turnComplete ?? true;
    const parts: any[] = [];
    
    if (slide) {
      // Only send image if the slide actually has images AND we are not in forceTextOnly mode
      if (slide.hasImages && !forceTextOnly) {
        let imageData = slide.imageDataUrl;
        if (imageSettings) {
          try {
            imageData = await processImage(imageData, imageSettings);
          } catch (e) {
            logger.warn(LOG_SOURCE, "Failed to process slide image, sending original.", e as any);
          }
        }
        
        const base64Data = imageData.split(",")[1];
        if (base64Data) {
          parts.push({
            inlineData: { mimeType: "image/png", data: base64Data },
          });
        }
      } else {
        const reason = forceTextOnly ? "forceTextOnly mode active" : "slide is text-only";
        logger.debug(LOG_SOURCE, `Skipping image payload for Slide ${slide.pageNumber} (${reason}).`);
      }

      if (slide.canvasContent && slide.canvasContent.length > 0) {
        parts.push({
          text: `Context: Canvas Content: ${JSON.stringify(slide.canvasContent)}`,
        });
      }
    }

    // Process attachments (only images are supported)
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        if (attachment.type === "image" || attachment.type === "selection") {
          let imageData = attachment.data;
          if (imageSettings) {
            try {
              imageData = await processImage(imageData, imageSettings);
            } catch (e) {
              logger.warn(LOG_SOURCE, "Failed to process attachment, sending original.", e as any);
            }
          }
          const base64Data = imageData.split(",")[1];
          if (base64Data) {
            parts.push({
              inlineData: {
                mimeType: attachment.mimeType || "image/png",
                data: base64Data,
              },
            });
          }
        }
      }
    }

    if (typeof text === "string") {
      parts.push({ text });
    } else if (Array.isArray(text)) {
      for (const t of text) {
        parts.push({ text: t });
      }
    }
    if (parts.length === 0) {
      logger.warn(
        LOG_SOURCE,
        "sendMessage called with no parts to send. Ignoring."
      );
      return;
    }
    runWithOpenSession((session) => {
      try {
        session.sendClientContent?.({
          turns: [{ role: "user", parts }],
          turnComplete,
        });
      } catch (e) {
        logger.warn(
          LOG_SOURCE,
          "sendClientContent failed in sendMessage; falling back to realtime inputs.",
          e as any
        );
        try {
          for (const p of parts) {
            if (p.inlineData) {
              session.sendRealtimeInput({
                media: {
                  data: p.inlineData.data,
                  mimeType: p.inlineData.mimeType,
                },
              });
            } else if (typeof p.text === "string") {
              session.sendRealtimeInput({ text: p.text });
            }
          }
          if (turnComplete) {
            session.sendRealtimeInput?.({ event: "end_of_turn" });
          }
        } catch {}
      }
    });
  };

  return sendMessage;
};

