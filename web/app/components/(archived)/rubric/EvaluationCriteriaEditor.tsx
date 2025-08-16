"use client";

import { useState } from "react";
import { RubricItem, RubricVersion } from "@/app/types";
import {
  addHistoryEntry,
  updateRubricItem,
  getCategoriesInOrder,
} from "@/app/utils/rubricUtils";

interface EvaluationCriteriaEditorProps {
  currentVersion: RubricVersion;
  setCurrentVersion: (
    version: RubricVersion | ((prev: RubricVersion) => RubricVersion)
  ) => void;
  onOpenHistoryModal: (item: RubricItem) => void;
  onSaveVersion: () => void;
}

// Category descriptions to help users understand what each category evaluates
const categoryDescriptions: Record<string, string> = {
  "Theory Application":
    "Evaluates how well the AI response demonstrates understanding and proper application of child development theories (e.g., Piaget, Vygotsky, Erikson, Polyvagal Theory).",
  "Safety & Ethics":
    "Assesses the AI's awareness and prioritization of child safety, ethical considerations, and appropriate boundaries in recommendations.",
  "Practical Application":
    "Evaluates the feasibility and effectiveness of suggested interventions and activities in real-world settings.",
  "Assessment & Observation":
    "Assesses understanding of developmentally appropriate assessment methods and observational techniques for gathering relevant information.",
  "Communication & Collaboration":
    "Evaluates the AI's ability to communicate effectively with various stakeholders and promote collaborative approaches.",
  "Professional Development":
    "Assesses the AI's understanding of ongoing learning, reflection, and professional growth in child development practice.",
};

// Template questions for scaffolding agreement-based descriptions
const agreementQuestionTemplates = {
  "Theory Application": [
    "The response demonstrates accurate understanding of relevant child development theories.",
    "Theoretical concepts are appropriately applied to the specific situation.",
    "The response shows awareness of current research and evidence-based practices.",
  ],
  "Safety & Ethics": [
    "The response prioritizes child safety and well-being in all recommendations.",
    "Ethical considerations and appropriate boundaries are clearly addressed.",
    "The response demonstrates cultural sensitivity and respect for diverse perspectives.",
  ],
  "Practical Application": [
    "The suggested strategies are feasible and can be implemented in real-world settings.",
    "The recommendations are developmentally appropriate for the child's age and needs.",
    "The response provides concrete, actionable steps rather than vague suggestions.",
  ],
  "Assessment & Observation": [
    "The response demonstrates understanding of appropriate assessment methods.",
    "Observational techniques are well-described and developmentally appropriate.",
    "The assessment approach considers the child's individual needs and context.",
  ],
  "Communication & Collaboration": [
    "The response promotes effective communication with parents, caregivers, and professionals.",
    "Collaborative approaches with other stakeholders are appropriately suggested.",
    "The communication style is clear, respectful, and accessible to the target audience.",
  ],
  "Professional Development": [
    "The response encourages ongoing learning and professional growth.",
    "Reflection and self-assessment are appropriately incorporated.",
    "The response demonstrates awareness of current best practices and research.",
  ],
};

export default function EvaluationCriteriaEditor({
  currentVersion,
  setCurrentVersion,
  onOpenHistoryModal,
  onSaveVersion,
}: EvaluationCriteriaEditorProps) {
  const [isEditingCardExpanded, setIsEditingCardExpanded] = useState(true);
  const [selectedCategory, setSelectedCategory] =
    useState<string>("Theory Application");
  const [editingCriteria, setEditingCriteria] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const [focusedItem] = useState<string | null>(null);
  const [showDescriptionHelper, setShowDescriptionHelper] = useState<
    string | null
  >(null);
  const [showCategoryEditModal, setShowCategoryEditModal] = useState(false);
  const [editingCategoryName, setEditingCategoryName] = useState<string>("");
  const [editingCategoryDesc, setEditingCategoryDesc] = useState<string>("");
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [newCategoryDesc, setNewCategoryDesc] = useState<string>("");

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
    addHistoryEntry(
      currentVersion,
      setCurrentVersion,
      action,
      field,
      oldValue,
      newValue,
      comment
    );
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
    // Get a template question for the category
    const templates =
      agreementQuestionTemplates[
        category as keyof typeof agreementQuestionTemplates
      ] || [];
    const defaultDescription =
      templates.length > 0
        ? templates[0]
        : "The response demonstrates this criterion effectively.";

    const newItem: RubricItem = {
      id: Date.now().toString(),
      criteria: "New Criteria",
      description: defaultDescription,
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

  const openCategoryEditModal = (category: string) => {
    setEditingCategoryName(category);
    setEditingCategoryDesc(categoryDescriptions[category] || "");
    setShowCategoryEditModal(true);
  };

  const saveCategoryEdit = () => {
    if (
      editingCategoryName.trim() &&
      editingCategoryName !== selectedCategory
    ) {
      // Update category name in all rubric items
      setCurrentVersion((prev) => ({
        ...prev,
        rubricItems: prev.rubricItems.map((item) =>
          item.category === selectedCategory
            ? { ...item, category: editingCategoryName.trim() }
            : item
        ),
      }));

      // Update category descriptions
      if (editingCategoryDesc.trim()) {
        categoryDescriptions[editingCategoryName.trim()] =
          editingCategoryDesc.trim();
      }

      // Update selected category
      setSelectedCategory(editingCategoryName.trim());

      addHistoryEntryLocal(
        "modified",
        "category_name",
        selectedCategory,
        editingCategoryName.trim(),
        `Renamed category from "${selectedCategory}" to "${editingCategoryName.trim()}"`
      );
    } else if (
      editingCategoryDesc.trim() !== categoryDescriptions[selectedCategory]
    ) {
      // Only description changed
      categoryDescriptions[selectedCategory] = editingCategoryDesc.trim();
      addHistoryEntryLocal(
        "modified",
        "category_description",
        categoryDescriptions[selectedCategory] || "",
        editingCategoryDesc.trim(),
        `Updated description for category "${selectedCategory}"`
      );
    } else {
      // No changes made
      return;
    }

    setShowCategoryEditModal(false);
    setEditingCategoryName("");
    setEditingCategoryDesc("");
  };

  const cancelCategoryEdit = () => {
    setShowCategoryEditModal(false);
    setEditingCategoryName("");
    setEditingCategoryDesc("");
  };

  const addNewCategory = () => {
    setNewCategoryName("");
    setNewCategoryDesc("");
    setShowAddCategoryModal(true);
  };

  const saveNewCategory = () => {
    if (newCategoryName.trim()) {
      if (!stableCategoryOrder.includes(newCategoryName.trim())) {
        stableCategoryOrder.push(newCategoryName.trim());
      }
      // Add the description to categoryDescriptions (required)
      categoryDescriptions[newCategoryName.trim()] = newCategoryDesc.trim();

      addHistoryEntryLocal(
        "created",
        "category",
        "",
        newCategoryName.trim(),
        `Added new category: ${newCategoryName.trim()}`
      );

      setShowAddCategoryModal(false);
      setNewCategoryName("");
      setNewCategoryDesc("");
    }
  };

  const cancelAddCategory = () => {
    setShowAddCategoryModal(false);
    setNewCategoryName("");
    setNewCategoryDesc("");
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
            onClick={() => setIsEditingCardExpanded(!isEditingCardExpanded)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <span className="text-lg">{isEditingCardExpanded ? "▼" : "▶"}</span>
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
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-medium text-gray-900">
                      {selectedCategory}
                    </h4>
                    <button
                      onClick={() => openCategoryEditModal(selectedCategory)}
                      className="text-gray-400 hover:text-gray-600 text-sm"
                      title="Edit category"
                    >
                      ✏️
                    </button>
                  </div>
                  <button
                    onClick={() => addRubricItem(selectedCategory)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    + Add Criteria
                  </button>
                </div>

                {categoryItems.length > 0 && (
                  <div className="mb-4 ">
                    <div className="flex flex-col items-left gap-2">
                      <p className="text-sm">
                        {categoryDescriptions[selectedCategory] ||
                          "This category evaluates important aspects of child development AI responses."}
                      </p>
                      <p className="text-xs ">
                        <strong>Rating Scale:</strong> 1 = Poor, 2 = Below
                        Average, 3 = Average, 4 = Good, 5 = Excellent
                      </p>
                    </div>
                    <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                      <div className="flex flex-col items-left gap-2">
                        <p className="text-sm text-blue-800 font-medium">
                          <strong>💡 Tip:</strong> Drag criteria items to move
                          them between categories. After dropping, you&apos;ll
                          be taken to the target category and the moved item
                          will be highlighted.
                        </p>
                      </div>
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
                      dragTarget === item.category && draggedItem !== item.id
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
                            disabled={index === categoryItems.length - 1}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                          >
                            ▼
                          </button>
                        </div>
                        <span className="text-gray-400 text-xs mr-1">⋮⋮</span>
                        <div className="flex items-center space-x-1">
                          {editingCriteria === item.id ? (
                            <input
                              type="text"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
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
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-gray-700">
                          Description
                        </label>
                        <button
                          onClick={() =>
                            setShowDescriptionHelper(
                              showDescriptionHelper === item.id ? null : item.id
                            )
                          }
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          {showDescriptionHelper === item.id ? "Hide" : "Show"}{" "}
                          Templates
                        </button>
                      </div>

                      {showDescriptionHelper === item.id && (
                        <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                          <p className="text-yellow-800 mb-2 font-medium">
                            Template questions for {selectedCategory}:
                          </p>
                          <ul className="space-y-1 text-yellow-700">
                            {agreementQuestionTemplates[
                              selectedCategory as keyof typeof agreementQuestionTemplates
                            ]?.map((template, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-yellow-600">•</span>
                                <span>{template}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <textarea
                        rows={2}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm overflow-visible"
                        placeholder="Write a criterion description for the 1-5 rating scale (e.g., 'The response demonstrates accurate understanding of child development theories')"
                        value={item.description}
                        onChange={(e) =>
                          updateRubricItemLocal(
                            item.id,
                            "description",
                            e.target.value
                          )
                        }
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Write a description that can be rated 1-5 (Poor to
                        Excellent)
                      </p>
                    </div>
                  </div>
                ))}

                {categoryItems.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <div className="mb-4">
                      <span className="text-4xl">📝</span>
                    </div>
                    <p className="text-lg font-medium mb-2">
                      No criteria in this category yet.
                    </p>
                    <p className="text-sm opacity-75">
                      Click &quot;Add Criteria&quot; to get started with your
                      evaluation framework.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Edit Modal */}
      {showCategoryEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Category
              </h3>
              <button
                onClick={cancelCategoryEdit}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  value={editingCategoryName}
                  onChange={(e) => setEditingCategoryName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter category name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Description *
                </label>
                <textarea
                  value={editingCategoryDesc}
                  onChange={(e) => setEditingCategoryDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe what this category evaluates in child development AI responses..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Write a description that can be rated 1-5 (Poor to Excellent)
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={cancelCategoryEdit}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveCategoryEdit}
                disabled={
                  !editingCategoryName.trim() || !editingCategoryDesc.trim()
                }
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Add New Category
              </h3>
              <button
                onClick={cancelAddCategory}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter category name"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Description *
                </label>
                <textarea
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe what this category evaluates in child development AI responses..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Write a description that can be rated 1-5 (Poor to Excellent)
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={cancelAddCategory}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveNewCategory}
                disabled={!newCategoryName.trim() || !newCategoryDesc.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
