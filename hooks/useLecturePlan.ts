import { useCallback, useState } from "react";
import { ImageOptimizationSettings, LectureConfig, LectureSession, Slide, UsageReport } from "../types";
import { getGenAI } from "../services/genaiClient";
import { parseLecturePlanResponse } from "../services/lecturePlanParser";
import { generateSessionId } from "../utils/id";
import { MODEL_CONFIGS } from "../constants/modelCosts.static";
import { logger } from "../services/logger";
import { groupSlidesByAI } from "../services/slideGrouper";
import { parsePdf } from "../services/pdfUtils";

interface UseLecturePlanOptions {
  apiKey: string | null;
  selectedLanguage: string;
  selectedVoice: string;
  selectedModel: string;
  userCustomPrompt: string;
  markImportantSlides?: boolean;
  groupSlides?: boolean;
  imageOptimization?: ImageOptimizationSettings;
  forceTextOnly?: boolean;
}

interface UseLecturePlanResult {
  isLoading: boolean;
  loadingText: string;
  error: string | null;
  createSessionFromPdf: (files: File[]) => Promise<LectureSession>;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64String = result.split(",")[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};

export function useLecturePlan({
  apiKey,
  selectedLanguage,
  selectedVoice,
  selectedModel,
  userCustomPrompt,
  markImportantSlides = false,
  groupSlides = false,
  imageOptimization,
  forceTextOnly = false,
}: UseLecturePlanOptions): UseLecturePlanResult {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createSessionFromPdf = useCallback(
    async (files: File[]): Promise<LectureSession> => {
      setIsLoading(true);
      setError(null);
      const allSlides: Slide[] = [];
      const allUsageReports: UsageReport[] = [];
      const fileNames = files.map(f => f.name);

      try {
        setLoadingText(`Starting processing of ${files.length} file(s)...`);

        // Default batch size to 3 if not specified
        const batchSize = 3;
        const results: any[] = [];

        for (let i = 0; i < files.length; i += batchSize) {
          const batch = files.slice(i, i + batchSize);
          const phaseText = markImportantSlides ? "Analyzing content and extracting important slides" : "Analyzing content";
          setLoadingText(`${phaseText} for batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(files.length / batchSize)}...`);

          const batchPromises = batch.map(async (file, idx) => {
            // Internal parsing and AI generation for EACH file
            const parsedSlides = await parsePdf(file, imageOptimization);
            const ai = getGenAI(apiKey);
            const base64Pdf = await fileToBase64(file);

            const pdfPart = {
              inlineData: {
                mimeType: "application/pdf",
                data: base64Pdf,
              },
            };

            const prompt = `You are an expert instructional designer. Analyze the provided PDF and return ONLY the following lines in plain text (no markdown, no extra commentary).

${userCustomPrompt
                ? `IMPORTANT CONTEXT: The user has provided the following preferences for this lecture: "${userCustomPrompt}". When identifying important slides, prioritize content that aligns with these preferences.`
                : ""
              }

- general info: A brief overview of the entire presentation in 1–2 sentences, MAX 200 characters total.
- Slide N: The main message of slide N in exactly 1 short sentence, MAX 90 characters. Repeat for all slides.
${markImportantSlides
                ? `- If a slide is crucial to learning the lecture (mandatory for understanding and likely exam relevance${userCustomPrompt ? " based on user preferences" : ""
                }), mark the header with an asterisk after the number: "Slide N *:"`
                : ``
              }

STRICT REQUIREMENTS:
- Use exactly these labels: "general info:" and "Slide N:" (e.g., Slide 1:, Slide 2:)
- Do not add bullets, numbering beyond "Slide N:", or blank lines between items
- Do not exceed the character caps; if needed, abbreviate but keep meaning
- Do not include information not visible in the slides
- Do NOT use filler/openers such as: "in this slide", "this slide shows", "on slide N", "we will", "let’s", "here we", "the following"; write the main message directly.
${markImportantSlides
                ? `- IMPORTANT: If a slide is important (i.e., mandatory to review to learn the lecture and likely important for the exam${userCustomPrompt ? " based on user preferences" : ""
                }), put exactly one asterisk (*) after the slide number in the header (e.g., "Slide 2 *:"). Otherwise keep "Slide N:" with no asterisk.`
                : ``
              }

Format:

general info:
<1–2 sentences, ≤200 chars>

Slide 1:
<1 sentence main message, ≤90 chars>

Slide 2:
<1 sentence main message, ≤90 chars>

... continue for all slides`;

            const textPart = { text: prompt };

            const result = await (ai.models.generateContent as any)({
              model: MODEL_CONFIGS.PLAN_GENERATION,
              contents: [{ role: "user", parts: [textPart, pdfPart] }],
              generationConfig: { temperature: 0 },
            });

            const usage = result.usageMetadata;
            const initialUsageReport: UsageReport = {
              modelId: MODEL_CONFIGS.PLAN_GENERATION,
              usage: {
                promptTokens: usage?.promptTokenCount ?? 0,
                completionTokens: usage?.candidatesTokenCount ?? 0,
                totalTokens: usage?.totalTokenCount ?? 0,
              },
              timestamp: Date.now(),
              callType: "plan_gen",
              tag: "lecture_plan",
            };

            const { generalInfo, slideSummaries, importantSlides } =
              parseLecturePlanResponse(result.text);

            return {
              fileName: file.name,
              parsedSlides,
              generalInfo,
              slideSummaries,
              importantSlides,
              usageReport: initialUsageReport
            };
          });

          const batchResults = await Promise.all(batchPromises);
          results.push(...batchResults);
        }

        // Combine all results
        let globalSlideCounter = 1;
        results.forEach((res) => {
          const enhancedSlides: Slide[] = res.parsedSlides.map((parsedSlide: any) => {
            const summary = res.slideSummaries.get(parsedSlide.pageNumber);
            return {
              ...parsedSlide,
              pageNumber: globalSlideCounter++, // Global indexing
              summary: summary ?? "No summary was generated for this slide.",
              isImportant: res.importantSlides?.has(parsedSlide.pageNumber) ?? false,
              originFile: res.fileName
            };
          });
          allSlides.push(...enhancedSlides);
          allUsageReports.push(res.usageReport);
        });

        // Optional Grouping
        let finalSlideGroups = undefined;
        if (groupSlides && allSlides.length > 0) {
          setLoadingText("Grouping slides by topical sections...");
          try {
            finalSlideGroups = await groupSlidesByAI({
              slides: allSlides,
              apiKey,
              onReportUsage: (report) => allUsageReports.push(report)
            });
          } catch (e) {
            logger.warn("useLecturePlan", "Failed to group slides preprocessing", e as any);
          }
        }

        const combinedGeneralInfo = results.length > 1
          ? `Combined lecture from ${results.length} files: ${fileNames.join(", ")}. ${results.map(r => r.generalInfo).join(" ")}`.substring(0, 1000)
          : (results[0]?.generalInfo || "");

        const lectureConfig: LectureConfig = {
          language: selectedLanguage,
          voice: selectedVoice,
          model: selectedModel,
          prompt: userCustomPrompt,
          imageOptimization,
          forceTextOnly,
        };

        const newSession: LectureSession = {
          id: generateSessionId(fileNames),
          fileName: fileNames.join(" & "),
          fileNames: fileNames,
          createdAt: Date.now(),
          slides: allSlides,
          generalInfo: combinedGeneralInfo,
          transcript: [],
          currentSlideIndex: 0,
          lectureConfig,
          slideGroups: finalSlideGroups,
          usageReports: allUsageReports,
        };

        return newSession;
      } catch (err) {
        logger.error("useLecturePlan", "Failed to process PDFs", err as any);
        setError(
          "Failed to process PDFs. The AI may be busy or the files may be invalid. Please try again."
        );
        throw err;
      } finally {
        setIsLoading(false);
        setLoadingText("");
      }
    },
    [
      apiKey,
      selectedLanguage,
      selectedVoice,
      selectedModel,
      userCustomPrompt,
      markImportantSlides,
      groupSlides,
      imageOptimization,
      forceTextOnly
    ]
  );

  return { isLoading, loadingText, error, createSessionFromPdf };
}
