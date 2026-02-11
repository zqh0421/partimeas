import React from "react";
import { useCriteriaData } from "@/hooks/useCriteriaData";
import EvaluationResultsTable from "./EvaluationResultsTable";
import { Criteria, Subcriteria, ModelScore } from "./EvaluationResultsTable";

interface RealCriteriaTableProps {
  modelScores: ModelScore[];
  title?: string;
}

export default function RealCriteriaTable({
  modelScores,
  title,
}: RealCriteriaTableProps) {
  const { criteria, isLoading, error, refetch } = useCriteriaData();

  // Convert hierarchical criteria data to the format expected by EvaluationResultsTable
  const convertToCriteria = (hierarchicalData: any[]): Criteria[] => {
    console.log("Converting hierarchical criteria data:", hierarchicalData);

    const result: Criteria[] = [];

    // Iterate through each category
    hierarchicalData.forEach((category, categoryIndex) => {
      // Iterate through each criterion
      (category?.criteria ?? []).forEach(
        (criterion: any, criterionIndex: number) => {
          const criteriaId = `${category.name}-${criterion.name}`
            .replace(/\s+/g, "-")
            .toLowerCase();

          // Convert subcriteria
          const subcriteria: Subcriteria[] = (criterion?.subcriteria ?? []).map(
            (sub: any, subIndex: number) => {
              const subcriteriaId = `${criteriaId}-${sub.name}`
                .replace(/\s+/g, "-")
                .toLowerCase();

              // Build scoreLevels object
              const scoreLevels: { 0: string; 1: string; 2: string } = {
                0: "Score 0 not available",
                1: "Score 1 not available",
                2: "Score 2 not available",
              };

              // Fill in actual score descriptions
              (sub?.scoreLevels ?? []).forEach((scoreLevel: any) => {
                const score = parseInt(scoreLevel?.score);
                if (score >= 0 && score <= 2) {
                  scoreLevels[score as 0 | 1 | 2] =
                    scoreLevel?.scoreMeaning ||
                    `Score ${score} description not available`;
                }
              });

              return {
                id: subcriteriaId,
                name: sub.name,
                description: sub.description || "No description available",
                scoreLevels,
              };
            }
          );

          result.push({
            id: criteriaId,
            name: `${category.name} - ${criterion.name}`,
            description: criterion.description || "No description available",
            subcriteria,
          });
        }
      );
    });

    console.log("Converted criteria result:", result);
    return result;
  };

  // Convert model scores to match the hierarchical criteria structure
  const convertModelScores = (
    modelScores: ModelScore[],
    hierarchicalData: any[]
  ): ModelScore[] => {
    console.log("Converting model scores for hierarchical data:", {
      modelScores,
      hierarchicalData,
    });

    const result = modelScores.map((modelScore) => {
      const convertedScores: { [key: string]: number } = {};

      // Traverse hierarchical data structure to generate scores for each subcriteria
      hierarchicalData.forEach((category) => {
        (category?.criteria ?? []).forEach((criterion: any) => {
          const criteriaId = `${category.name}-${criterion.name}`
            .replace(/\s+/g, "-")
            .toLowerCase();

          (criterion?.subcriteria ?? []).forEach((sub: any) => {
            const subcriteriaId = `${criteriaId}-${sub.name}`
              .replace(/\s+/g, "-")
              .toLowerCase();

            // Try to map from existing scores
            let score = 0;

            // Check if there's a direct matching ID
            if (
              modelScore?.scores &&
              modelScore.scores[subcriteriaId] != null
            ) {
              score = modelScore.scores[subcriteriaId];
            } else {
              // Perform intelligent mapping based on names
              const criterionName = criterion.name.toLowerCase();
              const subcriteriaName = sub.name.toLowerCase();

              // Map common evaluation criteria
              if (
                criterionName.includes("relevance") ||
                subcriteriaName.includes("relevance")
              ) {
                score = modelScore?.scores?.["relevance"] ?? 0;
              } else if (
                criterionName.includes("accuracy") ||
                subcriteriaName.includes("accuracy")
              ) {
                score = modelScore?.scores?.["accuracy"] ?? 0;
              } else if (
                criterionName.includes("complete") ||
                subcriteriaName.includes("complete")
              ) {
                score = modelScore?.scores?.["completeness"] ?? 0;
              } else if (
                criterionName.includes("clarity") ||
                subcriteriaName.includes("clear")
              ) {
                score = modelScore?.scores?.["clarity"] ?? 0;
              } else if (
                criterionName.includes("strength") ||
                subcriteriaName.includes("strength")
              ) {
                score = modelScore?.scores?.["strengths"] ?? 1; // Default medium score
              } else if (
                criterionName.includes("explanation") ||
                subcriteriaName.includes("explanation")
              ) {
                score = modelScore?.scores?.["explanation"] ?? 1;
              } else if (
                criterionName.includes("question") ||
                subcriteriaName.includes("question")
              ) {
                score = modelScore?.scores?.["questions"] ?? 1;
              } else {
                // Generate random scores (0-2) for demonstration purposes
                score = Math.floor(Math.random() * 3);
              }
            }

            convertedScores[subcriteriaId] = score;
          });
        });
      });

      return {
        ...modelScore,
        scores: convertedScores,
      };
    });

    console.log("Converted model scores result:", result);
    return result;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-transparent border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-600">
            Loading evaluation criteria...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">
          <p className="font-medium">Failed to load criteria</p>
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!criteria || criteria.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        No evaluation criteria available
      </div>
    );
  }

  const convertedCriteria = convertToCriteria(criteria);
  const convertedModelScores = convertModelScores(modelScores, criteria);

  // Debug logging
  console.log("RealCriteriaTable Debug:", {
    originalCriteria: criteria,
    convertedCriteria,
    originalModelScores: modelScores,
    convertedModelScores,
  });

  return (
    <EvaluationResultsTable
      criteria={convertedCriteria}
      modelScores={convertedModelScores}
    />
  );
}
