import React, { useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { ChatAttachment } from "../../types";
import AttachmentList from "./AttachmentList";
import FileUploadButton from "./FileUploadButton";

interface ChatInputProps {
  message: string;
  setMessage: (val: string) => void;
  attachments: ChatAttachment[];
  onRemoveAttachment: (id: string) => void;
  onAddFile: (file: File) => Promise<void>;
  onSendMessage: (message: string, attachments?: ChatAttachment[]) => void;
  isInputActive: boolean;
  isDesktop: boolean;
  onClearAttachments: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  message,
  setMessage,
  attachments,
  onRemoveAttachment,
  onAddFile,
  onSendMessage,
  isInputActive,
  isDesktop,
  onClearAttachments,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasContent = message.trim() || attachments.length > 0;
    if (hasContent) {
      onSendMessage(
        message.trim(),
        attachments.length > 0 ? attachments : undefined
      );
      setMessage("");
      onClearAttachments();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleFormSubmit(e as any);
    }
  };

  const handleImageFileSelect = async (file: File) => {
    await onAddFile(file);
  };

  return (
    <div className={`${isDesktop ? "p-4" : "p-2 pt-0"} flex-shrink-0`}>
      {/* Attachment previews */}
      <AttachmentList
        attachments={attachments}
        onRemove={onRemoveAttachment}
        isDesktop={isDesktop}
      />

      {/* Input area */}
      <form onSubmit={handleFormSubmit} className="flex items-end gap-2 w-full">
        <div className="flex-1 flex flex-col gap-2">
          {/* File upload buttons */}
          <div className="flex items-center gap-2">
            <FileUploadButton
              onFileSelect={handleImageFileSelect}
              maxSizeMB={2}
              label="Image"
              isDesktop={isDesktop}
            />
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isInputActive
                ? "Ask a question... (Shift+Enter for new line)"
                : "Session not active"
            }
            disabled={!isInputActive}
            rows={1}
            className={`w-full bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors disabled:bg-gray-800 disabled:cursor-not-allowed resize-none overflow-hidden ${
              isDesktop ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs"
            }`}
            aria-label="Chat input"
          />
        </div>

        <button
          type="submit"
          disabled={!isInputActive || (!message.trim() && attachments.length === 0)}
          className={`flex-shrink-0 flex items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed ${
            isDesktop ? "h-10 w-10" : "h-8 w-8"
          }`}
          aria-label="Send message"
        >
          <Send className={isDesktop ? "h-5 w-5" : "h-3.5 w-3.5"} />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
