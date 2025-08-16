import React, { useState } from "react";
import {
  ModelOutput,
  RubricStructure,
  EXAMPLE_RUBRIC_STRUCTURE,
} from "@/app/types";

interface ModelEvaluationCardProps {
  modelOutput: ModelOutput;
  rubricStructure?: RubricStructure;
  showDetailedRubric?: boolean;
  responseIndex?: number;
}

interface ScoreDisplayProps {
  score: number;
  maxScore: number;
  criterion: string;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  score,
  maxScore,
  criterion,
}) => {
  const percentage = (score / maxScore) * 100;
  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600 bg-green-50";
    if (percentage >= 60) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-700 capitalize flex-1">
        {criterion}
      </span>
      <div className="flex items-center space-x-2">
        <div
          className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(
            percentage
          )}`}
        >
          {score}/{maxScore}
        </div>
        <div className="w-16 bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              percentage >= 80
                ? "bg-green-500"
                : percentage >= 60
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const ModelEvaluationCard: React.FC<ModelEvaluationCardProps> = ({
  modelOutput,
  rubricStructure = EXAMPLE_RUBRIC_STRUCTURE,
  showDetailedRubric = true,
  responseIndex,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );
  const [showFullOutput, setShowFullOutput] = useState(false);
  const [showRubricDetails, setShowRubricDetails] = useState(false);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const getModelDisplayInfo = (modelId: string, modelName?: string) => {
    const modelMap: { [key: string]: { displayName: string; color: string } } =
      {
        "gpt-4o-mini": { displayName: "GPT-4o Mini", color: "bg-green-500" },
        "gpt-3.5-turbo": { displayName: "GPT-3.5 Turbo", color: "bg-blue-500" },
        "claude-3-sonnet": {
          displayName: "Claude 3 Sonnet",
          color: "bg-purple-500",
        },
        "claude-3-haiku": {
          displayName: "Claude 3 Haiku",
          color: "bg-indigo-500",
        },
      };

    return (
      modelMap[modelId] || {
        displayName: modelName || modelId,
        color: "bg-gray-500",
      }
    );
  };

  const calculateOverallScore = () => {
    if (
      !modelOutput.rubricScores ||
      Object.keys(modelOutput.rubricScores).length === 0
    ) {
      return { score: 0, maxScore: 5, percentage: 0 };
    }

    const scores = Object.values(modelOutput.rubricScores);
    const average =
      scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const maxScore = 5; // Assuming max score of 5 based on legacy system
    const percentage = (average / maxScore) * 100;

    return { score: average, maxScore, percentage };
  };

  const modelInfo = getModelDisplayInfo(
    modelOutput.modelId,
    modelOutput.modelName
  );
  const overallScore = calculateOverallScore();

  return (
    <div className="border border-slate-200 rounded-lg bg-white hover:shadow-md transition-shadow duration-200">
      {/* Model Header */}
      <div className="p-4 border-b bg-gray-50 rounded-t-lg border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              <h4 className="font-semibold text-gray-900">
                {responseIndex !== undefined
                  ? `For response ${responseIndex + 1}`
                  : modelInfo.displayName}
              </h4>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium bg-blue-200 text-blue-800`}
            >
              {overallScore.score.toFixed(1)}/{overallScore.maxScore}
            </div>
          </div>
        </div>
      </div>

      {/* Evaluation Scores */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h5 className="font-medium text-gray-800">Evaluation Scores</h5>
          {showDetailedRubric && (
            <button
              onClick={() => setShowRubricDetails(!showRubricDetails)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              {showRubricDetails ? "Hide Rubric" : "Show Rubric"}
            </button>
          )}
        </div>

        {modelOutput.rubricScores &&
        Object.keys(modelOutput.rubricScores).length > 0 ? (
          <div className="space-y-1">
            {Object.entries(modelOutput.rubricScores).map(
              ([criteria, score]) => (
                <ScoreDisplay
                  key={criteria}
                  score={score}
                  maxScore={5}
                  criterion={criteria.replace(/-/g, " ")}
                />
              )
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic">
            No evaluation scores available
          </div>
        )}

        {/* Detailed Rubric Display */}
        {showRubricDetails && showDetailedRubric && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h6 className="text-sm font-medium text-gray-800 mb-3">
              Rubric Structure
            </h6>
            <div className="space-y-3">
              {rubricStructure.responseComponents.map((component) => (
                <div key={component.id}>
                  <button
                    onClick={() => toggleSection(component.id)}
                    className="flex items-center justify-between w-full text-left p-2 bg-white rounded border hover:bg-gray-50"
                  >
                    <span className="font-medium text-sm text-gray-700">
                      {component.name}
                    </span>
                    <span className="text-gray-400">
                      {expandedSections.has(component.id) ? "−" : "+"}
                    </span>
                  </button>

                  {expandedSections.has(component.id) && (
                    <div className="mt-2 pl-4 space-y-2">
                      {component.criteria.map((criterion) => (
                        <div
                          key={criterion.id}
                          className="border-l-2 border-gray-200 pl-3"
                        >
                          <div className="font-medium text-xs text-gray-800">
                            {criterion.name}
                          </div>
                          <div className="text-xs text-gray-600 mb-2">
                            {criterion.description}
                          </div>

                          {criterion.subcriteria.map((subcriteria) => (
                            <div key={subcriteria.id} className="ml-2 mb-2">
                              <div className="text-xs font-medium text-gray-700">
                                {subcriteria.name}
                              </div>
                              <div className="space-y-1 mt-1">
                                {subcriteria.scoreLevels.map((level) => (
                                  <div
                                    key={level.score}
                                    className="flex items-start space-x-2 text-xs"
                                  >
                                    <span
                                      className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold ${
                                        level.score === 2
                                          ? "bg-green-500"
                                          : level.score === 1
                                          ? "bg-yellow-500"
                                          : "bg-red-500"
                                      }`}
                                    >
                                      {level.score}
                                    </span>
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-700">
                                        {level.meaning}
                                      </div>
                                      <div className="text-gray-500 mt-1">
                                        Examples: {level.examples.join(", ")}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Feedback Section */}
      <div className="p-4 border-t">
        <h5 className="font-medium text-gray-800 mb-2">Evaluation Feedback</h5>
        <div className="text-sm text-gray-600 leading-relaxed">
          {modelOutput.feedback ||
            "No detailed feedback available for this response."}
        </div>
      </div>

      {/* Suggestions Section */}
      {modelOutput.suggestions && modelOutput.suggestions.length > 0 && (
        <div className="p-4 border-t">
          <h5 className="font-medium text-gray-800 mb-2">
            Improvement Suggestions
          </h5>
          <ul className="space-y-1">
            {modelOutput.suggestions.map((suggestion, index) => (
              <li
                key={index}
                className="text-sm text-gray-600 flex items-start"
              >
                <span className="text-blue-500 mr-2">•</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ModelEvaluationCard;
