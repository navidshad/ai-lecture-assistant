import React from "react";
import { formatCost } from "../../utils/costCalculator";
import { Settings as SettingsIcon } from "lucide-react";

const TopBar: React.FC<{ 
  fileName: string; 
  currentSlide: number; 
  totalSlides: number; 
  estimatedCost?: number;
  onViewReport?: () => void;
  onOpenSettings?: () => void;
  showImportantFilter?: boolean;
  currentImportantIndex?: number;
  totalImportantCount?: number;
}> = React.memo(({ 
  fileName, 
  currentSlide, 
  totalSlides, 
  estimatedCost, 
  onViewReport,
  onOpenSettings,
  showImportantFilter,
  currentImportantIndex,
  totalImportantCount,
}) => {
  return (
    <header className="flex-shrink-0 bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-4 flex items-center justify-between z-20">
      <div className="flex items-center min-w-0 pr-4">
        <div className="flex flex-col min-w-0">
          <h1 className="text-xl font-bold truncate" title={fileName}>{fileName}</h1>
          {typeof estimatedCost === 'number' && (
            <div className="text-xs text-blue-400 font-medium flex items-center gap-2">
              Cost: {formatCost(estimatedCost)}
              {onViewReport && (
                <button 
                  onClick={onViewReport}
                  className="hover:underline text-[10px] text-gray-500 hover:text-blue-300 transition-colors uppercase tracking-tight"
                >
                  (View Details)
                </button>
              )}
            </div>
          )}
        </div>
        
        {onOpenSettings && (
          <button 
            onClick={onOpenSettings}
            className="ml-6 p-2 rounded-lg bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white transition-colors flex items-center gap-2 text-xs font-medium"
            title="Settings"
          >
            <SettingsIcon className="h-4 w-4" />
            <span className="hidden md:inline">Settings</span>
          </button>
        )}
      </div>
      <div className="flex flex-col items-end text-sm text-gray-400 flex-shrink-0">
        <div>Slide {currentSlide} of {totalSlides}</div>
        {showImportantFilter && totalImportantCount !== undefined && (
          <div className="text-yellow-500 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
            Important: {currentImportantIndex || '-'} / {totalImportantCount}
          </div>
        )}
      </div>
    </header>
  );
});

export default TopBar;
