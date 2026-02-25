import React, { useEffect, useRef, useState } from "react";
import { TranscriptEntry, LectureSessionState, ChatAttachment } from "../types";
import { useToast } from "../hooks/useToast";

import ChatMessage from "./Chat/ChatMessage";
import ChatInput from "./Chat/ChatInput";

interface TranscriptPanelProps {
  isVisible: boolean;
  onClose: () => void;
  transcript: TranscriptEntry[];
  isDesktop?: boolean;
  onSendMessage: (message: string, attachments?: ChatAttachment[]) => void;
  sessionState: LectureSessionState;
  attachments: ChatAttachment[];
  onAddFile: (file: File) => Promise<void>;
  onAddSelection: (imageDataUrl: string) => void;
  onRemoveAttachment: (id: string) => void;
  onClearAttachments: () => void;
}

const TranscriptPanel: React.FC<TranscriptPanelProps> = ({
  isVisible,
  onClose,
  transcript,
  isDesktop = false,
  onSendMessage,
  sessionState,
  attachments,
  onAddFile,
  onAddSelection,
  onRemoveAttachment,
  onClearAttachments,
}) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { showToast } = useToast();
  const previousTranscriptLengthRef = useRef(transcript.length);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Scroll to bottom when transcript changes (for new messages)
  useEffect(() => {
    if (transcript.length > 0 && isVisible) {
      const transcriptLengthChanged =
        previousTranscriptLengthRef.current !== transcript.length;

      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        if (transcriptLengthChanged && endOfMessagesRef.current) {
          // Smooth scroll for new messages
          endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
        }
      });

      previousTranscriptLengthRef.current = transcript.length;
    }
  }, [transcript, isVisible]);

  // Scroll to bottom when panel becomes visible with existing messages (initial load or reopening)
  useEffect(() => {
    if (isVisible && transcript.length > 0) {
      // Use a small delay to ensure the panel is fully rendered and visible
      const timeoutId = setTimeout(() => {
        if (scrollContainerRef.current) {
          // Scroll immediately to bottom when panel becomes visible
          scrollContainerRef.current.scrollTop =
            scrollContainerRef.current.scrollHeight;
        }
      }, 150);

      return () => clearTimeout(timeoutId);
    }
  }, [isVisible, transcript.length]);

  const handleCopyMessage = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => {
        setCopiedIndex(null);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy message:", error);
      showToast("Failed to copy message to clipboard", "error");
    }
  };

  const togglePlayStop = (index: number, base64: string) => {
    if (playingIndex === index) {
      // Stop behavior
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingIndex(null);
      setAudioUrl(null);
      return;
    }

    // Stop current audio if any
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    try {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      setAudioUrl(url);
      setPlayingIndex(index);
    } catch (error) {
      console.error("Failed to prepare audio:", error);
      showToast("Failed to prepare audio", "error");
    }
  };

  const isInputActive = [
    LectureSessionState.READY,
    LectureSessionState.LECTURING,
    LectureSessionState.LISTENING,
  ].includes(sessionState);

  const desktopClasses =
    "h-full bg-gray-800/50 border-r border-gray-700 transition-all duration-300 ease-in-out flex-shrink-0";
  const desktopVisibility = isVisible ? "w-96" : "w-0";

  // Removed border, background, and margin for mobile to make it frameless
  const mobileClasses = "transition-all duration-300 ease-in-out";
  const mobileVisibility = isVisible ? "h-64" : "h-0";

  return (
    <div
      className={`${
        isDesktop
          ? `${desktopClasses} ${desktopVisibility}`
          : `${mobileClasses} ${mobileVisibility}`
      } overflow-hidden`}
    >
      <div
        className={`flex flex-col h-full overflow-hidden ${
          isDesktop ? "w-96" : ""
        }`}
      >
        {isDesktop && (
          <header
            className={`flex items-center justify-between border-b border-gray-700 flex-shrink-0 p-4`}
          >
            <h2 className={`text-xl font-semibold`}>Lecture Transcript</h2>
          </header>
        )}
        <div
          ref={scrollContainerRef}
          className={`flex-1 overflow-y-auto overflow-x-hidden ${
            isDesktop ? "p-4" : "p-2"
          }`}
        >
          <div className={`${isDesktop ? "space-y-6" : "space-y-3"}`}>
            {transcript.map((entry, index) => (
              <ChatMessage
                key={index}
                entry={entry}
                index={index}
                isDesktop={isDesktop}
                copiedIndex={copiedIndex}
                onCopy={handleCopyMessage}
                playingIndex={playingIndex}
                onTogglePlayStop={togglePlayStop}
                audioUrl={audioUrl}
                audioRefCallback={(el) => (audioRef.current = el)}
                onAudioEnded={() => {
                  setPlayingIndex(null);
                  setAudioUrl(null);
                }}
              />
            ))}
            <div ref={endOfMessagesRef} />
          </div>
          {transcript.length === 0 && (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p className={isDesktop ? "" : "text-sm"}>
                Transcript will appear here...
              </p>
            </div>
          )}
        </div>
        <ChatInput
          message={message}
          setMessage={setMessage}
          attachments={attachments}
          onRemoveAttachment={onRemoveAttachment}
          onAddFile={onAddFile}
          onSendMessage={onSendMessage}
          isInputActive={isInputActive}
          isDesktop={isDesktop}
          onClearAttachments={onClearAttachments}
        />
      </div>
    </div>
  );
};

export default TranscriptPanel;
