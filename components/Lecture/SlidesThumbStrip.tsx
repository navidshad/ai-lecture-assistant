import React from "react";
import { Slide } from "../../types";
import { Star } from "lucide-react";

interface SlidesThumbStripProps {
  slides: Slide[];
  currentIndex: number;
  onSelect: (index: number) => void;
  itemClassName?: string;
  imageClassName?: string;
  onHover?: (index: number | null) => void;
}

const WINDOW_SIZE = 30;

const SlidesThumbStrip: React.FC<SlidesThumbStripProps> = ({
  slides,
  currentIndex,
  onSelect,
  itemClassName,
  imageClassName,
  onHover,
}) => {
  const startIndex = Math.max(0, currentIndex - WINDOW_SIZE);
  const endIndex = Math.min(slides.length - 1, currentIndex + WINDOW_SIZE);

  const visibleSlides = slides.slice(startIndex, endIndex + 1);

  return (
    <>
      {startIndex > 0 && (
        <div className="flex-shrink-0 flex items-center justify-center w-12 h-20 text-gray-500 font-mono text-xs">
          ...{startIndex}
        </div>
      )}
      {visibleSlides.map((slide, i) => {
        const absoluteIndex = startIndex + i;
        return (
          <div
            key={slide.pageNumber}
            onClick={absoluteIndex === currentIndex ? undefined : () => onSelect(absoluteIndex)}
            onMouseEnter={() => onHover && onHover(absoluteIndex === currentIndex ? null : absoluteIndex)}
            onMouseLeave={() => onHover && onHover(null)}
            className={`${absoluteIndex === currentIndex ? 'cursor-default' : 'cursor-pointer'} border-2 transition-all rounded-md overflow-hidden relative ${
              absoluteIndex === currentIndex
                ? 'border-blue-500 ring-2 ring-blue-400/60 shadow-xl shadow-blue-500/30 bg-blue-500/5'
                : 'border-transparent hover:border-gray-500'
            } ${itemClassName || ''}`}
          >
            <img
              src={slide.imageDataUrl}
              alt={`Slide ${slide.pageNumber}`}
              className={imageClassName || 'w-full h-auto'}
              loading="lazy"
            />
            <div className="absolute top-1 left-1">
              <span className="px-1.5 py-0.5 text-[10px] leading-none rounded bg-gray-900/80 text-gray-100">
                {slide.pageNumber}
              </span>
            </div>
            {slide.isImportant && (
              <div className="absolute top-1 right-1">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-yellow-500/90 text-gray-900">
                  <Star className="w-3 h-3" />
                </span>
              </div>
            )}
          </div>
        );
      })}
      {endIndex < slides.length - 1 && (
        <div className="flex-shrink-0 flex items-center justify-center w-12 h-20 text-gray-500 font-mono text-xs">
          {slides.length - 1 - endIndex}...
        </div>
      )}
    </>
  );
};

export default SlidesThumbStrip;


