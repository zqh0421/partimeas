"use client";

import { useState } from "react";
import { RubricItem, RubricVersion } from "@/types/rubric";
import { addHistoryEntry, updateRubricItem, getCategoriesInOrder } from "@/utils/rubricUtils";

interface EvaluationCriteriaEditorProps {
  currentVersion: RubricVersion;
  setCurrentVersion: (version: RubricVersion | ((prev: RubricVersion) => RubricVersion)) => void;
  onOpenHistoryModal: (item: RubricItem) => void;
  onSaveVersion: () => void;
}

export default function EvaluationCriteriaEditor({
  currentVersion,
  setCurrentVersion,
  onOpenHistoryModal,
  onSaveVersion,
}: EvaluationCriteriaEditorProps) {
  const [isEditingCardExpanded, setIsEditingCardExpanded] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("Theory Application");
  const [editingCriteria, setEditingCriteria] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const [focusedItem] = useState<string | null>(null);

  const stableCategoryOrder = [
    "Theory Application",
    "Safety & Ethics",
    "Practical Application",
    "Assessment & Observation",
    "Communication & Collaboration",
    "Professional Development",
  ];

  const startEditing = (itemId: string, currentValue: string) => {
    setEditingCriteria(itemId);
    setEditingValue(currentValue);
  };

  const saveEditing = (itemId: string) => {
    if (editingValue.trim()) {
      updateRubricItemLocal(itemId, "criteria", editingValue);
      setEditingCriteria(null);
      setEditingValue("");
    }
  };

  const cancelEditing = () => {
    setEditingCriteria(null);
    setEditingValue("");
  };

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, category?: string) => {
    e.preventDefault();
    if (category) {
      setDragTarget(category);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragTarget(null);
  };

  const handleDrop = (e: React.DragEvent, targetCategory: string) => {
    e.preventDefault();
    if (draggedItem && targetCategory) {
      const item = currentVersion.rubricItems.find(
        (item) => item.id === draggedItem
      );
      if (item && item.category !== targetCategory) {
        const oldCategory = item.category;
        updateRubricItemLocal(draggedItem, "category", targetCategory);
        addHistoryEntryLocal(
          "modified",
          "category",
          oldCategory,
          targetCategory,
          `Moved "${item.criteria}" from ${oldCategory} to ${targetCategory}`
        );
      }
    }
    setDraggedItem(null);
    setDragTarget(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragTarget(null);
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    const categoryItems = currentVersion.rubricItems.filter(
      (item) => item.category === selectedCategory
    );
    const currentIndex = categoryItems[index];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < categoryItems.length) {
      const targetItem = categoryItems[targetIndex];

      const updatedItems = [...currentVersion.rubricItems];
      const currentItemIndex = updatedItems.findIndex(
        (item) => item.id === currentIndex.id
      );
      const targetItemIndex = updatedItems.findIndex(
        (item) => item.id === targetItem.id
      );

      [updatedItems[currentItemIndex], updatedItems[targetItemIndex]] = [
        updatedItems[targetItemIndex],
        updatedItems[currentItemIndex],
      ];

      setCurrentVersion((prev) => ({
        ...prev,
        rubricItems: updatedItems,
      }));

      addHistoryEntryLocal(
        "modified",
        "order",
        `${index}`,
        `${targetIndex}`,
        `Reordered criteria "${currentIndex.criteria}" ${direction} in ${selectedCategory}`
      );
    }
  };

  const addHistoryEntryLocal = (
    action: "created" | "modified" | "merged" | "star" | "unstared",
    field?: string,
    oldValue?: string,
    newValue?: string,
    comment?: string
  ) => {
    addHistoryEntry(currentVersion, setCurrentVersion, action, field, oldValue, newValue, comment);
  };

  const updateRubricItemLocal = (
    itemId: string,
    field: keyof RubricItem,
    value: string
  ) => {
    updateRubricItem(currentVersion, setCurrentVersion, itemId, field, value);
  };

  const deleteRubricItem = (itemId: string) => {
    const item = currentVersion.rubricItems.find((item) => item.id === itemId);
    if (item) {
      setCurrentVersion((prev) => ({
        ...prev,
        rubricItems: prev.rubricItems.filter((item) => item.id !== itemId),
      }));
          addHistoryEntryLocal(
      "modified",
      "criteria",
      item.criteria,
      "",
      `Deleted criteria "${item.criteria}"`
    );
    }
  };

  const addRubricItem = (category: string) => {
    const newItem: RubricItem = {
      id: Date.now().toString(),
      criteria: "New Criteria",
      description: "Describe what this criterion evaluates...",
      category: category,
    };

    setCurrentVersion((prev) => ({
      ...prev,
      rubricItems: [...prev.rubricItems, newItem],
    }));

    addHistoryEntryLocal(
      "created",
      "criteria",
      "",
      newItem.criteria,
      `Added new criteria: ${newItem.criteria} to ${category} category`
    );
  };

  const addNewCategory = () => {
    const newCategory = prompt("Enter new category name:");
    if (newCategory && newCategory.trim()) {
      if (!stableCategoryOrder.includes(newCategory.trim())) {
        stableCategoryOrder.push(newCategory.trim());
      }
    }
  };

  const categories = getCategoriesInOrder(currentVersion);
  const categoryItems = currentVersion.rubricItems.filter(
    (item) => item.category === selectedCategory
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              📝 Evaluation Criteria Editor
            </h2>
          </div>
          <button
            onClick={() =>
              setIsEditingCardExpanded(!isEditingCardExpanded)
            }
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <span className="text-lg">
              {isEditingCardExpanded ? "▼" : "▶"}
            </span>
          </button>
        </div>
      </div>

      {isEditingCardExpanded && (
        <div className="p-4 sm:p-6">
          <div className="bg-gray-50 rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Evaluation Criteria (Rate 1-5 Each)
                </h3>
                <button
                  onClick={onSaveVersion}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <span>💾</span>
                  <span>Save Version</span>
                </button>
              </div>
            </div>

            <div className="p-4">
              {/* Category Pills */}
              <div className="flex flex-wrap gap-2 mb-6">
                {categories.map((category) => (
                  <div
                    key={category}
                    onDragOver={(e) => handleDragOver(e, category)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                      selectedCategory === category
                        ? "bg-green-600 text-white shadow-md"
                        : "bg-green-100 text-green-800 hover:bg-green-200"
                    } ${
                      dragTarget === category
                        ? "ring-2 ring-green-500 ring-offset-2 bg-green-200 shadow-lg scale-105"
                        : ""
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </div>
                ))}
                <button
                  onClick={addNewCategory}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                >
                  + Add Category
                </button>
              </div>

              {/* Category Items */}
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-lg font-medium text-gray-900">
                    {selectedCategory}
                  </h4>
                  <button
                    onClick={() => addRubricItem(selectedCategory)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    + Add Criteria
                  </button>
                </div>

                {categoryItems.length > 0 && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600">💡</span>
                      <p className="text-sm text-blue-800 font-medium">
                        <strong>Tip:</strong> Drag criteria items to move them between categories. 
                        After dropping, you&apos;ll be taken to the target category and the moved item will be highlighted.
                      </p>
                    </div>
                  </div>
                )}

                {categoryItems.map((item, index) => (
                  <div
                    key={item.id}
                    id={`criteria-${item.id}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    onDragOver={(e) => handleDragOver(e, item.category)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, item.category)}
                    onDragEnd={handleDragEnd}
                    className={`border border-gray-200 rounded-lg p-3 ${
                      draggedItem === item.id ? "opacity-50" : ""
                    } hover:shadow-md transition-all cursor-move ${
                      dragTarget === item.category &&
                      draggedItem !== item.id
                        ? "border-2 border-dashed border-green-400 bg-green-50"
                        : ""
                    } ${
                      focusedItem === item.id
                        ? "ring-2 ring-blue-500 ring-offset-2 bg-blue-50 border-blue-300 shadow-lg"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex flex-col space-y-0.5">
                          <button
                            onClick={() => moveItem(index, "up")}
                            disabled={index === 0}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => moveItem(index, "down")}
                            disabled={
                              index === categoryItems.length - 1
                            }
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                          >
                            ▼
                          </button>
                        </div>
                        <span className="text-gray-400 text-xs mr-1">
                          ⋮⋮
                        </span>
                        <div className="flex items-center space-x-1">
                          {editingCriteria === item.id ? (
                            <input
                              type="text"
                              value={editingValue}
                              onChange={(e) =>
                                setEditingValue(e.target.value)
                              }
                              onBlur={() => saveEditing(item.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  saveEditing(item.id);
                                } else if (e.key === "Escape") {
                                  cancelEditing();
                                }
                              }}
                              className="px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base font-medium overflow-visible"
                              autoFocus
                            />
                          ) : (
                            <div className="flex items-center space-x-2">
                              <h4 className="text-base font-medium text-gray-900">
                                {item.criteria}
                              </h4>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              if (editingCriteria === item.id) {
                                saveEditing(item.id);
                              } else {
                                startEditing(item.id, item.criteria);
                              }
                            }}
                            className="text-gray-400 hover:text-gray-600 text-xs"
                          >
                            ✏️
                          </button>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onOpenHistoryModal(item)}
                            className="text-blue-600 hover:text-blue-800 text-xs"
                            title="View History"
                          >
                            📋
                          </button>
                          <button
                            onClick={() => deleteRubricItem(item.id)}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="ml-6">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        rows={2}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm overflow-visible"
                        placeholder="Describe what this criterion evaluates in child development AI responses..."
                        value={item.description}
                        onChange={(e) =>
                          updateRubricItemLocal(
                            item.id,
                            "description",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                ))}

                {categoryItems.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <div className="mb-4">
                      <span className="text-4xl">📝</span>
                    </div>
                    <p className="text-lg font-medium mb-2">No criteria in this category yet.</p>
                    <p className="text-sm opacity-75">
                      Click &quot;Add Criteria&quot; to get started with your evaluation framework.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 