"use client";

import React, { useState, useMemo } from "react";
import { RubricVersion } from "@/types";

interface ResultsComparisonCardProps {
  currentVersion: RubricVersion;
  setCurrentVersion: (version: RubricVersion | ((prev: RubricVersion) => RubricVersion)) => void;
}

interface EvaluationResult {
  id: string;
  testCaseInput: string;
  llmResponse: string;
  scores: Record<string, number>;
  overallScore: number;
  feedback: string;
  evaluatedAt: Date;
  evaluator: string;
  modelName?: string; // Add model name for comparison
  criteriaVersion?: string; // Add criteria version for comparison
}

export default function ResultsComparisonCard({
  currentVersion,
}: ResultsComparisonCardProps) {
  const [isComparisonCardExpanded, setIsComparisonCardExpanded] = useState(true);
  const [expandedCriteria, setExpandedCriteria] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState({
    analysis: true,
    directMode: true,
    batchMode: true,
    consistency: true,
    sideBySide: false,
    qualityAssessment: false,
  });

  // Filtering and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCriteria, setSelectedCriteria] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedCriteriaVersion, setSelectedCriteriaVersion] = useState<string>('');
  const [showFilteredResults, setShowFilteredResults] = useState(false);
  
  // Comparison mode state
  const [comparisonMode, setComparisonMode] = useState<'models' | 'criteria'>('models');

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Example evaluation results - replace with real data from your evaluation system
  const mockEvaluationResults = useMemo((): EvaluationResult[] => [
    {
      id: 'example-eval',
      testCaseInput: 'Example test case input - replace with real data',
      llmResponse: 'Example LLM response - replace with real evaluation results',
      scores: {
        '1': 4, // Example score
        '2': 3, // Example score
      },
      overallScore: 3.5,
      feedback: 'Example feedback - replace with real evaluation feedback',
      evaluatedAt: new Date(),
      evaluator: 'Example Evaluator',
      modelName: 'Example Model',
      criteriaVersion: 'v1.0'
    }
  ], []);

  // Filter results based on search and criteria
  const filteredResults = useMemo(() => {
    return mockEvaluationResults.filter(result => {
      const matchesSearch = searchTerm === '' || 
        result.testCaseInput.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.llmResponse.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.feedback.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (result.modelName && result.modelName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCriteria = selectedCriteria === '' || 
        (result.scores && result.scores[selectedCriteria] !== undefined);
      
      const matchesModel = selectedModel === '' || 
        (result.modelName && result.modelName === selectedModel);
      
      const matchesCriteriaVersion = selectedCriteriaVersion === '' || 
        (result.criteriaVersion && result.criteriaVersion === selectedCriteriaVersion);
      
      return matchesSearch && matchesCriteria && matchesModel && matchesCriteriaVersion;
    });
  }, [mockEvaluationResults, searchTerm, selectedCriteria, selectedModel, selectedCriteriaVersion]);

  // Get available models and criteria versions for filtering
  const availableModels = useMemo(() => {
    const models = new Set<string>();
    mockEvaluationResults.forEach(result => {
      if (result.modelName) models.add(result.modelName);
    });
    return Array.from(models);
  }, [mockEvaluationResults]);

  const availableCriteriaVersions = useMemo(() => {
    const versions = new Set<string>();
    mockEvaluationResults.forEach(result => {
      if (result.criteriaVersion) versions.add(result.criteriaVersion);
    });
    return Array.from(versions);
  }, [mockEvaluationResults]);

  // Get available criteria for filtering
  const availableCriteria = useMemo(() => {
    const criteria = new Set<string>();
    mockEvaluationResults.forEach(result => {
      Object.keys(result.scores).forEach(criterion => criteria.add(criterion));
    });
    return Array.from(criteria);
  }, [mockEvaluationResults]);

  // Calculate summary statistics for filtered results
  const summaryStats = useMemo(() => {
    const totalEvaluations = filteredResults.length;
    const averageScore = totalEvaluations > 0 
      ? filteredResults.reduce((sum, result) => sum + result.overallScore, 0) / totalEvaluations 
      : 0;
    const highScores = filteredResults.filter(result => result.overallScore >= 4).length;

    return { totalEvaluations, averageScore, highScores };
  }, [filteredResults]);

  // Mock reasoning for criteria scores
  const getCriteriaReasoning = (criteriaId: string) => {
    switch (criteriaId) {
      case '1':
        return 'The LLM accurately identifies the theoretical foundation of the request (Polyvagal Theory, Neurosequential Model).';
      case '2':
        return 'The LLM demonstrates a strong understanding of safety and ethics, particularly in relation to trauma sensitivity and child-centered approaches.';
      case '3':
        return 'The LLM provides practical, classroom-appropriate strategies for application, such as co-regulation, peer problem-solving, and emotional repair.';
      case '4':
        return 'The LLM effectively assesses and observes the child\'s needs and behaviors, including their history and current context.';
      case '5':
        return 'The LLM communicates clearly and collaboratively, using language that is both professional and accessible.';
      case '6':
        return 'The LLM demonstrates ongoing professional development and a commitment to continuous learning in trauma-informed practices.';
      default:
        return 'No specific reasoning provided.';
    }
  };

  const toggleCriteriaExpansion = (criteriaId: string) => {
    setExpandedCriteria(prev => {
      const newSet = new Set(prev);
      if (newSet.has(criteriaId)) {
        newSet.delete(criteriaId);
      } else {
        newSet.add(criteriaId);
      }
      return newSet;
    });
  };

  const isCriteriaExpanded = (criteriaId: string) => expandedCriteria.has(criteriaId);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              📊 Results Comparison
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsComparisonCardExpanded(!isComparisonCardExpanded)}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
            >
              {isComparisonCardExpanded ? "▼" : "▶"}
            </button>
          </div>
        </div>
      </div>

      {isComparisonCardExpanded && (
        <div className="p-4 sm:p-6">
          <div className="space-y-6">

            {/* Output Analysis Tools Section */}
            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-200">
                  <button
                    onClick={() => toggleSection("analysis")}
                    className="flex justify-between items-center w-full text-left"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">
                      🔍 Output Analysis Tools
                    </h3>
                    <span className="text-gray-500">
                      {expandedSections.analysis ? "▼" : "▶"}
                    </span>
                  </button>
                </div>
                {expandedSections.analysis && (
                  <div className="p-4">
                    {/* Direct Mode Selection */}
                    <div className="mb-6">
                      <div className="bg-gray-50 rounded-lg border border-gray-200">
                        <div className="px-4 py-3 border-b border-gray-200">
                          <button
                            onClick={() => toggleSection("directMode")}
                            className="flex justify-between items-center w-full text-left"
                          >
                            <h4 className="font-semibold text-gray-900">🎯 Direct Mode</h4>
                            <span className="text-gray-500">
                              {expandedSections.directMode ? "▼" : "▶"}
                            </span>
                          </button>
                        </div>
                        {expandedSections.directMode && (
                          <div className="p-4">
                            <p className="text-sm text-gray-600 mb-4">
                              [Start by selecting test cases and/or models and then run the evaluation on a certain criteria version.]
                            </p>
                            <p className="text-sm text-gray-600 mb-4">
                              Run analysis tools directly on selected test cases for immediate results.
                            </p>
                            
                            {/* Output Filtering & Search - Moved into Direct Mode */}
                            <div className="mb-6">
                              <h4 className="font-semibold text-gray-900 mb-4">🔍 Output Filtering & Search</h4>
                              <div className="space-y-3">
                                <div className="flex space-x-2">
                                  <input
                                    type="text"
                                    placeholder="Search outputs..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                                  />
                                  <select 
                                    value={selectedCriteria}
                                    onChange={(e) => setSelectedCriteria(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                                  >
                                    <option value="">All Criteria</option>
                                    {availableCriteria.map(criterion => (
                                      <option key={criterion} value={criterion}>Criteria {criterion}</option>
                                    ))}
                                  </select>
                                  <select 
                                    value={selectedModel}
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                                  >
                                    <option value="">All Models</option>
                                    {availableModels.map(model => (
                                      <option key={model} value={model}>{model}</option>
                                    ))}
                                  </select>
                                  <select 
                                    value={selectedCriteriaVersion}
                                    onChange={(e) => setSelectedCriteriaVersion(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                                  >
                                    <option value="">All Versions</option>
                                    {availableCriteriaVersions.map(version => (
                                      <option key={version} value={version}>{version}</option>
                                    ))}
                                  </select>
                                  <button 
                                    onClick={() => setShowFilteredResults(!showFilteredResults)}
                                    className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                                  >
                                    {showFilteredResults ? 'Hide' : 'Show'} Results
                                  </button>
                                </div>
                              </div>
                            </div>

                                                {/* Summary Statistics */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-4">📊 Summary Statistics</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{summaryStats.totalEvaluations}</div>
                          <div className="text-sm text-blue-700">Total Evaluations</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{summaryStats.averageScore.toFixed(1)}</div>
                          <div className="text-sm text-green-700">Average Score</div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{summaryStats.highScores}</div>
                          <div className="text-sm text-purple-700">High Scores (≥4)</div>
                        </div>
                      </div>
                    </div>

                    {/* Test Case Results */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-4">📋 Test Case Results</h4>
                      <div className="space-y-4">
                        {filteredResults.map((result, index) => (
                          <div key={result.id} className="bg-white border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h5 className="font-medium text-gray-900">Test Case {index + 1}</h5>
                                <p className="text-sm text-gray-500">
                                  {new Date(result.evaluatedAt).toLocaleDateString()} • {result.evaluator}
                                  {result.modelName && ` • ${result.modelName}`}
                                  {result.criteriaVersion && ` • ${result.criteriaVersion}`}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-blue-600">{result.overallScore.toFixed(1)}</div>
                                <div className="text-xs text-gray-500">Overall Score</div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                              <div>
                                <h6 className="font-medium text-gray-700 mb-2">Input</h6>
                                <div className="bg-gray-50 p-3 rounded text-sm">
                                  {result.testCaseInput}
                                </div>
                              </div>
                              <div>
                                <h6 className="font-medium text-gray-700 mb-2">LLM Response</h6>
                                <div className="bg-gray-50 p-3 rounded text-sm">
                                  {result.llmResponse}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h6 className="font-medium text-gray-700 mb-2">Evaluation Summary</h6>
                                <div className="bg-gray-50 p-3 rounded text-sm">
                                  {result.feedback}
                                </div>
                              </div>
                              <div>
                                <h6 className="font-medium text-gray-700 mb-2">Criteria Scores</h6>
                                <div className="bg-white border rounded-lg overflow-hidden">
                                  <table className="w-full">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Criteria</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">Score</th>
                                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-700">Details</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                                                            {Object.entries(result.scores).map(([criteriaId, score]) => (
                                        <React.Fragment key={criteriaId}>
                                          <tr 
                                            className="border-t border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer group"
                                          >
                                            <td className="px-3 py-2 text-sm text-gray-900">
                                            {(() => {
                                              const criteriaItem = currentVersion.rubricItems.find(item => item.id === criteriaId);
                                              return criteriaItem ? `${criteriaItem.category} - ${criteriaItem.criteria}` : `Criteria ${criteriaId}`;
                                            })()}
                                          </td>
                                            <td className="px-3 py-2 text-sm font-medium text-right">
                                              {score}/5
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                              <button
                                                onClick={() => toggleCriteriaExpansion(criteriaId)}
                                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mx-auto"
                                              >
                                                {isCriteriaExpanded(criteriaId) ? "Hide" : "Show"}
                                                <span className="text-xs">
                                                  {isCriteriaExpanded(criteriaId) ? "▼" : "▶"}
                                                </span>
                                              </button>
                                            </td>
                                          </tr>
                                          {isCriteriaExpanded(criteriaId) && (
                                            <tr className="bg-gray-50">
                                              <td colSpan={3} className="px-3 py-2">
                                                <div className="text-xs text-gray-700 bg-white p-2 rounded border">
                                                  <div className="mb-2">
                                                    <strong>Description:</strong> {(() => {
                                                      const criteriaItem = currentVersion.rubricItems.find(item => item.id === criteriaId);
                                                      return criteriaItem ? criteriaItem.description : getCriteriaReasoning(criteriaId);
                                                    })()}
                                                  </div>
                                                  <div className="border-t pt-2">
                                                    <strong>Scoring Reasoning:</strong> {getCriteriaReasoning(criteriaId)}
                                                  </div>
                                                </div>
                                              </td>
                                            </tr>
                                          )}
                                        </React.Fragment>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Comparison Mode Selection */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-4">🔄 Comparison Mode</h4>
                      <div className="flex space-x-4">
                        <button
                          onClick={() => setComparisonMode('models')}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            comparisonMode === 'models'
                              ? 'bg-blue-600 text-white shadow-lg'
                              : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                          }`}
                        >
                          📊 Model Comparison
                        </button>
                        
                        <button
                          onClick={() => setComparisonMode('criteria')}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            comparisonMode === 'criteria'
                              ? 'bg-green-600 text-white shadow-lg'
                              : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-600'
                          }`}
                        >
                          📋 Criteria Comparison
                        </button>
                      </div>
                    </div>

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