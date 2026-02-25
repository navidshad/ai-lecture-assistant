import React from 'react';
import { ImageOptimizationSettings } from '../../types';
import { ImageIcon, Zap } from 'lucide-react';
import Tooltip from '../Tooltip';

interface OptimizationSettingsProps {
  settings: ImageOptimizationSettings;
  onChange: (settings: ImageOptimizationSettings) => void;
}

const OptimizationSettings: React.FC<OptimizationSettingsProps> = ({ settings, onChange }) => {
  const resolutions = [
    { label: '256px', value: 256, tooltip: 'Maximum dimension of 256px. Best for saving tokens, lower image detail.' },
    { label: '512px', value: 512, tooltip: 'Maximum dimension of 512px. Balanced quality and token consumption.' },
    { label: '768px', value: 768, tooltip: 'Maximum dimension of 768px. Better detail, higher token consumption.' },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-900/50 rounded-xl border border-gray-700/50">
      <div className="flex items-center gap-2 pb-2 border-b border-gray-800">
        <Zap className="w-4 h-4 text-yellow-500" />
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Image Optimization</span>
      </div>
      
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-gray-500 uppercase tracking-tighter flex items-center gap-1.5">
            <ImageIcon className="w-3 h-3" />
            Resolution Limits
          </span>
        </div>
        <div className="flex gap-2">
          {resolutions.map((res) => (
            <Tooltip key={res.value} content={res.tooltip}>
              <button
                onClick={() => onChange({ ...settings, maxDimension: res.value })}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all font-medium border ${
                  settings.maxDimension === res.value
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/20'
                    : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:border-gray-600'
                }`}
              >
                {res.label}
              </button>
            </Tooltip>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2 border-t border-gray-800/50">
        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-tighter">
          Color Processing
        </span>
        <Tooltip content="Convert images to grayscale. Reduces visual data complexity and can lower token usage in some scenarios.">
          <button
            onClick={() => onChange({ ...settings, grayscale: !settings.grayscale })}
            className={`w-full px-4 py-2 text-xs rounded-lg transition-all flex items-center justify-between font-medium border ${
              settings.grayscale
                ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/20'
                : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${settings.grayscale ? 'bg-white animate-pulse' : 'bg-gray-600'}`} />
              BW Mode (Grayscale)
            </div>
            {settings.grayscale && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded uppercase">Active</span>}
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default OptimizationSettings;
