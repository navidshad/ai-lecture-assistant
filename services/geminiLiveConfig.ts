import { Modality } from "@google/genai";
import { provideCanvasMarkdownFunctionDeclaration } from "./geminiLiveUtils";

export interface SessionConfigParams {
  model: string;
  selectedVoice: string;
  selectedLanguage: string;
  generalInfo: string;
  userCustomPrompt?: string;
  resumptionHandle?: string | null;
}

/**
 * Builds the session configuration for Gemini Live API
 */
export const buildSessionConfig = ({
  model,
  selectedVoice,
  selectedLanguage,
  generalInfo,
  userCustomPrompt,
  resumptionHandle,
}: SessionConfigParams) => {
  return {
    model,
    config: {
      responseModalities: [Modality.AUDIO],
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } },
      },
      tools: [
        {
          functionDeclarations: [provideCanvasMarkdownFunctionDeclaration],
        },
      ],
      // Context window compression for unlimited session duration
      contextWindowCompression: {
        slidingWindow: {},
      },
      // Session resumption support
      ...(resumptionHandle && {
        sessionResumption: {
          handle: resumptionHandle,
        },
      }),
      systemInstruction: `You are an AI lecturer explaining slide-by-slide in ${selectedLanguage}.
        
        **Context:**
        - Presentation info: ${generalInfo}
        ${userCustomPrompt ? `- User Preferences: ${userCustomPrompt}` : ""}
        - You will receive slide summaries, images, and canvas context.
        
        **Rules:**
        - **Language:** Speak ONLY in ${selectedLanguage}.
        - **Style:** Be concise and direct. 1-2 sentence explanations per point. Avoid meta-commentary (e.g., "in this slide", "let's look at").
        - **Navigation:** You CANNOT change slides. To move, ask the user to use UI controls (buttons or thumbnails).
        - **Workflow:** Explain the active slide using the provided image, summary, and canvas. When finished, ask the user to proceed.
        - **Active Slide:** When you see \`ACTIVE SLIDE: N\`, immediately switch focus to slide N. Wait for the image/summary before explaining.
        - **Canvas:** Use 'provideCanvasMarkdown' proactively for math ($ $), diagrams (\`\`\`mermaid), or complex data. After calling it, tell the user to check the canvas.
        - **Interaction:** Answer questions concisely using slide context. If a question is about another slide, teaser it and ask the user to navigate there.`,
    },
  };
};
