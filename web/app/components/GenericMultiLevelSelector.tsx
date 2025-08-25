"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CheckIcon,
} from "@/app/components/icons";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

// Dynamic tree node interface
export interface TreeNode {
  id: string;
  name: string;
  description?: string;
  metadata?: Record<string, any>;
  children?: TreeNode[];
  // Indicates if this node is selectable (leaf nodes are typically selectable)
  isSelectable?: boolean;
  // Custom display information
  displayInfo?: string;
}

// Selection path represents the full path to a selected node
export interface SelectionPath {
  // Array of node IDs from root to the selected node
  path: string[];
  // The final selected node
  node: TreeNode;
}

// Configuration for the selector behavior
export interface SelectorConfig {
  // Whether to allow selection of non-leaf nodes
  allowNonLeafSelection?: boolean;
  // Whether to show counts for each level
  showCounts?: boolean;
  // Custom path separator for display
  pathSeparator?: string;
  // Maximum levels to expand by default
  defaultExpandLevels?: number;
  // If true, only one item can be selected at a time
  singleSelect?: boolean;
  // Optional custom summary formatter
  selectionSummary?: (selections: SelectionPath[]) => string;
}

export interface GenericMultiLevelSelectorProps<T = TreeNode> {
  // Tree structure data
  data: TreeNode[];
  // Currently selected paths
  selectedPaths: SelectionPath[];
  // Callbacks
  onSelectionChange: (selections: SelectionPath[]) => void;
  onDataLoaded: (items: T[]) => void;
  onError: (error: string) => void;
  onRefresh?: () => void;
  // State
  isLoading?: boolean;
  isRefreshing?: boolean;
  lastUpdateTime?: Date | null;
  // Configuration
  config?: SelectorConfig;
  // Display customization
  title?: string;
  emptyMessage?: string;
  loadingMessage?: string;
}

export default function GenericMultiLevelSelector<T = TreeNode>({
  data,
  selectedPaths,
  onSelectionChange,
  onDataLoaded,
  onError,
  onRefresh,
  isLoading = false,
  isRefreshing = false,
  lastUpdateTime,
  config = {},
  title = "Multi-Level Selection",
  emptyMessage = "No items found.",
  loadingMessage = "Loading items...",
}: GenericMultiLevelSelectorProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Default configuration
  const {
    allowNonLeafSelection = false,
    showCounts = true,
    pathSeparator = " › ",
    defaultExpandLevels = 1,
    singleSelect = false,
    selectionSummary,
  } = config;

  // Initialize expanded nodes based on default expand levels
  useEffect(() => {
    if (data.length > 0) {
      const initialExpanded = new Set<string>();

      const expandToLevel = (
        nodes: TreeNode[],
        currentLevel: number,
        maxLevel: number
      ) => {
        if (currentLevel >= maxLevel) return;

        nodes.forEach((node) => {
          if (node.children && node.children.length > 0) {
            initialExpanded.add(node.id);
            expandToLevel(node.children, currentLevel + 1, maxLevel);
          }
        });
      };

      expandToLevel(data, 0, defaultExpandLevels);
      setExpandedNodes(initialExpanded);
    }
  }, [data, defaultExpandLevels]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Check if a node is selected
  const isNodeSelected = (nodeId: string): boolean => {
    return selectedPaths.some(
      (selection) => selection.path[selection.path.length - 1] === nodeId
    );
  };

  // Check if a node has any selected descendants
  const hasSelectedDescendants = (node: TreeNode): boolean => {
    return selectedPaths.some(
      (selection) =>
        selection.path.includes(node.id) &&
        selection.path[selection.path.length - 1] !== node.id
    );
  };

  // Get selection summary
  const getSelectionSummary = (): string => {
    if (selectionSummary) return selectionSummary(selectedPaths);
    if (selectedPaths.length === 0) return "Select items to proceed...";

    if (selectedPaths.length === 1) {
      // Flat mode: just show the item name
      return selectedPaths[0].node.name;
    }

    return `${selectedPaths.length} selected`;
  };

  const clearSelections = () => {
    onSelectionChange([]);
    onDataLoaded([] as T[]);
    console.log("[GenericMultiLevelSelector] Cleared selections");
  };

  const toggleNodeExpansion = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  // Find a node by ID in the tree
  const findNode = (nodes: TreeNode[], nodeId: string): TreeNode | null => {
    for (const node of nodes) {
      if (node.id === nodeId) return node;
      if (node.children) {
        const found = findNode(node.children, nodeId);
        if (found) return found;
      }
    }
    return null;
  };

  // Build path from root to a node
  const buildPath = (
    nodes: TreeNode[],
    targetId: string,
    currentPath: string[] = []
  ): string[] | null => {
    for (const node of nodes) {
      const newPath = [...currentPath, node.id];
      if (node.id === targetId) {
        return newPath;
      }
      if (node.children) {
        const found = buildPath(node.children, targetId, newPath);
        if (found) return found;
      }
    }
    return null;
  };

  // Handle node selection/deselection
  const toggleNodeSelection = (nodeId: string) => {
    const node = findNode(data, nodeId);
    if (!node) return;

    // Check if node is selectable
    const isLeaf = !node.children || node.children.length === 0;
    if (!isLeaf && !allowNonLeafSelection) return;
    if (node.isSelectable === false) return;

    const newSelections = [...selectedPaths];
    const existingIndex = newSelections.findIndex(
      (selection) => selection.path[selection.path.length - 1] === nodeId
    );

    if (existingIndex >= 0) {
      // Deselect
      newSelections.splice(existingIndex, 1);
    } else {
      // Select
      const path = buildPath(data, nodeId);
      if (path) {
        if (singleSelect) {
          newSelections.length = 0;
        }
        newSelections.push({
          path,
          node,
        });
      }
    }

    onSelectionChange(newSelections);

    // Extract all selected nodes for data callback
    const allSelectedItems = newSelections.map(
      (selection) => selection.node as T
    );
    onDataLoaded(allSelectedItems);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <label className="block text-sm font-medium text-gray-700">
                {title}
              </label>
            </div>
            <div className="flex items-center space-x-2">
              {lastUpdateTime && (
                <span className="text-xs text-gray-500">
                  Updated: {lastUpdateTime.toLocaleTimeString()}
                </span>
              )}
              {onRefresh && (
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isLoading || isRefreshing}
                  className="inline-flex items-center p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh data"
                >
                  {isRefreshing || isLoading ? (
                    <div className="w-4 h-4 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                  ) : (
                    <ArrowPathIcon className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="relative" ref={dropdownRef}>
            {/* Dropdown Button */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
            >
              <span className="text-gray-700">{getSelectionSummary()}</span>
              <ChevronDownIcon
                className={`h-5 w-5 text-gray-400 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Content */}
            {isOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-y-auto">
                {/* Tree List */}
                <div className="p-2">
                  {isLoading ? (
                    <div className="flex items-center py-4 text-gray-500">
                      <div className="relative mr-2">
                        <div className="w-4 h-4 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                      </div>
                      {loadingMessage}
                    </div>
                  ) : data.length === 0 ? (
                    <div className="py-4 text-gray-500 text-sm">
                      {emptyMessage}
                    </div>
                  ) : (
                    <TreeNodeList
                      nodes={data}
                      level={0}
                      expandedNodes={expandedNodes}
                      selectedPaths={selectedPaths}
                      onToggleExpansion={toggleNodeExpansion}
                      onToggleSelection={toggleNodeSelection}
                      isNodeSelected={isNodeSelected}
                      hasSelectedDescendants={hasSelectedDescendants}
                      allowNonLeafSelection={allowNonLeafSelection}
                      showCounts={showCounts}
                      singleSelect={singleSelect}
                    />
                  )}
                </div>

                {/* Clear Button */}
                {selectedPaths.length > 0 && (
                  <div className="p-2 border-t border-gray-200">
                    <button
                      onClick={clearSelections}
                      className="block w-full text-sm text-blue-600 hover:text-blue-800 text-left"
                    >
                      Clear all selections
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Tree node list component that handles recursive rendering
function TreeNodeList({
  nodes,
  level,
  expandedNodes,
  selectedPaths,
  onToggleExpansion,
  onToggleSelection,
  isNodeSelected,
  hasSelectedDescendants,
  allowNonLeafSelection,
  showCounts,
  singleSelect,
}: {
  nodes: TreeNode[];
  level: number;
  expandedNodes: Set<string>;
  selectedPaths: SelectionPath[];
  onToggleExpansion: (nodeId: string) => void;
  onToggleSelection: (nodeId: string) => void;
  isNodeSelected: (nodeId: string) => boolean;
  hasSelectedDescendants: (node: TreeNode) => boolean;
  allowNonLeafSelection: boolean;
  showCounts: boolean;
  singleSelect: boolean;
}) {
  return (
    <>
      {nodes.map((node) => (
        <TreeNodeItem
          key={node.id}
          node={node}
          level={level}
          isExpanded={expandedNodes.has(node.id)}
          isSelected={isNodeSelected(node.id)}
          hasSelectedDescendants={hasSelectedDescendants(node)}
          onToggleExpansion={() => onToggleExpansion(node.id)}
          onToggleSelection={() => onToggleSelection(node.id)}
          allowNonLeafSelection={allowNonLeafSelection}
          showCounts={showCounts}
          singleSelect={singleSelect}
        >
          {node.children &&
            node.children.length > 0 &&
            expandedNodes.has(node.id) && (
              <div className="ml-6">
                <TreeNodeList
                  nodes={node.children}
                  level={level + 1}
                  expandedNodes={expandedNodes}
                  selectedPaths={selectedPaths}
                  onToggleExpansion={onToggleExpansion}
                  onToggleSelection={onToggleSelection}
                  isNodeSelected={isNodeSelected}
                  hasSelectedDescendants={hasSelectedDescendants}
                  allowNonLeafSelection={allowNonLeafSelection}
                  showCounts={showCounts}
                  singleSelect={singleSelect}
                />
              </div>
            )}
        </TreeNodeItem>
      ))}
    </>
  );
}

// Individual tree node item component
function TreeNodeItem({
  node,
  level,
  isExpanded,
  isSelected,
  hasSelectedDescendants,
  onToggleExpansion,
  onToggleSelection,
  allowNonLeafSelection,
  showCounts,
  singleSelect,
  children,
}: {
  node: TreeNode;
  level: number;
  isExpanded: boolean;
  isSelected: boolean;
  hasSelectedDescendants: boolean;
  onToggleExpansion: () => void;
  onToggleSelection: () => void;
  allowNonLeafSelection: boolean;
  showCounts: boolean;
  singleSelect: boolean;
  children?: React.ReactNode;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isLeaf = !hasChildren;
  const isSelectable = isLeaf || allowNonLeafSelection;
  const isExplicitlyNonSelectable = node.isSelectable === false;

  // Count total items in subtree
  const countItems = (nodes: TreeNode[]): number => {
    return nodes.reduce((count, n) => {
      if (n.children && n.children.length > 0) {
        return count + countItems(n.children);
      }
      return count + 1;
    }, 0);
  };

  const itemCount = hasChildren ? countItems(node.children!) : 0;

  return (
    <div className="mb-1">
      {/* Node Header */}
      <div className="flex items-center p-2 hover:bg-gray-50 rounded">
        {/* Expansion toggle for nodes with children */}
        {hasChildren && (
          <button
            onClick={onToggleExpansion}
            className="mr-2 p-0.5 hover:bg-gray-200 rounded"
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 text-gray-400" />
            )}
          </button>
        )}

        {/* Selection indicator for selectable nodes */}
        {isSelectable && !isExplicitlyNonSelectable && (
          <div className="mr-3" onClick={onToggleSelection}>
            {singleSelect ? (
              <div
                className={`w-4 h-4 border rounded-full flex items-center justify-center ${
                  isSelected ? "border-blue-600" : "border-gray-300"
                }`}
              >
                {isSelected && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full" />
                )}
              </div>
            ) : (
              <div
                className={`w-4 h-4 border border-gray-300 rounded flex items-center justify-center cursor-pointer ${
                  isSelected ? "bg-blue-600 border-blue-600" : "bg-white"
                } ${
                  hasSelectedDescendants && !isSelected
                    ? "border-blue-300 bg-blue-50"
                    : ""
                }`}
              >
                {isSelected && (
                  <CheckIcon className="h-3 w-3 text-white" strokeWidth={3} />
                )}
              </div>
            )}
          </div>
        )}

        {/* Node content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <span
              className={`text-gray-900 ${
                level === 0 ? "font-medium" : "font-normal"
              }`}
            >
              {node.name}
            </span>

            {/* Show item count if configured and has children */}
            {showCounts && hasChildren && (
              <span className="ml-2 text-xs text-gray-500">
                ({itemCount} item{itemCount !== 1 ? "s" : ""})
              </span>
            )}

            {/* Show display info if provided */}
            {showCounts && node.displayInfo && (
              <span className="ml-2 text-xs text-gray-400">
                {node.displayInfo}
              </span>
            )}
          </div>

          {/* Show description if provided */}
          {node.description && (
            <div className="text-sm text-gray-500 mt-1">{node.description}</div>
          )}
        </div>

        {/* Selection indicator for non-selectable nodes with selected descendants */}
        {!isSelectable && hasSelectedDescendants && (
          <CheckIcon className="h-4 w-4 text-blue-600 ml-auto opacity-60" />
        )}
      </div>

      {/* Children */}
      {children}
    </div>
  );
}
