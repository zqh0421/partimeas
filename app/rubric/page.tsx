"use client";

import { useState, useEffect } from "react";
import SettingsModal from "../../components/rubric/SettingsModal";
import CriteriaHistory from "../../components/rubric/CriteriaHistory";
import ReactFlowBranchDiagram from "../../components/rubric/ReactFlowBranchDiagram";
import RubricComparison from "../../components/rubric/RubricComparison";
import ResultsComparisonAnalysis from "../../components/rubric/ResultsComparisonAnalysis";
import {
  mockCurrentVersion,
  mockVersions,
  mockHistoryData,
} from "../../data/mockHistoryData";
import {
  RubricItem,
  RubricVersion,
  HistoryEntry,
  VersionData,
} from "../../types/rubric";

export default function RubricPage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    systemPrompt: false,
    evaluationPrompt: false,
    useCases: false,
  });

  const stableCategoryOrder = [
    "Theory Application",
    "Safety & Ethics",
    "Practical Application",
    "Assessment & Observation",
    "Communication & Collaboration",
    "Professional Development",
  ];

  const [currentVersion, setCurrentVersion] =
    useState<RubricVersion>(mockCurrentVersion);

  const [selectedCategory, setSelectedCategory] =
    useState<string>("Theory Application");
  const [editingCriteria, setEditingCriteria] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const [focusedItem, setFocusedItem] = useState<string | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedCriteriaForHistory, setSelectedCriteriaForHistory] =
    useState<RubricItem | null>(null);
  const [reactFlowBranchOpen, setReactFlowBranchOpen] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [selectedUseCaseForTests, setSelectedUseCaseForTests] = useState<string>('');

  const [isEditingCardExpanded, setIsEditingCardExpanded] = useState(true);
  const [isComparisonCardExpanded, setIsComparisonCardExpanded] =
    useState(false);

  useEffect(() => {
    console.log("Current Version Updated:", {
      id: currentVersion.id,
      name: currentVersion.name,
      version: currentVersion.version,
      historyLength: currentVersion.history.length,
      rubricItemsCount: currentVersion.rubricItems.length,
    });
  }, [currentVersion]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const startEditing = (itemId: string, currentValue: string) => {
    setEditingCriteria(itemId);
    setEditingValue(currentValue);
  };

  const saveEditing = (itemId: string) => {
    if (editingValue.trim()) {
      updateRubricItem(itemId, "criteria", editingValue);
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
        updateRubricItem(draggedItem, "category", targetCategory);
        addHistoryEntry(
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

      addHistoryEntry(
        "modified",
        "order",
        `${index}`,
        `${targetIndex}`,
        `Reordered criteria "${currentIndex.criteria}" ${direction} in ${selectedCategory}`
      );
    }
  };

  const addHistoryEntry = (
    action: "created" | "modified" | "merged" | "star" | "unstared",
    field?: string,
    oldValue?: string,
    newValue?: string,
    comment?: string
  ) => {
    const historyEntry: HistoryEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      modifier: "Current User",
      action,
      field,
      oldValue,
      newValue,
      comment,
      version: currentVersion.version,
      changeType:
        field === "criteria"
          ? "criteria_name"
          : field === "description"
          ? "criteria_description"
          : field === "category"
          ? "change_category"
          : "add_criteria",
    };

    setCurrentVersion((prev) => ({
      ...prev,
      history: [...prev.history, historyEntry],
    }));
  };

  const updateRubricItem = (
    itemId: string,
    field: keyof RubricItem,
    value: string
  ) => {
    setCurrentVersion((prev) => ({
      ...prev,
      rubricItems: prev.rubricItems.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      ),
    }));

    const item = currentVersion.rubricItems.find((item) => item.id === itemId);
    if (item) {
      addHistoryEntry(
        "modified",
        field,
        item[field as keyof RubricItem] as string,
        value,
        `Updated ${field} for "${item.criteria}"`
      );
    }
  };

  const deleteRubricItem = (itemId: string) => {
    const item = currentVersion.rubricItems.find((item) => item.id === itemId);
    if (item) {
      setCurrentVersion((prev) => ({
        ...prev,
        rubricItems: prev.rubricItems.filter((item) => item.id !== itemId),
      }));
      addHistoryEntry(
        "modified",
        "criteria",
        item.criteria,
        "",
        `Deleted criteria "${item.criteria}"`
      );
    }
  };

  const openHistoryModal = (item: RubricItem) => {
    setSelectedCriteriaForHistory(item);
    setHistoryModalOpen(true);
  };

  const openReactFlowBranch = () => {
    console.log("Opening ReactFlow branch diagram for overall criteria");
    setReactFlowBranchOpen(true);
  };

  const openComparison = () => {
    console.log("Opening rubric comparison interface");
    setComparisonOpen(true);
  };

  const handleLoadVersion = (versionData: VersionData) => {
    console.log("Loading version into editing interface:", versionData);

    if (
      confirm(
        `Load version ${versionData.version} (${versionData.modifier}) into editing interface?`
      )
    ) {
      console.log("Version loading confirmed:", versionData);
      setReactFlowBranchOpen(false);
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

    addHistoryEntry(
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

  const saveVersion = () => {
    const versionName = prompt("Enter version name:");
    if (versionName) {
      const newVersion: RubricVersion = {
        ...currentVersion,
        id: Date.now().toString(),
        name: versionName,
        createdAt: new Date(),
      };
      console.log("Saved version:", newVersion);
    }
  };

  const exportVersion = () => {
    const dataStr = JSON.stringify(currentVersion, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rubric-version-${currentVersion.name}.json`;
    link.click();
  };

  const getCategoriesInOrder = () => {
    const existingCategories = Array.from(
      new Set(currentVersion.rubricItems.map((item) => item.category))
    );
    const orderedCategories = stableCategoryOrder.filter((cat) =>
      existingCategories.includes(cat)
    );
    const newCategories = existingCategories.filter(
      (cat) => !stableCategoryOrder.includes(cat)
    );
    return [...orderedCategories, ...newCategories];
  };

  const categories = getCategoriesInOrder();
  const categoryItems = currentVersion.rubricItems.filter(
    (item) => item.category === selectedCategory
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Child Development Rubric Refiner
              </h1>
              <p className="text-gray-600 text-base sm:text-lg">
                Refine evaluation criteria for AI responses in child development scenarios
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={openReactFlowBranch}
                className="px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm sm:text-base"
              >
                <span>🚀</span>
                <span className="hidden sm:inline">Version History</span>
              </button>

            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 lg:gap-6">
          {/* Left Sidebar - Configuration */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 lg:sticky lg:top-6 transition-all duration-200 hover:shadow-md">
                              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                        🔧 Configuration
                      </h2>
                    </div>
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="px-3 py-1 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    ⚙️
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="space-y-4">
                  {/* System Prompt Section */}
                  <div className="bg-gray-50 rounded-lg border border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <button
                        onClick={() => toggleSection("systemPrompt")}
                        className="flex justify-between items-center w-full text-left"
                      >
                        <h3 className="text-base font-semibold text-gray-900">
                          S123 Relation GPT
                        </h3>
                        <span className="text-gray-500">
                          {expandedSections.systemPrompt ? "▼" : "▶"}
                        </span>
                      </button>
                    </div>
                    {expandedSections.systemPrompt && (
                      <div className="p-4">
                        <textarea
                          rows={6}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm overflow-visible"
                          placeholder="Enter the system prompt for evaluating LLM outputs..."
                          value={currentVersion.systemPrompt}
                          onChange={(e) =>
                            setCurrentVersion((prev) => ({
                              ...prev,
                              systemPrompt: e.target.value,
                            }))
                          }
                        />
                      </div>
                    )}
                  </div>

                                    {/* Use Cases & Test Cases Section */}
                  <div className="bg-gray-50 rounded-lg border border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <button
                        onClick={() => toggleSection("useCases")}
                        className="flex justify-between items-center w-full text-left"
                      >
                        <h3 className="text-base font-semibold text-gray-900">
                          Use Cases
                        </h3>
                        <span className="text-gray-500">
                          {expandedSections.useCases ? "▼" : "▶"}
                        </span>
                      </button>
                    </div>
                    {expandedSections.useCases && (
                      <div className="p-4">
                        <div className="space-y-4">
                          <div className="text-sm text-gray-600 mb-3">
                            Five predefined use cases for LLM-as-a-judge evaluation scenarios. Select a use case to manage its test cases.
                          </div>
                          
                          {/* Use Case Selection */}
                          <div className="mb-4">
                            <label className="block text-xs font-medium text-gray-700 mb-2">
                              Select Use Case
                            </label>
                            <select
                              value={selectedUseCaseForTests}
                              onChange={(e) => setSelectedUseCaseForTests(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            >
                              <option value="">-- Choose a use case --</option>
                              {(currentVersion.useCases || []).map((useCase, index) => (
                                <option key={useCase.id} value={useCase.id}>
                                  {index + 1}. {useCase.name} ({useCase.testCases.length} test cases)
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          {/* Selected Use Case Details */}
                          {selectedUseCaseForTests && (() => {
                            const selectedUseCase = (currentVersion.useCases || []).find(uc => uc.id === selectedUseCaseForTests);
                            const useCaseIndex = (currentVersion.useCases || []).findIndex(uc => uc.id === selectedUseCaseForTests);
                            
                            if (!selectedUseCase) return null;
                            
                            return (
                              <div className="space-y-4">
                                {/* Use Case Info */}
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium text-gray-900">
                                      {selectedUseCase.name}
                                    </h4>
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                      {selectedUseCase.testCases.length} test cases
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-4">{selectedUseCase.description}</p>
                                  
                                  {/* Test Cases Management */}
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <h5 className="text-sm font-medium text-gray-700">Test Cases</h5>
                                      <button
                                        onClick={() => {
                                          const newTestCase = {
                                            id: `test-${selectedUseCaseForTests}-${Date.now()}`,
                                            input: '',
                                            expectedOutput: '',
                                            useCaseId: selectedUseCaseForTests
                                          };
                                          const updatedUseCases = [...(currentVersion.useCases || [])];
                                          updatedUseCases[useCaseIndex] = {
                                            ...selectedUseCase,
                                            testCases: [...selectedUseCase.testCases, newTestCase]
                                          };
                                          setCurrentVersion((prev) => ({
                                            ...prev,
                                            useCases: updatedUseCases,
                                          }));
                                        }}
                                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                      >
                                        + Add Test Case
                                      </button>
                                    </div>
                                    
                                    {/* Test Cases List */}
                                    <div className="space-y-3">
                                      {selectedUseCase.testCases.map((testCase, testIndex) => (
                                        <div key={testCase.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                          <div className="flex items-center justify-between mb-2">
                                            <h6 className="text-sm font-medium text-gray-700">Test Case {testIndex + 1}</h6>
                                            <button
                                              onClick={() => {
                                                const updatedUseCases = [...(currentVersion.useCases || [])];
                                                updatedUseCases[useCaseIndex] = {
                                                  ...selectedUseCase,
                                                  testCases: selectedUseCase.testCases.filter((_, i) => i !== testIndex)
                                                };
                                                setCurrentVersion((prev) => ({
                                                  ...prev,
                                                  useCases: updatedUseCases,
                                                }));
                                              }}
                                              className="text-red-500 hover:text-red-700 text-sm"
                                            >
                                              ✕
                                            </button>
                                          </div>
                                          <div className="space-y-2">
                                            <div>
                                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Input
                                              </label>
                                              <textarea
                                                rows={2}
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                value={testCase.input}
                                                onChange={(e) => {
                                                  const updatedUseCases = [...(currentVersion.useCases || [])];
                                                  const updatedTestCases = [...selectedUseCase.testCases];
                                                  updatedTestCases[testIndex] = {
                                                    ...testCase,
                                                    input: e.target.value,
                                                  };
                                                  updatedUseCases[useCaseIndex] = {
                                                    ...selectedUseCase,
                                                    testCases: updatedTestCases,
                                                  };
                                                  setCurrentVersion((prev) => ({
                                                    ...prev,
                                                    useCases: updatedUseCases,
                                                  }));
                                                }}
                                                placeholder="Enter test case input..."
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Expected Output
                                              </label>
                                              <textarea
                                                rows={2}
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                value={testCase.expectedOutput}
                                                onChange={(e) => {
                                                  const updatedUseCases = [...(currentVersion.useCases || [])];
                                                  const updatedTestCases = [...selectedUseCase.testCases];
                                                  updatedTestCases[testIndex] = {
                                                    ...testCase,
                                                    expectedOutput: e.target.value,
                                                  };
                                                  updatedUseCases[useCaseIndex] = {
                                                    ...selectedUseCase,
                                                    testCases: updatedTestCases,
                                                  };
                                                  setCurrentVersion((prev) => ({
                                                    ...prev,
                                                    useCases: updatedUseCases,
                                                  }));
                                                }}
                                                placeholder="Enter expected output..."
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                      
                                      {selectedUseCase.testCases.length === 0 && (
                                        <div className="text-center text-gray-500 py-6">
                                          <div className="text-2xl mb-2">📝</div>
                                          <p className="text-sm">No test cases yet</p>
                                          <p className="text-xs text-gray-400">Click "Add Test Case" to get started</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                          
                          {/* Empty State */}
                          {!selectedUseCaseForTests && (
                            <div className="text-center text-gray-500 py-8">
                              <div className="text-3xl mb-3">🎯</div>
                              <p className="text-sm font-medium mb-1">No Use Case Selected</p>
                              <p className="text-xs">Choose a use case from the dropdown above to manage its test cases</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-7 space-y-4 lg:space-y-6">
            {/* Evaluation Criteria Editor Card */}
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
                          onClick={saveVersion}
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
                                After dropping, you'll be taken to the target category and the moved item will be highlighted.
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
                                    onClick={() => openHistoryModal(item)}
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
                                  updateRubricItem(
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
                              Click "Add Criteria" to get started with your evaluation framework.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Results Comparison Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                      📊 Results Comparison & Analysis
                    </h2>

                  </div>
                  <button
                    onClick={() =>
                      setIsComparisonCardExpanded(!isComparisonCardExpanded)
                    }
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <span className="text-lg">
                      {isComparisonCardExpanded ? "▼" : "▶"}
                    </span>
                  </button>
                </div>
              </div>

              {isComparisonCardExpanded && (
                <div className="p-4 sm:p-6">
                  {/* Evaluation Prompt Section */}
                  <div className="mb-6">
                    <div className="bg-gray-50 rounded-lg border border-gray-200">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <button
                          onClick={() => toggleSection("evaluationPrompt")}
                          className="flex justify-between items-center w-full text-left"
                        >
                          <h3 className="text-lg font-semibold text-gray-900">
                            Evaluation Prompt (Criteria Testing)
                          </h3>
                          <span className="text-gray-500">
                            {expandedSections.evaluationPrompt ? "▼" : "▶"}
                          </span>
                        </button>
                      </div>
                      {expandedSections.evaluationPrompt && (
                        <div className="p-4">
                          <textarea
                            rows={6}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 overflow-visible"
                            placeholder="Enter the evaluation prompt for testing criteria..."
                            value={currentVersion.evaluationPrompt}
                            onChange={(e) =>
                              setCurrentVersion((prev) => ({
                                ...prev,
                                evaluationPrompt: e.target.value,
                              }))
                            }
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Results Comparison Analysis Component */}
                  <div className="mb-6">
                    <ResultsComparisonAnalysis
                      currentVersion={currentVersion}
                      isOpen={true}
                      onClose={() => {}}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                      <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <span>📈</span>
                        Version Evolution
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-blue-700">v1.0</span>
                          <span className="font-medium text-blue-900">
                            {mockVersions[0].rubricItems.length} criteria
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-blue-700">v2.0</span>
                          <span className="font-medium text-blue-900">
                            {mockVersions[1].rubricItems.length} criteria
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-blue-700">v2.1</span>
                          <span className="font-medium text-blue-900">
                            {mockVersions[2].rubricItems.length} criteria
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                      <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                        <span>📊</span>
                        Category Distribution
                      </h3>
                      <div className="space-y-2 text-sm">
                        {Array.from(
                          new Set(
                            mockVersions[0].rubricItems.map(
                              (item) => item.category
                            )
                          )
                        ).map((category) => {
                          const count = mockVersions[0].rubricItems.filter(
                            (item) => item.category === category
                          ).length;
                          return (
                            <div
                              key={category}
                              className="flex justify-between items-center"
                            >
                              <span className="text-green-700">{category}</span>
                              <span className="font-medium text-green-900">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                      <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                        <span>🔄</span>
                        Recent Changes
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="text-purple-700">
                          <div className="font-medium">v2.1 → v2.0</div>
                          <div className="text-xs opacity-75">
                            +1 Communication criteria
                          </div>
                        </div>
                        <div className="text-purple-700">
                          <div className="font-medium">v2.0 → v1.0</div>
                          <div className="text-xs opacity-75">+1 Safety criteria</div>
                        </div>
                      </div>
                    </div>
                  </div>


                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {selectedCriteriaForHistory && (
        <CriteriaHistory
          criteriaId={selectedCriteriaForHistory.id}
          criteriaName={selectedCriteriaForHistory.criteria}
          history={currentVersion.history}
          isOpen={historyModalOpen}
          onClose={() => {
            setHistoryModalOpen(false);
            setSelectedCriteriaForHistory(null);
          }}
        />
      )}

      {reactFlowBranchOpen && (
        <ReactFlowBranchDiagram
          criteriaId={currentVersion.id}
          criteriaName={currentVersion.name}
          history={currentVersion.history}
          isOpen={reactFlowBranchOpen}
          onClose={() => {
            setReactFlowBranchOpen(false);
          }}
          onLoadVersion={handleLoadVersion}
        />
      )}

      {comparisonOpen && (
        <RubricComparison
          versions={mockVersions}
          isOpen={comparisonOpen}
          onClose={() => {
            setComparisonOpen(false);
          }}
        />
      )}


    </div>
  );
}
