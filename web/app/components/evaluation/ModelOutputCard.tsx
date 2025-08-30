"use client";

import React from "react";
import SimpleMarkdownRenderer from "@/app/components/SimpleMarkdownRenderer";

interface ModelOutputCardProps {
  modelId: string;
  output?: string;
  index: number;
  isLoading: boolean;
  className?: string;
}

export default function ModelOutputCard({
  modelId,
  output,
  index,
  isLoading,
  className = "",
}: ModelOutputCardProps) {
  const hasOutput = output && output.trim().length > 0;

  return (
    <div
      className={`border border-gray-200 rounded-lg overflow-hidden h-fit ${className}`}
    >
      {/* Model Header */}
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
        <div className="flex flex-col space-y-1">
          <h4 className="text-base font-bold text-gray-900 truncate">
            Response {index + 1}
            {/* <span className="text-xs text-gray-400 font-normal">
              {!isLoading && ` (Internal test: ${modelId})`}
            </span> */}
          </h4>
        </div>
      </div>

      {/* Model Output Content or Loading */}
      <div className="p-6 space-y-4">
        {isLoading || !hasOutput ? (
          // Loading state for content
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-6 h-6 border-2 border-transparent border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-slate-600">
                {isLoading ? "Preparing response..." : "Preparing response..."}
              </p>
            </div>
          </div>
        ) : (
          // Actual content
          <div className="text-sm leading-relaxed overflow-y-auto">
            <SimpleMarkdownRenderer
              content={output}
              enableGfm={true}
              className="text-sm"
            />
          </div>
        )}
      </div>
    </div>
  );
}