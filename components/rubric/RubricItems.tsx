'use client';

import { useState } from 'react';

interface RubricItem {
  id: number;
  criteria: string;
  description: string;
  score: number;
}

interface RubricItemsProps {
  rubricData: any;
  setRubricData: (data: any) => void;
}

export default function RubricItems({ rubricData, setRubricData }: RubricItemsProps) {
  const [items, setItems] = useState<RubricItem[]>(rubricData.rubricItems);

  const handleItemChange = (id: number, field: keyof RubricItem, value: string | number) => {
    const updatedItems = items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    );
    setItems(updatedItems);
  };

  const handleSave = () => {
    setRubricData({
      ...rubricData,
      rubricItems: items
    });
  };

  const exampleCriteria = [
    {
      score: 1,
      criteria: "Poor",
      description: "Fails to meet basic requirements, contains significant errors or omissions"
    },
    {
      score: 2,
      criteria: "Below Average",
      description: "Meets some requirements but has notable deficiencies or errors"
    },
    {
      score: 3,
      criteria: "Average",
      description: "Meets basic requirements with minor issues or room for improvement"
    },
    {
      score: 4,
      criteria: "Good",
      description: "Exceeds basic requirements with few minor issues"
    },
    {
      score: 5,
      criteria: "Excellent",
      description: "Exceeds expectations with high quality and thoroughness"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Rubric Items (1-5 Scale)</h2>
        <p className="text-gray-600 mb-6">
          Define the criteria and descriptions for each score level in your rubric.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Score {item.score}
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {item.score}/5
                </span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Criteria Label
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Poor, Below Average, Average, Good, Excellent"
                    value={item.criteria}
                    onChange={(e) => handleItemChange(item.id, 'criteria', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe what this score level represents..."
                    value={item.description}
                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
          
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Save Rubric Items
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Example Criteria</h3>
          <div className="space-y-3">
            {exampleCriteria.map((example) => (
              <div
                key={example.score}
                className="p-3 border border-gray-200 rounded-md hover:border-blue-300 cursor-pointer"
                onClick={() => {
                  const updatedItems = items.map(item =>
                    item.score === example.score
                      ? { ...item, criteria: example.criteria, description: example.description }
                      : item
                  );
                  setItems(updatedItems);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">Score {example.score}</h4>
                  <span className="text-sm text-gray-500">{example.criteria}</span>
                </div>
                <p className="text-sm text-gray-600">{example.description}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h4 className="text-sm font-medium text-yellow-900 mb-2">Tips</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Make criteria descriptions specific and measurable</li>
              <li>• Ensure clear progression between score levels</li>
              <li>• Include both positive and negative indicators</li>
              <li>• Consider the context of your evaluation domain</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 