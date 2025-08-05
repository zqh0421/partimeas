'use client';

import { useState } from 'react';
import CategoryManager from './CategoryManager';

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

export default function CategoryDemo() {
  const [categories, setCategories] = useState<Category[]>([
    {
      id: 'cat1',
      name: 'Code Quality',
      order: 1,
      subCriteria: [
        {
          id: 'sub1',
          name: 'Code Readability',
          description: 'Code is easy to read and understand',
          categoryId: 'cat1'
        },
        {
          id: 'sub2',
          name: 'Code Efficiency',
          description: 'Code performs well and uses resources efficiently',
          categoryId: 'cat1'
        }
      ]
    },
    {
      id: 'cat2',
      name: 'Documentation',
      order: 2,
      subCriteria: [
        {
          id: 'sub3',
          name: 'Code Comments',
          description: 'Code has appropriate comments explaining complex logic',
          categoryId: 'cat2'
        }
      ]
    },
    {
      id: 'cat3',
      name: 'Testing',
      order: 3,
      subCriteria: [
        {
          id: 'sub4',
          name: 'Test Coverage',
          description: 'Code has adequate test coverage',
          categoryId: 'cat3'
        },
        {
          id: 'sub5',
          name: 'Test Quality',
          description: 'Tests are well-written and meaningful',
          categoryId: 'cat3'
        }
      ]
    }
  ]);

  const handleCategoriesChange = (newCategories: Category[]) => {
    setCategories(newCategories);
    console.log('Categories updated:', newCategories);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Category Manager Demo
        </h1>
        <p className="text-gray-600">
          Drag categories to reorder them. The order will persist even when you modify sub criteria.
        </p>
      </div>

      <CategoryManager 
        categories={categories} 
        onCategoriesChange={handleCategoriesChange} 
      />

      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Current Category Order</h3>
        <div className="space-y-2">
          {categories.map((category, index) => (
            <div key={category.id} className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">{index + 1}.</span>
              <span className="font-medium">{category.name}</span>
              <span className="text-sm text-gray-500">
                ({category.subCriteria.length} sub criteria)
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Key Features</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Category order persists in localStorage</li>
          <li>• Modifying sub criteria doesn't affect category order</li>
          <li>• Drag and drop reordering with visual feedback</li>
          <li>• Add/remove sub criteria within categories</li>
          <li>• Real-time updates with proper state management</li>
        </ul>
      </div>
    </div>
  );
} 