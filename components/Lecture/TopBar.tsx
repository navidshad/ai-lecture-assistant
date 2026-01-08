import React from "react";
import { formatCost } from "../../utils/costCalculator";

const TopBar: React.FC<{ 
  fileName: string; 
  currentSlide: number; 
  totalSlides: number; 
  estimatedCost?: number;
}> = ({ fileName, currentSlide, totalSlides, estimatedCost }) => {
  return (
    <header className="flex-shrink-0 bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-4 flex items-center justify-between z-20">
      <div className="flex flex-col min-w-0 pr-4">
        <h1 className="text-xl font-bold truncate" title={fileName}>{fileName}</h1>
        {typeof estimatedCost === 'number' && (
          <div className="text-xs text-blue-400 font-medium">
            Cost: {formatCost(estimatedCost)}
          </div>
        )}
      </div>
      <div className="text-sm text-gray-400 flex-shrink-0">
        Slide {currentSlide} of {totalSlides}
      </div>
    </header>
  );
};

export default TopBar;


