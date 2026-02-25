import { GoogleGenAI } from "@google/genai";
import { MODEL_CONFIGS } from "../constants/modelCosts.static";
import { TokenUsage } from "../types";

export function getGenAI(apiKey: string | null) {
  return new GoogleGenAI({ apiKey: apiKey ?? (process.env.API_KEY as string) });
}

// Standard type for response handling

export async function fixMarkdownContent(
  markdown: string,
  apiKey: string | null
): Promise<{ content: string; usage: TokenUsage }> {
  const genAI = getGenAI(apiKey);

  const prompt = `You are a Markdown fixer. Fix the following Markdown content. Return ONLY the corrected Markdown (no explanations, no wrapping backticks).

Requirements:
- Fix unbalanced code fences (ensure all \`\`\` are properly closed)
- Ensure Mermaid diagrams are properly fenced as \`\`\`mermaid ... \`\`\`
- Preserve KaTeX math: $...$ for inline, $$...$$ for block math
- Remove or escape unsafe HTML
- Keep all content and semantics intact
- Preserve emojis, links, images, tables

Input Markdown:
${markdown}`;

  try {
    const result = await (genAI.models.generateContent as any)({
      model: MODEL_CONFIGS.MARKDOWN_FIXER,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0 },
    });

    const text = result.text;
    const usage = result.usageMetadata;

    // Remove any wrapping backticks or markdown code fences if present
    const cleaned = text
      .replace(/^```(?:markdown)?\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();

    return {
      content: cleaned,
      usage: {
        promptTokens: usage?.promptTokenCount ?? 0,
        completionTokens: usage?.candidatesTokenCount ?? 0,
        totalTokens: usage?.totalTokenCount ?? 0,
      },
    };
  } catch (error) {
    console.error("Error fixing markdown:", error);
    throw new Error(
      `Failed to fix markdown: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
