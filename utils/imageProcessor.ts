import { ImageOptimizationSettings } from "../types";

/**
 * Processes a base64 image data URL according to optimization settings.
 * Resizes the image and optionally converts it to grayscale.
 */
export const processImage = async (
  dataUrl: string,
  settings: ImageOptimizationSettings
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions maintaining aspect ratio
      if (width > settings.maxDimension || height > settings.maxDimension) {
        if (width > height) {
          height = Math.round((height * settings.maxDimension) / width);
          width = settings.maxDimension;
        } else {
          width = Math.round((width * settings.maxDimension) / height);
          height = settings.maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      if (settings.grayscale) {
        ctx.filter = "grayscale(100%)";
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Return as JPEG for better compression if needed, or PNG
      // Gemini Live supports both, but we'll stick to image/png as per current usage
      // to avoid breaking mime-type expectations.
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = (e) => reject(e);
    img.src = dataUrl;
  });
};
