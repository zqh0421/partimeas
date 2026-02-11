"use client";

import SimpleMarkdownRenderer from "@/components/workshop-assistant/model-output/SimpleMarkdownRenderer";

type DisplayModel = {
  modelId: string;
  output: string;
  index: number;
  isStreaming?: boolean;
  isPlaceholder?: boolean;
};

type StreamingError = {
  modelId: string;
  error: string;
  timestamp: string;
};

const getGridCols = (count: number) => {
  switch (count) {
    case 1:
      return "grid-cols-1";
    case 2:
      return "grid-cols-1 md:grid-cols-2";
    case 3:
      return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
    case 4:
      return "grid-cols-1 md:grid-cols-2 lg:grid-cols-4";
    default:
      return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
  }
};

interface ModelOutputCardsProps {
  displayModels: DisplayModel[];
  loadingModelList: string[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingErrors: StreamingError[];
  numOutputsToShow: number;
  totalOutputCount: number;
}

export default function ModelOutputCards({
  displayModels,
  loadingModelList,
  isLoading,
  isStreaming,
  streamingErrors,
  numOutputsToShow,
  totalOutputCount,
}: ModelOutputCardsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Possible Responses</h3>
          {totalOutputCount > numOutputsToShow && (
            <p className="text-sm text-gray-500 mt-1">
              Showing {numOutputsToShow} of {totalOutputCount} generated responses
            </p>
          )}
        </div>
      </div>

      <div className={`grid ${getGridCols(displayModels.length)} gap-4`}>
        {displayModels.map((item, index) => {
          const isLoadingModel =
            loadingModelList.includes(item.modelId) ||
            (isLoading && item.modelId.startsWith("loading-")) ||
            (isStreaming && item.isPlaceholder);
          const hasOutput = Boolean(item.output);
          const isStreamingModel = Boolean(item.isStreaming && !item.isPlaceholder);
          const streamingError = streamingErrors.find(
            (error) => error.modelId === item.modelId,
          );

          return (
            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden h-fit">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex justify-between">
                <h4 className="text-base font-bold text-gray-900 truncate">
                  Response {index + 1}
                </h4>
                {isStreamingModel && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs text-green-600 font-medium">Live response</span>
                  </div>
                )}
              </div>

              <div className="p-6 space-y-4">
                {streamingError ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-red-600 text-sm">✕</span>
                      </div>
                      <p className="text-sm text-red-600 mb-2">Generation failed</p>
                      <p className="text-xs text-gray-500">{streamingError.error}</p>
                    </div>
                  </div>
                ) : isLoadingModel || (!hasOutput && !isStreamingModel) ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="w-6 h-6 border-2 border-transparent border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-sm text-slate-600">Preparing response...</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm leading-relaxed overflow-y-auto">
                    <SimpleMarkdownRenderer
                      content={item.output}
                      enableGfm={true}
                      className="text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
