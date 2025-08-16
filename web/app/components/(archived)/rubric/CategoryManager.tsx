"use client";

import { useEffect } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { useCategoryOrder } from "@/app/hooks/useCategoryOrder";

interface Category {
  id: string;
  name: string;
  order: number;
  subCriteria: SubCriteria[];
}

interface SubCriteria {
  id: string;
  name: string;
  description: string;
  categoryId: string;
}

interface CategoryManagerProps {
  categories: Category[];
  onCategoriesChange: (categories: Category[]) => void;
}

export default function CategoryManager({
  categories,
  onCategoriesChange,
}: CategoryManagerProps) {
  const {
    categories: orderedCategories,
    reorderCategories,
    updateSubCriteria,
    addSubCriteria,
    removeSubCriteria,
  } = useCategoryOrder(categories);

  // Notify parent component when categories change
  useEffect(() => {
    onCategoriesChange(orderedCategories);
  }, [orderedCategories, onCategoriesChange]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    reorderCategories(result.source.index, result.destination.index);
  };

  const handleSubCriteriaChange = (
    categoryId: string,
    subCriteriaId: string,
    field: keyof SubCriteria,
    value: string
  ) => {
    updateSubCriteria(categoryId, subCriteriaId, { [field]: value });
  };

  const handleAddSubCriteria = (categoryId: string) => {
    const newSubCriteria: SubCriteria = {
      id: `sub_${Date.now()}`,
      name: "",
      description: "",
      categoryId,
    };
    addSubCriteria(categoryId, newSubCriteria);
  };

  const handleRemoveSubCriteria = (
    categoryId: string,
    subCriteriaId: string
  ) => {
    removeSubCriteria(categoryId, subCriteriaId);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">
        Categories & Sub Criteria
      </h3>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="categories">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4"
            >
              {orderedCategories.map((category, index) => (
                <Draggable
                  key={category.id}
                  draggableId={category.id}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`border border-gray-200 rounded-lg p-4 ${
                        snapshot.isDragging
                          ? "shadow-lg bg-blue-50"
                          : "bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div
                          {...provided.dragHandleProps}
                          className="flex items-center space-x-2 cursor-move"
                        >
                          <span className="text-gray-400">⋮⋮</span>
                          <h4 className="text-lg font-medium text-gray-900">
                            {category.name}
                          </h4>
                        </div>
                        <button
                          onClick={() => handleAddSubCriteria(category.id)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Add Sub Criteria
                        </button>
                      </div>

                      <div className="space-y-3">
                        {category.subCriteria.map((subCriteria) => (
                          <div
                            key={subCriteria.id}
                            className="border border-gray-200 rounded p-3 bg-gray-50"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-gray-900">
                                Sub Criteria
                              </h5>
                              <button
                                onClick={() =>
                                  handleRemoveSubCriteria(
                                    category.id,
                                    subCriteria.id
                                  )
                                }
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Remove
                              </button>
                            </div>

                            <div className="space-y-2">
                              <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Sub criteria name"
                                value={subCriteria.name}
                                onChange={(e) =>
                                  handleSubCriteriaChange(
                                    category.id,
                                    subCriteria.id,
                                    "name",
                                    e.target.value
                                  )
                                }
                              />

                              <textarea
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Description"
                                value={subCriteria.description}
                                onChange={(e) =>
                                  handleSubCriteriaChange(
                                    category.id,
                                    subCriteria.id,
                                    "description",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
