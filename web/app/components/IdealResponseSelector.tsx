"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronDownIcon, CheckIcon } from "@/app/components/icons";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { IdealModelResponse } from "@/app/types";

export interface IdealResponseSelectorProps {
  selectedIdealResponseId?: string;
  onSelectionChange: (idealResponseId: string) => void;
  onDataLoaded: (idealResponses: IdealModelResponse[]) => void;
  onError: (error: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  isRefreshing?: boolean;
  lastUpdateTime?: Date | null;
}

export default function IdealResponseSelector({
  selectedIdealResponseId,
  onSelectionChange,
  onDataLoaded,
  onError,
  onRefresh,
  isLoading = false,
  isRefreshing = false,
  lastUpdateTime,
}: IdealResponseSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [idealResponses, setIdealResponses] = useState<IdealModelResponse[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch ideal responses from API
  const fetchIdealResponses = useCallback(async () => {
    try {
      setInternalLoading(true);
      console.log("[IdealResponseSelector] Fetching ideal responses...");

      const response = await fetch("/api/ideal-responses");
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("[IdealResponseSelector] API Response:", data);

      if (!data.success) {
        throw new Error(data.error || "API returned unsuccessful response");
      }

      const responses = data.idealResponses || [];
      setIdealResponses(responses);
      onDataLoaded(responses);
      
      console.log(`[IdealResponseSelector] Loaded ${responses.length} ideal responses`);
    } catch (error) {
      console.error("[IdealResponseSelector] Error fetching ideal responses:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      onError(`Failed to load ideal responses: ${errorMessage}`);
    } finally {
      setInternalLoading(false);
    }
  }, [onDataLoaded, onError]);

  // Fetch data on component mount
  useEffect(() => {
    fetchIdealResponses();
  }, [fetchIdealResponses]);

  // Handle selection
  const handleSelect = (idealResponseId: string) => {
    console.log("[IdealResponseSelector] Selected:", idealResponseId);
    onSelectionChange(idealResponseId);
    setIsOpen(false);
  };

  // Handle refresh
  const handleRefresh = () => {
    console.log("[IdealResponseSelector] Refresh requested");
    if (onRefresh) {
      onRefresh();
    } else {
      fetchIdealResponses();
    }
  };

  // Find selected ideal response
  const selectedIdealResponse = idealResponses.find(response => response.id === selectedIdealResponseId);

  const isLoadingState = isLoading || internalLoading || isRefreshing;

  // Display text for the selector
  const displayText = selectedIdealResponse
    ? selectedIdealResponse.name
    : "Select an ideal response...";

  const displaySubText = selectedIdealResponse
    ? `${selectedIdealResponse.modelResponse.slice(0, 100)}${selectedIdealResponse.modelResponse.length > 100 ? "..." : ""}`
    : `${idealResponses.length} ideal responses available`;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Ideal Model Response</h3>
          <p className="text-sm text-gray-500">Choose an ideal response for comparison</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoadingState}
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
        >
          <ArrowPathIcon className={`w-4 h-4 ${isLoadingState ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => !isLoadingState && setIsOpen(!isOpen)}
          disabled={isLoadingState}
          className={`w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-left hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
            isLoadingState ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="font-medium text-gray-900">
                {isLoadingState ? "Loading..." : displayText}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {isLoadingState ? "Please wait..." : displaySubText}
              </div>
            </div>
            <ChevronDownIcon
              className={`w-5 h-5 text-gray-400 transition-transform ${
                isOpen ? "transform rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {isOpen && !isLoadingState && (
          <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
            {idealResponses.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500">
                No ideal responses found.
              </div>
            ) : (
              <div className="py-2">
                {idealResponses.map((response) => (
                  <button
                    key={response.id}
                    onClick={() => handleSelect(response.id)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                      selectedIdealResponseId === response.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 flex items-center">
                          {response.name}
                          {selectedIdealResponseId === response.id && (
                            <CheckIcon className="w-4 h-4 text-blue-600 ml-2 flex-shrink-0" />
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {response.modelResponse}
                        </div>
                        {response.testCaseInput && (
                          <div className="text-xs text-gray-400 mt-1">
                            <strong>Test Input:</strong> {response.testCaseInput.slice(0, 60)}
                            {response.testCaseInput.length > 60 ? "..." : ""}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {lastUpdateTime && (
        <div className="text-xs text-gray-400 mt-2">
          Last updated: {lastUpdateTime.toLocaleString()}
        </div>
      )}
    </div>
  );
}