'use client';

import { ModelOutput } from '@/types';
import { createPrettifiedMarkdown } from '@/utils/markdownUtils';

interface ModelOutputsGridProps {
  modelOutputs: ModelOutput[];
  className?: string;
}

// Helper function to determine grid columns based on model count
const getGridCols = (count: number) => {
  switch (count) {
    case 1: return 'grid-cols-1';
    case 2: return 'grid-cols-1 md:grid-cols-2';
    case 3: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    case 4: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
    default: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  }
};

export default function ModelOutputsGrid({ 
  modelOutputs,
  className = ""
}: ModelOutputsGridProps) {
  if (!modelOutputs || modelOutputs.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        No model outputs available yet. Please try running the evaluation again.
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900">Possible Responses</h3>
      <div className={`grid ${getGridCols(modelOutputs.length)} gap-4`}>
        {modelOutputs.map((output, index) => (
          <div key={index} className="border border-gray-200 rounded-lg overflow-hidden h-fit">
            {/* Model Header */}
            <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
              <div className="flex flex-col space-y-1">
                <h4 className="text-sm font-bold text-gray-900 truncate">
                  Response {index + 1} 
                  <span className="text-xs text-gray-400 font-normal">
                    (For internal testing only: {output.modelId})
                  </span>
                </h4>
              </div>
            </div>
            
            {/* Model Output Content - Enhanced with Prettified Markdown */}
            <div className="p-6 space-y-4">
              <div 
                className="text-sm leading-relaxed overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: createPrettifiedMarkdown(output.output) }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}