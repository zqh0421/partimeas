import React, { useState } from 'react';
import { ModelOutput, RubricStructure, EXAMPLE_RUBRIC_STRUCTURE } from '@/types';

interface EvaluationTableProps {
  modelOutputs: ModelOutput[];
  rubricStructure?: RubricStructure;
  showExamples?: boolean;
}

const EvaluationTable: React.FC<EvaluationTableProps> = ({
  modelOutputs,
  rubricStructure = EXAMPLE_RUBRIC_STRUCTURE,
  showExamples = false
}) => {
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set());
  const [expandedCriteria, setExpandedCriteria] = useState<Set<string>>(new Set());

  const toggleComponent = (componentId: string) => {
    setExpandedComponents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(componentId)) {
        newSet.delete(componentId);
      } else {
        newSet.add(componentId);
      }
      return newSet;
    });
  };

  const toggleCriteria = (criteriaId: string) => {
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

  const getScoreColor = (score: number, maxScore: number = 5) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getScoreDisplay = (modelOutput: ModelOutput, criteriaId: string) => {
    if (!modelOutput.rubricScores || !modelOutput.rubricScores[criteriaId]) {
      return { score: '-', color: 'bg-gray-100 text-gray-500 border-gray-200' };
    }
    
    const score = modelOutput.rubricScores[criteriaId];
    return {
      score: score.toString(),
      color: getScoreColor(score)
    };
  };

  const calculateOverallScore = (modelOutput: ModelOutput) => {
    if (!modelOutput.rubricScores || Object.keys(modelOutput.rubricScores).length === 0) {
      return { score: 0, maxScore: 5, percentage: 0 };
    }
    
    const scores = Object.values(modelOutput.rubricScores);
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const maxScore = 5;
    const percentage = (average / maxScore) * 100;
    
    return { score: average, maxScore, percentage };
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      {/* Table Header */}
      <div className="bg-gray-50 border-b border-slate-200 px-4 py-3">
        <h3 className="text-lg font-medium text-gray-900">Evaluation Comparison Table</h3>
        <p className="text-sm text-gray-600 mt-1">
          Compare rubric scores across all model responses
        </p>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-700 min-w-[200px]">
                Rubric Criteria
              </th>
              {modelOutputs.map((modelOutput, index) => (
                <th key={modelOutput.modelId} className="text-center px-4 py-3 text-sm font-medium text-gray-700 min-w-[120px]">
                  <div className="flex flex-col items-center space-y-1">
                    <span className="font-semibold">Response {index + 1}</span>
                    <span className="text-xs text-gray-500 font-normal">
                      {modelOutput.modelId}
                    </span>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800`}>
                      {calculateOverallScore(modelOutput).score.toFixed(1)}/{calculateOverallScore(modelOutput).maxScore}
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rubricStructure.responseComponents.map((component) => (
              <React.Fragment key={component.id}>
                {/* Component Header Row */}
                <tr className="bg-blue-50 hover:bg-blue-100">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleComponent(component.id)}
                      className="flex items-center space-x-2 text-left w-full hover:text-blue-700 transition-colors"
                    >
                      <span className={`transform transition-transform duration-200 text-blue-500 ${
                        expandedComponents.has(component.id) ? 'rotate-90' : ''
                      }`}>
                        ▶
                      </span>
                      <span className="font-semibold text-blue-900">{component.name}</span>
                      <span className="text-sm text-blue-600">({component.criteria.length} criteria)</span>
                    </button>
                  </td>
                  {modelOutputs.map((modelOutput) => (
                    <td key={modelOutput.modelId} className="px-4 py-3 text-center">
                      <div className="text-sm text-blue-600 font-medium">
                        Component Score
                      </div>
                    </td>
                  ))}
                </tr>
                
                {/* Criteria Rows */}
                {expandedComponents.has(component.id) && component.criteria.map((criteria) => (
                  <React.Fragment key={criteria.id}>
                    <tr className="bg-gray-50 hover:bg-gray-100">
                      <td className="px-4 py-3 pl-8">
                        <button
                          onClick={() => toggleCriteria(criteria.id)}
                          className="flex items-center space-x-2 text-left w-full hover:text-gray-700 transition-colors"
                        >
                          <span className={`transform transition-transform duration-200 text-gray-500 ${
                            expandedCriteria.has(criteria.id) ? 'rotate-90' : ''
                          }`}>
                            ▶
                          </span>
                          <span className="font-medium text-gray-800">{criteria.name}</span>
                          <span className="text-sm text-gray-600">({criteria.subcriteria.length} subcriteria)</span>
                        </button>
                      </td>
                      {modelOutputs.map((modelOutput) => {
                        const scoreInfo = getScoreDisplay(modelOutput, criteria.id);
                        return (
                          <td key={modelOutput.modelId} className="px-4 py-3 text-center">
                            <div className={`inline-flex items-center justify-center w-12 h-8 rounded border text-sm font-medium ${scoreInfo.color}`}>
                              {scoreInfo.score}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                    
                    {/* Subcriteria Rows */}
                    {expandedCriteria.has(criteria.id) && criteria.subcriteria.map((subcriteria) => (
                      <tr key={subcriteria.id} className="bg-white hover:bg-gray-50">
                        <td className="px-4 py-2 pl-12">
                          <div className="text-sm text-gray-700">{subcriteria.name}</div>
                          {showExamples && subcriteria.scoreLevels.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              {subcriteria.scoreLevels.map(level => `${level.score}: ${level.meaning}`).join(' • ')}
                            </div>
                          )}
                        </td>
                        {modelOutputs.map((modelOutput) => {
                          const scoreInfo = getScoreDisplay(modelOutput, subcriteria.id);
                          return (
                            <td key={modelOutput.modelId} className="px-4 py-2 text-center">
                              <div className={`inline-flex items-center justify-center w-10 h-6 rounded border text-xs font-medium ${scoreInfo.color}`}>
                                {scoreInfo.score}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="bg-gray-50 border-t border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            <span className="font-medium">Scoring:</span> 0 (Needs Improvement) • 1 (Developing) • 2 (Proficient)
          </div>
          <div>
            <span className="font-medium">Total Responses:</span> {modelOutputs.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationTable; 