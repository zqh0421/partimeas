import {
  IdealResponseScore,
  RubricStructure,
  Criteria,
  Subcriteria,
  CriteriaData,
} from "@/types";
import {
  saveIdealResponseScores,
  restoreIdealResponseScores,
} from "./selectionCache";

/**
 * Initializes default scores for an ideal response based on rubric criteria.
 * Each subcriteria gets a default score equal to its maximum possible score (idealPoint = 2).
 */
export function initializeIdealResponseScores(
  idealResponseId: string,
  rubricStructure?: RubricStructure
): IdealResponseScore[] {
  if (!idealResponseId || !rubricStructure) {
    return [];
  }

  const scores: IdealResponseScore[] = [];

  // Iterate through all response components, criteria, and subcriteria
  rubricStructure.responseComponents.forEach((component) => {
    component.criteria.forEach((criteria) => {
      criteria.subcriteria.forEach((subcriteria) => {
        // Find the maximum score level (idealPoint) for this subcriteria
        const maxScoreLevel = subcriteria.scoreLevels.reduce(
          (max, level) => Math.max(max, level.score),
          0
        );

        scores.push({
          idealResponseId,
          criteriaId: criteria.id,
          subcriteriaId: subcriteria.id,
          expectedScore: maxScoreLevel, // Use maximum score as default
          isCustomized: false,
        });
      });
    });
  });

  return scores;
}

/**
 * Gets or initializes scores for an ideal response.
 * First checks cache, then initializes if not found.
 */
export function getOrInitializeIdealResponseScores(
  idealResponseId: string,
  rubricStructure?: RubricStructure
): IdealResponseScore[] {
  // Try to restore from cache first
  const cachedScores = restoreIdealResponseScores(idealResponseId);

  if (cachedScores.length > 0) {
    console.log(
      `[IdealResponseScoring] Restored ${cachedScores.length} cached scores for: ${idealResponseId}`
    );
    return cachedScores;
  }

  // Initialize new scores if not cached
  const newScores = initializeIdealResponseScores(
    idealResponseId,
    rubricStructure
  );

  if (newScores.length > 0) {
    // Save to cache
    saveIdealResponseScores(idealResponseId, newScores);
    console.log(
      `[IdealResponseScoring] Initialized ${newScores.length} default scores for: ${idealResponseId}`
    );
  }

  return newScores;
}

/**
 * Updates a specific score for an ideal response and marks it as customized.
 */
export function updateIdealResponseScore(
  idealResponseId: string,
  criteriaId: string,
  subcriteriaId: string,
  newScore: number,
  rubricStructure?: RubricStructure
): IdealResponseScore[] {
  // Get current scores
  let currentScores = getOrInitializeIdealResponseScores(
    idealResponseId,
    rubricStructure
  );

  // If no scores exist (e.g., no rubric structure), create a minimal score entry
  if (currentScores.length === 0) {
    currentScores = [
      {
        idealResponseId,
        criteriaId,
        subcriteriaId,
        expectedScore: 2, // Default to 2 as typical max score
        isCustomized: false,
      },
    ];
  }

  // Check if the score already exists
  const existingScoreIndex = currentScores.findIndex(
    (score) =>
      score.criteriaId === criteriaId && score.subcriteriaId === subcriteriaId
  );

  let updatedScores: IdealResponseScore[];

  if (existingScoreIndex >= 0) {
    // Update existing score
    updatedScores = currentScores.map((score, index) => {
      if (index === existingScoreIndex) {
        return {
          ...score,
          expectedScore: newScore,
          isCustomized: true,
        };
      }
      return score;
    });
  } else {
    // Add new score entry
    updatedScores = [
      ...currentScores,
      {
        idealResponseId,
        criteriaId,
        subcriteriaId,
        expectedScore: newScore,
        isCustomized: true,
      },
    ];
  }

  // Save updated scores to cache
  saveIdealResponseScores(idealResponseId, updatedScores);

  console.log(
    `[IdealResponseScoring] Updated score for ${criteriaId}/${subcriteriaId} to ${newScore} (cached: ${updatedScores.length} scores)`
  );

  return updatedScores;
}

/**
 * Resets all scores for an ideal response to their default values.
 */
export function resetIdealResponseScores(
  idealResponseId: string,
  rubricStructure?: RubricStructure
): IdealResponseScore[] {
  // Initialize fresh scores
  const defaultScores = initializeIdealResponseScores(
    idealResponseId,
    rubricStructure
  );

  // Save to cache
  saveIdealResponseScores(idealResponseId, defaultScores);

  console.log(
    `[IdealResponseScoring] Reset ${defaultScores.length} scores to defaults for: ${idealResponseId}`
  );

  return defaultScores;
}

/**
 * Gets the expected score for a specific criteria/subcriteria combination.
 */
export function getExpectedScore(
  idealResponseId: string,
  criteriaId: string,
  subcriteriaId: string,
  rubricStructure?: RubricStructure
): number | null {
  if (!idealResponseId) {
    return null;
  }

  const scores = getOrInitializeIdealResponseScores(
    idealResponseId,
    rubricStructure
  );

  const score = scores.find(
    (s) => s.criteriaId === criteriaId && s.subcriteriaId === subcriteriaId
  );

  console.log(
    `[IdealResponseScoring] getExpectedScore for ${criteriaId}/${subcriteriaId}:`,
    {
      idealResponseId,
      foundScore: !!score,
      expectedScore: score?.expectedScore,
      totalScores: scores.length,
      allScores: scores,
    }
  );

  return score ? score.expectedScore : null;
}

/**
 * Calculates summary statistics for ideal response scores.
 */
export function getIdealResponseScoreStats(
  idealResponseId: string,
  rubricStructure?: RubricStructure
) {
  const scores = getOrInitializeIdealResponseScores(
    idealResponseId,
    rubricStructure
  );

  if (scores.length === 0) {
    return {
      totalScores: 0,
      customizedScores: 0,
      totalExpectedScore: 0,
      averageExpectedScore: 0,
    };
  }

  const customizedCount = scores.filter((s) => s.isCustomized).length;
  const totalExpectedScore = scores.reduce(
    (sum, s) => sum + s.expectedScore,
    0
  );
  const averageExpectedScore = totalExpectedScore / scores.length;

  return {
    totalScores: scores.length,
    customizedScores: customizedCount,
    totalExpectedScore,
    averageExpectedScore,
  };
}

/**
 * Creates a basic rubric structure from legacy criteria data for scoring initialization.
 * This is a fallback when the full rubric structure is not available.
 */
export function createBasicRubricFromCriteria(
  criteria: CriteriaData[]
): RubricStructure {
  const scoreLevels = [
    {
      score: 0,
      meaning: "Inadequate",
      examples: ["Does not meet requirements"],
    },
    { score: 1, meaning: "Adequate", examples: ["Meets basic requirements"] },
    { score: 2, meaning: "Ideal", examples: ["Exceeds expectations"] },
  ];

  // Group criteria by category
  const categorizedCriteria = criteria.reduce((acc, criterion) => {
    if (!acc[criterion.category]) {
      acc[criterion.category] = [];
    }
    acc[criterion.category].push(criterion);
    return acc;
  }, {} as Record<string, CriteriaData[]>);

  const responseComponents = Object.entries(categorizedCriteria).map(
    ([category, categoryItems]) => ({
      id: category.toLowerCase().replace(/\s+/g, "-"),
      name: category,
      criteria: categoryItems.map((item) => ({
        id: item.id,
        name: item.criteria,
        description: item.description,
        subcriteria: [
          {
            id: `${item.id}-sub`,
            name: item.criteria,
            description: item.description,
            scoreLevels,
          },
        ],
      })),
    })
  );

  return {
    id: "basic-rubric-from-criteria",
    name: "Basic Rubric Structure",
    version: "1.0",
    responseComponents,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Initializes ideal response scores using legacy criteria data if rubric structure is not available.
 */
export function initializeIdealResponseScoresFromCriteria(
  idealResponseId: string,
  criteria: CriteriaData[]
): IdealResponseScore[] {
  if (!idealResponseId || !criteria || criteria.length === 0) {
    return [];
  }

  const basicRubric = createBasicRubricFromCriteria(criteria);
  return initializeIdealResponseScores(idealResponseId, basicRubric);
}
