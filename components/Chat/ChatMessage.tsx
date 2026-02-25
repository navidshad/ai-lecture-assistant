import React from "react";
import { User, Bot, Copy, Check, Play, Square } from "lucide-react";
import { TranscriptEntry } from "../../types";
import MarkdownRenderer from "../MarkdownRenderer";
import MessageAttachments from "./MessageAttachments";
import { formatCost } from "../../utils/costCalculator";

interface ChatMessageProps {
  entry: TranscriptEntry;
  index: number;
  isDesktop: boolean;
  copiedIndex: number | null;
  onCopy: (text: string, index: number) => void;
  playingIndex: number | null;
  onTogglePlayStop: (index: number, audioBase64: string) => void;
  audioUrl: string | null;
  audioRefCallback: (el: HTMLAudioElement | null) => void;
  onAudioEnded: () => void;
}

const ChatMessage: React.FC<ChatMessageProps> = React.memo(({
  entry,
  index,
  isDesktop,
  copiedIndex,
  onCopy,
  playingIndex,
  onTogglePlayStop,
  audioUrl,
  audioRefCallback,
  onAudioEnded,
}) => {
  const isPlaying = playingIndex === index;

  return (
    <div className={`flex items-start ${isDesktop ? "gap-3" : "gap-2"}`}>
      <div
        className={`flex-shrink-0 rounded-full flex items-center justify-center ${
          isDesktop ? "h-8 w-8" : "h-6 w-6"
        } ${entry.speaker === "user" ? "bg-blue-600" : "bg-purple-600"}`}
      >
        {entry.speaker === "user" ? (
          <User className={isDesktop ? "h-5 w-5" : "h-3 w-3"} />
        ) : (
          <Bot className={isDesktop ? "h-5 w-5" : "h-3 w-3"} />
        )}
      </div>
      <div
        className={`flex-1 min-w-0 bg-gray-700 rounded-lg relative group ${
          isDesktop ? "p-3" : "p-2"
        }`}
      >
        {entry.text && (
          <button
            onClick={() => onCopy(entry.text, index)}
            className={`absolute top-2 right-2 ${
              isDesktop ? "opacity-0 group-hover:opacity-100" : "opacity-70"
            } transition-opacity flex items-center justify-center rounded p-1.5 bg-gray-600 hover:bg-gray-500 text-gray-300 hover:text-white ${
              isDesktop ? "w-7 h-7" : "w-6 h-6"
            }`}
            title="Copy message"
            aria-label="Copy message"
          >
            {copiedIndex === index ? (
              <Check className={isDesktop ? "w-4 h-4" : "w-3 h-3"} />
            ) : (
              <Copy className={isDesktop ? "w-4 h-4" : "w-3 h-3"} />
            )}
          </button>
        )}
        {entry.speaker === "ai" && entry.audioBase64 && (
          <button
            onClick={() => onTogglePlayStop(index, entry.audioBase64!)}
            className={`absolute top-2 ${
              entry.text ? (isDesktop ? "right-11" : "right-10") : "right-2"
            } ${
              isDesktop ? "opacity-0 group-hover:opacity-100" : "opacity-70"
            } transition-opacity flex items-center justify-center rounded p-1.5 bg-gray-600 hover:bg-gray-500 text-gray-300 hover:text-white ${
              isDesktop ? "w-7 h-7" : "w-6 h-6"
            }`}
            title={isPlaying ? "Stop audio" : "Play audio"}
            aria-label={isPlaying ? "Stop audio" : "Play audio"}
          >
            {isPlaying ? (
              <Square className={isDesktop ? "w-4 h-4" : "w-3 h-3"} fill="currentColor" />
            ) : (
              <Play className={isDesktop ? "w-4 h-4" : "w-3 h-3"} fill="currentColor" />
            )}
          </button>
        )}
        <div className="mb-1 flex items-center gap-2">
          <span
            className={`${
              isDesktop ? "px-2 py-0.5 text-xs" : "px-1.5 py-0.5 text-[10px]"
            } inline-flex items-center rounded-md bg-gray-600 text-gray-200`}
          >
            Slide {entry.slideNumber}
          </span>
          {entry.estimatedCost != null && entry.estimatedCost > 0 && (
            <span
              className={`${isDesktop ? "text-xs" : "text-[10px]"} text-gray-400 font-medium`}
            >
              Cost: {formatCost(entry.estimatedCost)}
            </span>
          )}
        </div>
        {entry.text && (
          <div
            className={`${isDesktop ? "" : "text-xs"} break-words`}
            style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
          >
            <MarkdownRenderer markdown={entry.text} />
          </div>
        )}
        {isPlaying && audioUrl && (
          <div className="mt-2 py-1 border-t border-gray-600">
            <audio
              ref={(el) => {
                audioRefCallback(el);
                if (el && el.paused && isPlaying) {
                  el.play().catch(console.error);
                }
              }}
              src={audioUrl}
              controls
              className="w-full h-8 brightness-90 contrast-125"
              onEnded={onAudioEnded}
            />
          </div>
        )}
        {entry.attachments && entry.attachments.length > 0 && (
          <MessageAttachments attachments={entry.attachments} isDesktop={isDesktop} />
        )}
      </div>
    </div>
  );
});

export default ChatMessage;
