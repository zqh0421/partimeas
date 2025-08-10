'use client';

import { useState, useMemo } from 'react';
import { RubricItem, RubricVersion } from '@/types';

interface EvaluationResult {
  id: string;
  rubricVersionId: string;
  testCaseId: string;
  input: string;
  context: string;
  scores: {
    [criteriaId: string]: number;
  };
  overallScore: number;
  feedback: string;
  evaluatedAt: Date;
  evaluator: string;
}

interface RubricComparisonProps {
  versions: RubricVersion[];
  evaluationResults?: EvaluationResult[];
  isOpen: boolean;
  onClose: () => void;
}

export default function RubricComparison({ 
  versions, 
  evaluationResults = [], 
  isOpen, 
  onClose 
}: RubricComparisonProps) {
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [comparisonMode, setComparisonMode] = useState<'versions' | 'results' | 'criteria'>('versions');
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [showDifferences, setShowDifferences] = useState(true);
  const [highlightChanges, setHighlightChanges] = useState(true);

  // Example evaluation results - replace with real data from your evaluation system
  const mockEvaluationResults = useMemo((): EvaluationResult[] => [
    {
      id: 'example-eval',
      rubricVersionId: '1',
      testCaseId: '1',
      input: 'Example test case input - replace with real data',
      context: 'Example context - replace with real data',
      scores: {
        '1': 4, // Example score
        '2': 3, // Example score
      },
      overallScore: 3.5,
      feedback: 'Example feedback - replace with real evaluation feedback',
      evaluatedAt: new Date(),
      evaluator: 'Example Evaluator'
    }
  ], []);

  const allResults = useMemo(() => [...evaluationResults, ...mockEvaluationResults], [evaluationResults, mockEvaluationResults]);

  const selectedVersionData = useMemo(() => {
    return versions.filter(v => selectedVersions.includes(v.id));
  }, [versions, selectedVersions]);

  const selectedResultData = useMemo(() => {
    return allResults.filter(r => selectedResults.includes(r.id));
  }, [allResults, selectedResults]);

  const getCriteriaDifferences = (version1: RubricVersion, version2: RubricVersion) => {
    const differences: {
      added: RubricItem[];
      removed: RubricItem[];
      modified: Array<{
        item: RubricItem;
        oldValue: string;
        newValue: string;
        field: string;
      }>;
    } = {
      added: [],
      removed: [],
      modified: []
    };

    // Find added criteria
    version2.rubricItems.forEach(item2 => {
      const exists = version1.rubricItems.find(item1 => item1.id === item2.id);
      if (!exists) {
        differences.added.push(item2);
      }
    });

    // Find removed criteria
    version1.rubricItems.forEach(item1 => {
      const exists = version2.rubricItems.find(item2 => item2.id === item1.id);
      if (!exists) {
        differences.removed.push(item1);
      }
    });

    // Find modified criteria
    version1.rubricItems.forEach(item1 => {
      const item2 = version2.rubricItems.find(item2 => item2.id === item1.id);
      if (item2) {
        if (item1.criteria !== item2.criteria) {
          differences.modified.push({
            item: item2,
            oldValue: item1.criteria,
            newValue: item2.criteria,
            field: 'criteria'
          });
        }
        if (item1.description !== item2.description) {
          differences.modified.push({
            item: item2,
            oldValue: item1.description,
            newValue: item2.description,
            field: 'description'
          });
        }
        if (item1.category !== item2.category) {
          differences.modified.push({
            item: item2,
            oldValue: item1.category,
            newValue: item2.category,
            field: 'category'
          });
        }
      }
    });

    return differences;
  };

  const getScoreComparison = (result1: EvaluationResult, result2: EvaluationResult) => {
    const allCriteriaIds = new Set([
      ...Object.keys(result1.scores),
      ...Object.keys(result2.scores)
    ]);

    const comparison: {
      criteriaId: string;
      score1: number;
      score2: number;
      difference: number;
      trend: 'improved' | 'declined' | 'unchanged';
    }[] = [];

    allCriteriaIds.forEach(criteriaId => {
      const score1 = result1.scores[criteriaId] || 0;
      const score2 = result2.scores[criteriaId] || 0;
      const difference = score2 - score1;
      
      comparison.push({
        criteriaId,
        score1,
        score2,
        difference,
        trend: difference > 0 ? 'improved' : difference < 0 ? 'declined' : 'unchanged'
      });
    });

    return comparison;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Rubric Comparison & Analysis</h2>
              <p className="text-sm text-gray-600">Compare versions, results, and criteria changes</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setComparisonMode('versions')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                comparisonMode === 'versions'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📋 Version Comparison
            </button>
            <button
              onClick={() => setComparisonMode('results')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                comparisonMode === 'results'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📊 Results Analysis
            </button>
            <button
              onClick={() => setComparisonMode('criteria')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                comparisonMode === 'criteria'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🔍 Criteria Changes
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {comparisonMode === 'versions' && (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Versions to Compare</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {versions.map(version => (
                    <div
                      key={version.id}
                      onClick={() => {
                        if (selectedVersions.includes(version.id)) {
                          setSelectedVersions(prev => prev.filter(id => id !== version.id));
                        } else if (selectedVersions.length < 3) {
                          setSelectedVersions(prev => [...prev, version.id]);
                        }
                      }}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedVersions.includes(version.id)
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{version.name}</span>
                        <span className="text-sm text-gray-500">{version.version}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {version.rubricItems.length} criteria • {version.testCases.length} test cases
                      </p>
                      <p className="text-xs text-gray-500">
                        Created: {new Date(version.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedVersionData.length >= 2 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Version Comparison</h3>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={showDifferences}
                          onChange={(e) => setShowDifferences(e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm">Show differences only</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={highlightChanges}
                          onChange={(e) => setHighlightChanges(e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm">Highlight changes</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {selectedVersionData.map((version) => (
                      <div key={version.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-gray-900">{version.name}</h4>
                          <span className="text-sm text-gray-500">{version.version}</span>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <h5 className="font-medium text-gray-700 mb-2">System Prompt</h5>
                            <div className="bg-white p-3 rounded border text-sm">
                              {version.systemPrompt.substring(0, 200)}...
                            </div>
                          </div>
                          
                          <div>
                            <h5 className="font-medium text-gray-700 mb-2">Evaluation Criteria</h5>
                            <div className="space-y-2">
                              {version.rubricItems.map(item => (
                                <div key={item.id} className="bg-white p-3 rounded border">
                                  <div className="font-medium text-sm">{item.criteria}</div>
                                  <div className="text-xs text-gray-600 mt-1">{item.description}</div>
                                  <div className="text-xs text-gray-500 mt-1">Category: {item.category}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedVersionData.length === 2 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-3">🔍 Differences Analysis</h4>
                      {(() => {
                        const differences = getCriteriaDifferences(selectedVersionData[0], selectedVersionData[1]);
                        return (
                          <div className="space-y-4">
                            {differences.added.length > 0 && (
                              <div>
                                <h5 className="font-medium text-green-700 mb-2">✅ Added Criteria ({differences.added.length})</h5>
                                <div className="space-y-2">
                                  {differences.added.map(item => (
                                    <div key={item.id} className="bg-green-100 p-2 rounded text-sm">
                                      <div className="font-medium">{item.criteria}</div>
                                      <div className="text-xs text-green-700">{item.description}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {differences.removed.length > 0 && (
                              <div>
                                <h5 className="font-medium text-red-700 mb-2">❌ Removed Criteria ({differences.removed.length})</h5>
                                <div className="space-y-2">
                                  {differences.removed.map(item => (
                                    <div key={item.id} className="bg-red-100 p-2 rounded text-sm">
                                      <div className="font-medium">{item.criteria}</div>
                                      <div className="text-xs text-red-700">{item.description}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {differences.modified.length > 0 && (
                              <div>
                                <h5 className="font-medium text-orange-700 mb-2">🔄 Modified Criteria ({differences.modified.length})</h5>
                                <div className="space-y-2">
                                  {differences.modified.map((mod) => (
                                    <div key={`${mod.item.id}-${mod.field}`} className="bg-orange-100 p-2 rounded text-sm">
                                      <div className="font-medium">{mod.item.criteria}</div>
                                      <div className="text-xs">
                                        <span className="text-red-600">- {mod.oldValue}</span>
                                        <br />
                                        <span className="text-green-600">+ {mod.newValue}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {differences.added.length === 0 && differences.removed.length === 0 && differences.modified.length === 0 && (
                              <div className="text-center text-gray-500 py-4">
                                No differences found between these versions
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {comparisonMode === 'results' && (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Results to Compare</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allResults.map(result => (
                    <div
                      key={result.id}
                      onClick={() => {
                        if (selectedResults.includes(result.id)) {
                          setSelectedResults(prev => prev.filter(id => id !== result.id));
                        } else if (selectedResults.length < 3) {
                          setSelectedResults(prev => [...prev, result.id]);
                        }
                      }}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedResults.includes(result.id)
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Evaluation {result.id}</span>
                        <span className="text-sm text-gray-500">Score: {result.overallScore}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {result.input.substring(0, 100)}...
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(result.evaluatedAt).toLocaleDateString()} • {result.evaluator}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedResultData.length >= 2 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Results Comparison</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {selectedResultData.map((result) => (
                      <div key={result.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-gray-900">Evaluation {result.id}</h4>
                          <span className="text-lg font-bold text-blue-600">{result.overallScore}</span>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <h5 className="font-medium text-gray-700 mb-2">Input</h5>
                            <div className="bg-white p-3 rounded border text-sm">
                              {result.input}
                            </div>
                          </div>
                          
                          <div>
                            <h5 className="font-medium text-gray-700 mb-2">Scores by Criteria</h5>
                            <div className="space-y-2">
                              {Object.entries(result.scores).map(([criteriaId, score]) => {
                                // Find the criteria item from the versions
                                const criteriaItem = versions
                                  .flatMap(v => v.rubricItems)
                                  .find(item => item.id === criteriaId);
                                
                                return (
                                  <div key={criteriaId} className="flex items-center justify-between bg-white p-2 rounded border">
                                    <span className="text-sm">
                                      {criteriaItem ? `${criteriaItem.category} - ${criteriaItem.criteria}` : `Criteria ${criteriaId}`}
                                    </span>
                                    <span className="font-medium">{score}/5</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          
                          <div>
                            <h5 className="font-medium text-gray-700 mb-2">Feedback</h5>
                            <div className="bg-white p-3 rounded border text-sm">
                              {result.feedback}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedResultData.length === 2 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-3">📊 Score Comparison</h4>
                      {(() => {
                        const comparison = getScoreComparison(selectedResultData[0], selectedResultData[1]);
                        return (
                          <div className="space-y-3">
                            {comparison.map(item => {
                              // Find the criteria item from the versions
                              const criteriaItem = versions
                                .flatMap(v => v.rubricItems)
                                .find(criteria => criteria.id === item.criteriaId);
                              
                              return (
                                <div key={item.criteriaId} className="flex items-center justify-between bg-white p-3 rounded border">
                                  <span className="text-sm">
                                    {criteriaItem ? `${criteriaItem.category} - ${criteriaItem.criteria}` : `Criteria ${item.criteriaId}`}
                                  </span>
                                  <div className="flex items-center space-x-4">
                                    <span className="text-sm">{item.score1} → {item.score2}</span>
                                    <span className={`text-sm font-medium ${
                                      item.trend === 'improved' ? 'text-green-600' :
                                      item.trend === 'declined' ? 'text-red-600' : 'text-gray-600'
                                    }`}>
                                      {item.trend === 'improved' ? '↗' : item.trend === 'declined' ? '↘' : '→'} {item.difference}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                            
                            <div className="border-t pt-3">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">Overall Score</span>
                                <div className="flex items-center space-x-4">
                                  <span className="text-sm">
                                    {selectedResultData[0].overallScore} → {selectedResultData[1].overallScore}
                                  </span>
                                  <span className={`text-sm font-medium ${
                                    selectedResultData[1].overallScore > selectedResultData[0].overallScore ? 'text-green-600' :
                                    selectedResultData[1].overallScore < selectedResultData[0].overallScore ? 'text-red-600' : 'text-gray-600'
                                  }`}>
                                    {selectedResultData[1].overallScore > selectedResultData[0].overallScore ? '↗' :
                                     selectedResultData[1].overallScore < selectedResultData[0].overallScore ? '↘' : '→'}
                                    {(selectedResultData[1].overallScore - selectedResultData[0].overallScore).toFixed(1)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {comparisonMode === 'criteria' && (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Criteria Evolution Analysis</h3>
                <p className="text-gray-600 mb-4">
                  Track how criteria have evolved across different versions and see the impact on evaluation results.
                </p>
              </div>

              <div className="space-y-6">
                <div className="bg-white border rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">📈 Criteria Evolution Timeline</h4>
                  <div className="space-y-4">
                    {versions.map((version) => (
                      <div key={version.id} className="border-l-4 border-blue-500 pl-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900">{version.name} ({version.version})</h5>
                          <span className="text-sm text-gray-500">
                            {new Date(version.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {version.rubricItems.length} criteria across {new Set(version.rubricItems.map(item => item.category)).size} categories
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {version.rubricItems.map(item => (
                            <div key={item.id} className="bg-gray-50 p-2 rounded text-xs">
                              <div className="font-medium">{item.criteria}</div>
                              <div className="text-gray-500">{item.category}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">🎯 Category Distribution</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from(new Set(versions.flatMap(v => v.rubricItems.map(item => item.category)))).map(category => (
                      <div key={category} className="bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-2">{category}</h5>
                        <div className="space-y-2">
                          {versions.map(version => {
                            const count = version.rubricItems.filter(item => item.category === category).length;
                            return count > 0 ? (
                              <div key={version.id} className="flex items-center justify-between text-sm">
                                <span>{version.version}</span>
                                <span className="font-medium">{count}</span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">📊 Impact Analysis</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-3">Average Scores by Version</h5>
                      <div className="space-y-2">
                        {versions.map(version => {
                          const versionResults = allResults.filter(r => r.rubricVersionId === version.id);
                          const avgScore = versionResults.length > 0 
                            ? versionResults.reduce((sum, r) => sum + r.overallScore, 0) / versionResults.length
                            : 0;
                          return (
                            <div key={version.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <span className="text-sm">{version.version}</span>
                              <span className="font-medium">{avgScore.toFixed(1)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-700 mb-3">Criteria Count Trends</h5>
                      <div className="space-y-2">
                        {versions.map(version => (
                          <div key={version.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <span className="text-sm">{version.version}</span>
                            <span className="font-medium">{version.rubricItems.length}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {comparisonMode === 'versions' && `Selected ${selectedVersions.length} versions`}
              {comparisonMode === 'results' && `Selected ${selectedResults.length} results`}
              {comparisonMode === 'criteria' && `Analyzing ${versions.length} versions`}
            </div>
            <div className="flex space-x-4 text-xs text-gray-500">
              <span>📋 Version Comparison</span>
              <span>📊 Results Analysis</span>
              <span>🔍 Criteria Changes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 