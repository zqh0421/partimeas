"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { IdealModelResponse } from "@/app/types";
import GenericMultiLevelSelector, {
  TreeNode,
  SelectionPath,
} from "./GenericMultiLevelSelector";
import {
  saveIndependentIdealResponseSelection,
  restoreIndependentIdealResponseSelection,
  clearIndependentCache,
} from "@/app/utils/selectionCache";

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
  const [idealResponses, setIdealResponses] = useState<IdealModelResponse[]>(
    []
  );
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalLastUpdateTime, setInternalLastUpdateTime] =
    useState<Date | null>(null);
  const [cachedSelectionId, setCachedSelectionId] = useState<string | null>(
    null
  );
  const restoredRef = useRef(false);

  // Fetch ideal responses from API
  const fetchIdealResponses = useCallback(async () => {
    try {
      setInternalLoading(true);
      console.log("[IdealResponseSelector] Fetching ideal responses...");

      const response = await fetch("/api/ideal-responses");

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("[IdealResponseSelector] API Response:", data);

      if (!data.success) {
        throw new Error(data.error || "API returned unsuccessful response");
      }

      const responses = data.idealResponses || [];
      setIdealResponses(responses);
      setInternalLastUpdateTime(new Date());
      onDataLoaded(responses);

      console.log(
        `[IdealResponseSelector] Loaded ${responses.length} ideal responses`
      );
    } catch (error) {
      console.error(
        "[IdealResponseSelector] Error fetching ideal responses:",
        error
      );
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      onError(`Failed to load ideal responses: ${errorMessage}`);
    } finally {
      setInternalLoading(false);
    }
  }, [onDataLoaded, onError]);

  // Fetch data on component mount
  useEffect(() => {
    fetchIdealResponses();
  }, [fetchIdealResponses]);

  // Restore cached selection when ideal responses are loaded
  useEffect(() => {
    if (idealResponses.length > 0 && !restoredRef.current) {
      console.log(
        "[IdealResponseSelector] Attempting to restore cached selection..."
      );

      const cachedId = restoreIndependentIdealResponseSelection();
      console.log(
        "[IdealResponseSelector] Cached ideal response ID:",
        cachedId
      );

      if (cachedId) {
        // Check if the cached selection exists in the loaded data
        const existingResponse = idealResponses.find(
          (response) => response.name === cachedId
        );
        if (existingResponse) {
          console.log(
            "[IdealResponseSelector] Found cached selection in loaded data:",
            existingResponse.name
          );
          setCachedSelectionId(cachedId);

          // Use setTimeout to ensure the state update has been processed
          setTimeout(() => {
            onSelectionChange(cachedId);
          }, 0);
        } else {
          console.log(
            "[IdealResponseSelector] Cached selection not found in data, clearing cache"
          );
          clearIndependentCache("idealResponse");
        }
      } else {
        console.log("[IdealResponseSelector] No cached selection found");
      }

      restoredRef.current = true;
    }
  }, [idealResponses, onSelectionChange]);

  // Handle refresh
  const handleRefresh = () => {
    console.log("[IdealResponseSelector] Refresh requested");
    setCachedSelectionId(null);
    restoredRef.current = false;
    if (onRefresh) {
      onRefresh();
    } else {
      fetchIdealResponses();
    }
  };

  const isLoadingState = isLoading || internalLoading || isRefreshing;

  // Convert IdealModelResponse[] to TreeNode[]
  const treeData: TreeNode[] = idealResponses.map((response) => ({
    id: response.id,
    name: response.name,
    description: `${response.modelResponse.slice(0, 200)}${
      response.modelResponse.length > 200 ? "..." : ""
    }`,
    displayInfo: response.testCaseInput
      ? `Input: ${response.testCaseInput.slice(0, 50)}${
          response.testCaseInput.length > 50 ? "..." : ""
        }`
      : undefined,
    isSelectable: true,
    metadata: response,
  }));

  // Convert selectedIdealResponseId to SelectionPath[], prioritizing cached selection
  const effectiveSelectedId = cachedSelectionId || selectedIdealResponseId;
  const selectedPaths: SelectionPath[] = effectiveSelectedId
    ? idealResponses
        .filter((response) => response.name === effectiveSelectedId)
        .map((response) => ({
          path: [response.id],
          node: {
            id: response.id,
            name: response.name,
            description: response.modelResponse,
            displayInfo: response.testCaseInput
              ? `Input: ${response.testCaseInput.slice(0, 50)}${
                  response.testCaseInput.length > 50 ? "..." : ""
                }`
              : undefined,
            isSelectable: true,
            metadata: response,
          },
        }))
    : [];

  // Handle selection changes from GenericMultiLevelSelector
  const handleSelectionChange = (selections: SelectionPath[]) => {
    if (selections.length > 0) {
      const selectedResponse = selections[0].node
        .metadata as IdealModelResponse;
      console.log("[IdealResponseSelector] Selected:", selectedResponse.name);

      // Save to independent cache
      saveIndependentIdealResponseSelection(selectedResponse.name);
      setCachedSelectionId(selectedResponse.name);

      // Verify it was saved
      const verified = restoreIndependentIdealResponseSelection();
      console.log(
        "[IdealResponseSelector] Verification - saved to independent cache:",
        {
          savedId: verified,
          requestedId: selectedResponse.name,
          success: verified === selectedResponse.name,
        }
      );

      onSelectionChange(selectedResponse.name);
    } else {
      console.log("[IdealResponseSelector] Clearing selection");
      clearIndependentCache("idealResponse");
      setCachedSelectionId(null);
      onSelectionChange("");
    }
  };

  // Handle data loaded from GenericMultiLevelSelector
  const handleDataLoaded = (_items: TreeNode[]) => {
    // Don't call onDataLoaded here as it's already called in fetchIdealResponses
    // The _items parameter represents the TreeNode[] but we already have the raw data
  };

  return (
    <GenericMultiLevelSelector<IdealModelResponse>
      data={treeData}
      selectedPaths={selectedPaths}
      onSelectionChange={handleSelectionChange}
      onDataLoaded={handleDataLoaded}
      onError={onError}
      onRefresh={handleRefresh}
      isLoading={isLoadingState}
      isRefreshing={isRefreshing}
      lastUpdateTime={lastUpdateTime || internalLastUpdateTime}
      title="Ideal Model Response Selection"
      emptyMessage="No ideal responses found."
      loadingMessage="Loading ideal responses..."
      config={{
        singleSelect: true,
        allowNonLeafSelection: true,
        showCounts: false,
        selectionSummary: (selections) => {
          if (selections.length === 0) return "Select an ideal response...";
          const selected = selections[0].node.metadata as IdealModelResponse;
          return `Selected ideal model response to compare: <${selected.name}>`;
        },
      }}
    />
  );
}
