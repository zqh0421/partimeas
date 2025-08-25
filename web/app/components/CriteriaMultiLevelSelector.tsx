"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import GenericMultiLevelSelector, {
  SelectionPath,
  SelectorConfig,
} from "./GenericMultiLevelSelector";
import {
  CriterionVersion,
  CriteriaRequirement,
} from "@/app/utils/criteriaReader";
import { useCriteriaData } from "@/app/hooks/useCriteriaData";
import {
  saveSelections,
  restoreSelections,
  clearSelectionCache,
} from "@/app/utils/selectionCache";
import {
  criteriaToDynamicTree,
  extractSelectedItems,
} from "@/app/utils/treeDataConverter";

// Criteria item type for selected sheets/criterion versions
interface CriteriaItem {
  id: string;
  sheetName: string;
  criterionName: string;
  criterionDescription: string;
  requirements: CriteriaRequirement[];
}

interface CriteriaMultiLevelSelectorProps {
  onSelectionChange: (selections: SelectionPath[]) => void;
  onDataLoaded: (requirements: CriteriaItem[]) => void;
  onError: (error: string) => void;
  config?: SelectorConfig;
}

export default function CriteriaMultiLevelSelector({
  onSelectionChange,
  onDataLoaded,
  onError,
  config,
}: CriteriaMultiLevelSelectorProps) {
  const [selectedPaths, setSelectedPaths] = useState<SelectionPath[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const restoredRef = useRef(false);
  const { criteria, isLoading, error, refetch } = useCriteriaData();

  // Convert criteria data to tree structure
  const treeData = useCallback(() => {
    return criteriaToDynamicTree(criteria);
  }, [criteria]);

  // Handle error from criteria loading
  useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error, onError]);

  // Update last update time when criteria loads
  useEffect(() => {
    if (criteria.length > 0) {
      setLastUpdateTime(new Date());
    }
  }, [criteria]);

  // Restore cached selection state
  useEffect(() => {
    if (criteria.length > 0 && !restoredRef.current) {
      console.log("[CriteriaMultiLevelSelector] Attempting to restore cached selection...");
      const restored = restoreSelections();
      const cachedCriteriaVersionId = restored?.selectedCriteriaVersionId;
      console.log("[CriteriaMultiLevelSelector] Cached ID:", cachedCriteriaVersionId);
      
      if (cachedCriteriaVersionId) {
        // Find the cached selection in the tree data
        const treeStructure = criteriaToDynamicTree(criteria);
        console.log("[CriteriaMultiLevelSelector] Tree structure:", treeStructure);
        
        const findNodeById = (nodes: any[], id: string): any => {
          for (const node of nodes) {
            if (node.id === id) return node;
            if (node.children) {
              const found = findNodeById(node.children, id);
              if (found) return found;
            }
          }
          return null;
        };
        
        const cachedNode = findNodeById(treeStructure, cachedCriteriaVersionId);
        console.log("[CriteriaMultiLevelSelector] Found cached node:", cachedNode);
        
        if (cachedNode) {
          const restoredPath: SelectionPath = {
            node: cachedNode,
            path: [cachedNode.id],
          };
          console.log("[CriteriaMultiLevelSelector] Setting selectedPaths to:", [restoredPath]);
          setSelectedPaths([restoredPath]);
          
          // Use setTimeout to ensure the state update has been processed
          setTimeout(() => {
            onSelectionChange([restoredPath]);
            
            // Also trigger the data loaded callback with the restored selection
            const selectedItems = extractSelectedItems<CriteriaItem | null>(
              [restoredPath],
              (node) => {
                const metadata = node.metadata;
                if (metadata?.type === "criterion" && metadata.version) {
                  const version = metadata.version as CriterionVersion;
                  return {
                    id: node.id,
                    sheetName: version.sheetName,
                    criterionName: version.criterionName,
                    criterionDescription: version.criterionDescription,
                    requirements: [],
                  };
                }
                return null;
              }
            ).filter((item): item is CriteriaItem => item !== null);

            onDataLoaded(selectedItems);
          }, 0);
          
          console.log("[CriteriaMultiLevelSelector] Restored cached selection:", cachedCriteriaVersionId);
        } else {
          console.log("[CriteriaMultiLevelSelector] Cached node not found, clearing cache");
        }
      } else {
        console.log("[CriteriaMultiLevelSelector] No cached selection found");
      }
      
      restoredRef.current = true;
    }
  }, [criteria.length, onSelectionChange, onDataLoaded]);

  // Handle selection changes
  const handleSelectionChange = useCallback(
    (newSelections: SelectionPath[]) => {
      setSelectedPaths(newSelections);
      onSelectionChange(newSelections);

      // Save the selected criteria version to cache
      if (newSelections.length > 0) {
        const selectedNode = newSelections[0].node;
        console.log("[CriteriaMultiLevelSelector] Saving selection to cache:", selectedNode.id, selectedNode);
        
        // Get existing cache to preserve other selections
        const existing = restoreSelections();
        saveSelections(
          existing?.selections || [],
          existing?.expandedUseCases || [],
          selectedNode.id // selectedCriteriaVersionId
        );
        
        // Verify it was saved
        const verified = restoreSelections();
        console.log("[CriteriaMultiLevelSelector] Verification - cached ID:", verified?.selectedCriteriaVersionId);
      } else {
        // Clear cache if no selection
        console.log("[CriteriaMultiLevelSelector] Clearing cache");
        clearSelectionCache();
      }

      // Extract criteria items from selections (sheet-level only, no requirements data)
      const selectedItems = extractSelectedItems<CriteriaItem | null>(
        newSelections,
        (node) => {
          const metadata = node.metadata;
          if (metadata?.type === "criterion" && metadata.version) {
            const version = metadata.version as CriterionVersion;
            return {
              id: node.id,
              sheetName: version.sheetName,
              criterionName: version.criterionName,
              criterionDescription: version.criterionDescription,
              requirements: [], // Don't pass requirements data for sheet-level selections
            };
          }
          return null;
        }
      ).filter((item): item is CriteriaItem => item !== null);

      onDataLoaded(selectedItems);
    },
    [onSelectionChange, onDataLoaded]
  );

  // Handle data loaded callback
  const handleDataLoaded = useCallback(() => {
    // This will be handled by handleSelectionChange
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setSelectedPaths([]);
    refetch();
    console.log("[CriteriaMultiLevelSelector] Refreshed criteria data");
  }, [refetch]);

  const data = treeData();

  return (
    <GenericMultiLevelSelector
      data={data}
      selectedPaths={selectedPaths}
      onSelectionChange={handleSelectionChange}
      onDataLoaded={handleDataLoaded}
      onError={onError}
      onRefresh={handleRefresh}
      isLoading={isLoading}
      isRefreshing={false}
      lastUpdateTime={lastUpdateTime}
      config={{
        allowNonLeafSelection: true,
        // Show descriptions/counts per request
        showCounts: true,
        pathSeparator: " › ",
        // No nested levels to expand in flat mode
        defaultExpandLevels: 1,
        singleSelect: true,
        selectionSummary: (selections) =>
          selections.length === 0
            ? "Select criterion to proceed..."
            : `Selected criterion to refine: ${selections[0].node.name}`,
        ...config,
      }}
      title="Criterion Selection"
      emptyMessage="No criterion found."
      loadingMessage="Loading criteria..."
    />
  );
}

export type { CriteriaItem };
