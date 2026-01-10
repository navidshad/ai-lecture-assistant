export interface ParsedSlide {
  pageNumber: number;
  imageDataUrl: string;
  textContent: string;
  hasImages: boolean;
}

export interface Slide extends ParsedSlide {
  summary: string;
  canvasContent?: CanvasBlock[];
  isImportant?: boolean;
}

export interface ImageOptimizationSettings {
  maxDimension: number; // e.g., 768, 512, 256
  grayscale: boolean;
}

export interface LectureConfig {
  language: string;
  voice: string;
  model: string;
  prompt?: string;
  imageOptimization?: ImageOptimizationSettings;
  forceTextOnly?: boolean;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface UsageReport {
  modelId: string;
  usage: TokenUsage;
  timestamp: number;
  callType?: string; // e.g., 'plan_gen', 'live_session', 'markdown_fix'
  tag?: 'grouping' | 'lecture_plan' | 'slide_conversation' | string;
}

export interface LectureSession {
  id: string;
  fileName: string;
  createdAt: number;
  slides: Slide[];
  generalInfo: string;
  transcript: TranscriptEntry[];
  currentSlideIndex: number;
  lectureConfig: LectureConfig;
  slideGroups?: SlideGroup[];
  usageReports: UsageReport[];
}

export enum LectureSessionState {
  IDLE = "IDLE",
  CONNECTING = "CONNECTING",
  READY = "READY",
  LECTURING = "LECTURING",
  LISTENING = "LISTENING",
  ENDED = "ENDED",
  ERROR = "ERROR",
  DISCONNECTED = "DISCONNECTED",
}

export interface ChatAttachment {
  id: string;
  type: 'image' | 'file' | 'selection'; // 'selection' for cropped slide/canvas pieces
  data: string; // base64 data URL or file content
  mimeType: string; // e.g., 'image/png'
  fileName?: string; // for file uploads
}

export interface TranscriptEntry {
  speaker: "user" | "ai";
  text: string;
  slideNumber?: number;
  attachments?: ChatAttachment[];
  estimatedCost?: number;
  audioBase64?: string;
}

export type CanvasBlockType = "markdown" | "diagram" | "ascii" | "table";

export interface CanvasBlock {
  type: CanvasBlockType;
  content: string;
}

export interface SlideGroup {
  title: string;
  slideNumbers: number[];
}
