export function generateSessionId(fileName: string | string[]): string {
  const timestamp = Date.now();
  const nameToProcess = Array.isArray(fileName) ? fileName.join("-") : fileName;
  // Normalize filename for id safety
  const safeName = nameToProcess
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .substring(0, 50); // Cap it
  return `${safeName}-${timestamp}`;
}
