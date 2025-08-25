/**
 * Tree Data Converter
 *
 * Utilities to convert various data structures to the TreeNode format
 * for use with GenericMultiLevelSelector
 */

import { TreeNode } from "@/app/components/GenericMultiLevelSelector";
import { CriterionVersion, CriteriaRequirement } from "./criteriaReader";

// Convert criteria data to tree structure
export function criteriaToDynamicTree(
  criteriaVersions: CriterionVersion[]
): TreeNode[] {
  // Render as a flat, single-level list of selectable criterion versions
  return criteriaVersions.map((version) => ({
    id: version.sheetName,
    name: version.criterionName || version.sheetName,
    // Show concise description with total requirement count
    description: `${version.criterionDescription} (${version.requirements.length} items)`,
    isSelectable: true,
    metadata: {
      type: "criterion",
      version,
    },
    // No children → one-level selector
  }));
}

// Convert flat list with grouping keys to tree structure
export function groupedDataToTree<T extends Record<string, any>>(
  data: T[],
  groupingKeys: string[],
  itemName: (item: T) => string,
  itemDescription?: (item: T) => string,
  itemId?: (item: T) => string
): TreeNode[] {
  if (groupingKeys.length === 0) {
    // No grouping, return flat list
    return data.map((item, index) => ({
      id: itemId ? itemId(item) : `item-${index}`,
      name: itemName(item),
      description: itemDescription ? itemDescription(item) : undefined,
      isSelectable: true,
      metadata: { item, type: "leaf" },
    }));
  }

  // Group by first key
  const [firstKey, ...remainingKeys] = groupingKeys;
  const grouped = data.reduce((acc, item) => {
    const key = item[firstKey] || "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, T[]>);

  // Recursively build tree
  return Object.entries(grouped).map(([groupName, groupItems]) => ({
    id: `${firstKey}-${groupName}`,
    name: groupName,
    description: `${groupItems.length} item${
      groupItems.length !== 1 ? "s" : ""
    }`,
    metadata: { type: "group", groupKey: firstKey, groupValue: groupName },
    children: groupedDataToTree(
      groupItems,
      remainingKeys,
      itemName,
      itemDescription,
      itemId
    ),
  }));
}

// Convert hierarchical object to tree structure
export function objectToTree(
  obj: any,
  name: string,
  id?: string,
  path: string[] = []
): TreeNode {
  const nodeId = id || (path.length > 0 ? path.join("-") : "root");
  const currentPath = [...path, name];

  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    // Leaf node
    return {
      id: nodeId,
      name,
      description: Array.isArray(obj)
        ? `Array (${obj.length} items)`
        : typeof obj,
      isSelectable: true,
      metadata: { value: obj, path: currentPath, type: "leaf" },
    };
  }

  // Branch node
  const children: TreeNode[] = Object.entries(obj).map(([key, value]) =>
    objectToTree(value, key, `${nodeId}-${key}`, currentPath)
  );

  return {
    id: nodeId,
    name,
    description: `Object (${children.length} properties)`,
    metadata: { value: obj, path: currentPath, type: "branch" },
    children,
  };
}

// Generic converter that tries to infer structure
export function autoConvertToTree(
  data: any,
  options: {
    name?: string;
    groupBy?: string[];
    itemName?: (item: any) => string;
    itemDescription?: (item: any) => string;
    itemId?: (item: any) => string;
  } = {}
): TreeNode[] {
  const {
    name = "Data",
    groupBy = [],
    itemName = (item) => item.name || item.title || item.id || String(item),
    itemDescription,
    itemId,
  } = options;

  if (Array.isArray(data)) {
    if (groupBy.length > 0 && data.length > 0 && typeof data[0] === "object") {
      // Group array data
      return groupedDataToTree(
        data,
        groupBy,
        itemName,
        itemDescription,
        itemId
      );
    } else {
      // Flat array
      return data.map((item, index) => ({
        id: itemId ? itemId(item) : `item-${index}`,
        name: itemName(item),
        description: itemDescription ? itemDescription(item) : undefined,
        isSelectable: true,
        metadata: { item, type: "leaf", index },
      }));
    }
  } else if (typeof data === "object" && data !== null) {
    // Convert object to tree
    return [objectToTree(data, name)];
  } else {
    // Single value
    return [
      {
        id: "single-value",
        name: String(data),
        isSelectable: true,
        metadata: { value: data, type: "leaf" },
      },
    ];
  }
}

// Extract selected items from tree selections
export function extractSelectedItems<T = any>(
  selections: { path: string[]; node: TreeNode }[],
  extractValue?: (node: TreeNode) => T
): T[] {
  return selections.map((selection) => {
    if (extractValue) {
      return extractValue(selection.node);
    }

    // Default extraction logic
    const metadata = selection.node.metadata;
    if (metadata?.item) return metadata.item;
    if (metadata?.value !== undefined) return metadata.value;
    if (metadata?.requirement) return metadata.requirement;

    return selection.node as T;
  });
}
