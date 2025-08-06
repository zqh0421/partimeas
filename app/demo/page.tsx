'use client';

import { useState } from 'react';
import ReactFlowBranchDiagram from '../../components/rubric/ReactFlowBranchDiagram';
import { mockHistoryData } from '../../data/mockHistoryData';

export default function DemoPage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">ReactFlow Branch Diagram Demo</h1>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Version History Visualization</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-gray-600 mb-2">
                This demo shows the ReactFlow branch diagram with smart branching logic.
              </p>
              <p className="text-sm text-gray-500">
                Features: Multiple branches, color-coded edges, branch labels, and merge states.
              </p>
            </div>
            
            <button
              onClick={() => setIsOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              🚀 Open Version History
            </button>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Branch Structure:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Main Branch: All major modifications</li>
                <li>• Safety Branch: Safety, training, quality assurance</li>
                <li>• Tech Branch: Communication, technology, timeline</li>
                <li>• Assessment Branch: Categories, metrics, documentation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <ReactFlowBranchDiagram
        criteriaId="demo-criteria"
        criteriaName="Child Development Assessment Framework"
        history={mockHistoryData}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
} 