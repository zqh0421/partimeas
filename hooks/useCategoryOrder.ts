import { useState, useEffect, useCallback } from 'react';

interface Category {
  id: string;
  name: string;
  order: number;
  subCriteria: any[];
}

export function useCategoryOrder(initialCategories: Category[]) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);

  // Initialize category order from localStorage or use default order
  useEffect(() => {
    const savedOrder = localStorage.getItem('categoryOrder');
    if (savedOrder) {
      const orderArray = JSON.parse(savedOrder);
      const ordered = orderArray.map((id: string) => 
        initialCategories.find(cat => cat.id === id)
      ).filter(Boolean) as Category[];
      
      // Add any new categories that weren't in the saved order
      const newCategories = initialCategories.filter(cat => 
        !orderArray.includes(cat.id)
      );
      
      const finalOrder = [...ordered, ...newCategories];
      setCategories(finalOrder);
      setCategoryOrder([...orderArray, ...newCategories.map(cat => cat.id)]);
    } else {
      setCategories(initialCategories);
      setCategoryOrder(initialCategories.map(cat => cat.id));
    }
  }, [initialCategories]);

  // Save category order to localStorage whenever it changes
  useEffect(() => {
    if (categoryOrder.length > 0) {
      localStorage.setItem('categoryOrder', JSON.stringify(categoryOrder));
    }
  }, [categoryOrder]);

  const reorderCategories = useCallback((sourceIndex: number, destinationIndex: number) => {
    const items = Array.from(categories);
    const [reorderedItem] = items.splice(sourceIndex, 1);
    items.splice(destinationIndex, 0, reorderedItem);

    setCategories(items);
    setCategoryOrder(items.map(item => item.id));
  }, [categories]);

  const updateCategory = useCallback((categoryId: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, ...updates } : cat
    ));
  }, []);

  const updateSubCriteria = useCallback((categoryId: string, subCriteriaId: string, updates: any) => {
    setCategories(prev => prev.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          subCriteria: category.subCriteria.map(sub => 
            sub.id === subCriteriaId 
              ? { ...sub, ...updates }
              : sub
          )
        };
      }
      return category;
    }));
  }, []);

  const addSubCriteria = useCallback((categoryId: string, newSubCriteria: any) => {
    setCategories(prev => prev.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          subCriteria: [...category.subCriteria, newSubCriteria]
        };
      }
      return category;
    }));
  }, []);

  const removeSubCriteria = useCallback((categoryId: string, subCriteriaId: string) => {
    setCategories(prev => prev.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          subCriteria: category.subCriteria.filter(sub => sub.id !== subCriteriaId)
        };
      }
      return category;
    }));
  }, []);

  return {
    categories,
    categoryOrder,
    reorderCategories,
    updateCategory,
    updateSubCriteria,
    addSubCriteria,
    removeSubCriteria
  };
} 