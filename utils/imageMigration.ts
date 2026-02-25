import { Slide } from "../types";

/**
 * Optimizes a list of slides by converting PNG data URLs to JPEG.
 * This is a "lazy migration" helper to reduce session size for older sessions.
 */
export async function optimizeSlides(slides: Slide[]): Promise<{ updatedSlides: Slide[], wasModified: boolean }> {
	let wasModified = false;

	const updatedSlides = await Promise.all(slides.map(async (slide) => {
		// Only optimize if it's a PNG image
		if (slide.imageDataUrl.startsWith('data:image/png')) {
			try {
				const optimizedUrl = await convertPngToJpeg(slide.imageDataUrl);
				wasModified = true;
				return { ...slide, imageDataUrl: optimizedUrl };
			} catch (err) {
				console.warn(`Failed to optimize slide ${slide.pageNumber}`, err);
				return slide;
			}
		}
		return slide;
	}));

	return { updatedSlides, wasModified };
}

/**
 * Helper to convert a PNG Data URL to JPEG using a temporary canvas
 */
function convertPngToJpeg(dataUrl: string, quality = 0.8): Promise<string> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			const canvas = document.createElement('canvas');
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext('2d');
			if (!ctx) {
				reject(new Error("Could not get canvas context"));
				return;
			}
			ctx.drawImage(img, 0, 0);
			const jpegUrl = canvas.toDataURL('image/jpeg', quality);
			resolve(jpegUrl);
		};
		img.onerror = () => reject(new Error("Failed to load image for conversion"));
		img.src = dataUrl;
	});
}
