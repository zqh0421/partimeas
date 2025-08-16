'use client';

import { useState } from 'react';
import MultiLevelSelector from '@/components/MultiLevelSelector';
import { TestCase } from '@/types';
import { selectionCache, clearAllSelectionCaches } from '@/utils/selectionCache';

export default function TestCachePage() {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [selections, setSelections] = useState<any[]>([]);
  const [cacheStats, setCacheStats] = useState<any>(null);

  const handleSelectionChange = (newSelections: any[]) => {
    setSelections(newSelections);
    console.log('Selections changed:', newSelections);
  };

  const handleDataLoaded = (newTestCases: TestCase[]) => {
    setTestCases(newTestCases);
    console.log('Test cases loaded:', newTestCases.length);
  };

  const handleError = (error: string) => {
    console.error('Error:', error);
  };

  const updateCacheStats = () => {
    setCacheStats(selectionCache.getCacheStats());
  };

  const handleClearAllCaches = () => {
    clearAllSelectionCaches();
    updateCacheStats();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Cache Test Page</h1>
      
      {/* Cache Management */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <h2 className="text-lg font-semibold mb-4">Cache Management</h2>
        <div className="flex space-x-4 mb-4">
          <button
            onClick={updateCacheStats}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Update Cache Stats
          </button>
          <button
            onClick={handleClearAllCaches}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Clear All Caches
          </button>
        </div>
        
        {cacheStats && (
          <div className="bg-gray-50 p-3 rounded">
            <h3 className="font-medium mb-2">Cache Statistics:</h3>
            <pre className="text-sm">{JSON.stringify(cacheStats, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* Multi-Level Selector */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <h2 className="text-lg font-semibold mb-4">Multi-Level Selector</h2>
        <MultiLevelSelector
          onSelectionChange={handleSelectionChange}
          onDataLoaded={handleDataLoaded}
          onError={handleError}
        />
      </div>

      {/* Current State Display */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <h2 className="text-lg font-semibold mb-4">Current State</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Selections:</h3>
            <pre className="text-sm bg-gray-50 p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(selections, null, 2)}
            </pre>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Test Cases ({testCases.length}):</h3>
            <div className="text-sm bg-gray-50 p-2 rounded overflow-auto max-h-40">
              {testCases.length > 0 ? (
                testCases.map((tc, index) => (
                  <div key={tc.id} className="mb-2 p-2 bg-white rounded border">
                    <div className="font-medium">TC {index + 1}: {tc.id}</div>
                    <div className="text-gray-600 truncate">{tc.input}</div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500">No test cases selected</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h2 className="text-lg font-semibold mb-2 text-blue-900">Testing Instructions</h2>
        <ol className="list-decimal list-inside space-y-1 text-blue-800">
          <li>Select some test cases using the multi-level selector</li>
          <li>Expand/collapse use cases to test expansion state caching</li>
          <li>Refresh the page to test cache restoration</li>
          <li>Use the cache management buttons to test cache operations</li>
          <li>Check the console for cache operation logs</li>
        </ol>
      </div>
    </div>
  );
} 