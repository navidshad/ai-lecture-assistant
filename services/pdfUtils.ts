import { ParsedSlide } from '../types';

// This is to inform TypeScript that pdfjsLib is available globally from the script tag in index.html
declare const pdfjsLib: any;

export interface ParseOptions {
  maxDimension?: number;
  grayscale?: boolean;
}

export const parsePdf = async (file: File, options: ParseOptions = {}): Promise<ParsedSlide[]> => {
  const fileReader = new FileReader();
  const { maxDimension = 1600, grayscale = false } = options;

  return new Promise((resolve, reject) => {
    fileReader.onload = async (event) => {
      if (!event.target?.result) {
        return reject(new Error("Failed to read file"));
      }

      const typedarray = new Uint8Array(event.target.result as ArrayBuffer);

      try {
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        const slides: ParsedSlide[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          let imageDataUrl = "";
          let hasImages = false;

          // Adaptive scaling to improve small-text readability while bounding image size
          const baseViewport = page.getViewport({ scale: 1.0 });
          const IMAGE_MAX_SIDE_PX = maxDimension;
          const longestSide = Math.max(baseViewport.width, baseViewport.height);
          const scale = Math.min(3, Math.max(1.5, IMAGE_MAX_SIDE_PX / longestSide));
          const viewport = page.getViewport({ scale });

          // Create canvas to render page
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (context) {
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            if (grayscale) {
              context.filter = 'grayscale(100%)';
            }

            try {
              await page.render({ canvasContext: context, viewport }).promise;
              // Use JPEG with 0.8 quality to significantly reduce base64 size (approx 5-10x smaller than PNG)
              imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            } catch (renderErr) {
              console.warn("Failed to render page", i, renderErr);
            }
          }

          // Detect if page has images
          try {
            const operatorList = await page.getOperatorList();
            if (pdfjsLib.OPS) {
              const imageOps = [
                pdfjsLib.OPS.paintImageXObject,
                pdfjsLib.OPS.paintInlineImageXObject,
                pdfjsLib.OPS.paintImageMaskXObject
              ].filter(id => id !== undefined);

              hasImages = operatorList.fnArray.some((fn: number) => imageOps.includes(fn));
            } else {
              hasImages = true; // Fallback
            }
          } catch (opErr) {
            console.warn("Failed to get operator list for page", i, opErr);
            hasImages = true; // Fallback
          }

          // Extract text content - always do this
          const textContentItems = await page.getTextContent();
          const textContent = textContentItems.items.map((item: any) => item.str).join(' ');

          console.log(`Parsed page ${i}: hasImages=${hasImages}, textLength=${textContent.length}`);

          slides.push({
            pageNumber: i,
            imageDataUrl,
            textContent,
            hasImages,
          });
        }
        resolve(slides);
      } catch (error) {
        console.error("Error parsing PDF:", error);
        reject(error);
      }
    };

    fileReader.onerror = (error) => {
      reject(error);
    };

    fileReader.readAsArrayBuffer(file);
  });
};
