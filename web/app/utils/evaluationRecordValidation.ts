import {
  NewEvaluationRecord,
  RubricWithScoring,
  EvaluationCriterion,
  EvaluationScore,
} from "@/app/types/database";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates an evaluation score object
 */
export function validateEvaluationScore(
  score: any,
  fieldName: string
): ValidationResult {
  const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

  if (!score || typeof score !== "object") {
    result.isValid = false;
    result.errors.push(`${fieldName} must be an object`);
    return result;
  }

  // Check required fields
  if (typeof score.score !== "number") {
    result.isValid = false;
    result.errors.push(`${fieldName}.score must be a number`);
  } else {
    // Validate score range (0-2 based on the scoring structure)
    // Allow -1 as a special value for AI scores that haven't been evaluated yet
    const isAiScore = fieldName.includes("ai_score");
    const minScore = isAiScore ? -1 : 0; // AI scores can be -1 (not evaluated), human scores must be >= 0
    
    if (score.score < minScore || score.score > 2 || !Number.isInteger(score.score)) {
      result.isValid = false;
      if (isAiScore) {
        result.errors.push(
          `${fieldName}.score must be an integer between -1 and 2 (-1 indicates not evaluated)`
        );
      } else {
        result.errors.push(
          `${fieldName}.score must be an integer between 0 and 2`
        );
      }
    }
  }

  if (typeof score.rationale !== "string") {
    result.isValid = false;
    result.errors.push(`${fieldName}.rationale must be a string`);
  } else if (score.rationale.length === 0) {
    result.warnings.push(`${fieldName}.rationale is empty`);
  }

  return result;
}

/**
 * Validates an evaluation criterion object
 */
export function validateEvaluationCriterion(
  criterion: any,
  index: number
): ValidationResult {
  const result: ValidationResult = { isValid: true, errors: [], warnings: [] };
  const fieldName = `criteria[${index}]`;

  if (!criterion || typeof criterion !== "object") {
    result.isValid = false;
    result.errors.push(`${fieldName} must be an object`);
    return result;
  }

  // Validate name
  if (typeof criterion.name !== "string" || criterion.name.length === 0) {
    result.isValid = false;
    result.errors.push(`${fieldName}.name must be a non-empty string`);
  }

  // Validate description
  if (
    typeof criterion.description !== "string" ||
    criterion.description.length === 0
  ) {
    result.isValid = false;
    result.errors.push(`${fieldName}.description must be a non-empty string`);
  }

  // Validate new criterion fields
  if (
    typeof criterion.requirement !== "string" ||
    criterion.requirement.length === 0
  ) {
    result.isValid = false;
    result.errors.push(`${fieldName}.requirement must be a non-empty string`);
  }
  
  // Validate num field (required)
  if (typeof criterion.num !== "number" || criterion.num <= 0) {
    result.isValid = false;
    result.errors.push(`${fieldName}.num must be a positive number`);
  }
  
  // Validate weight field (optional)
  if (criterion.weight !== undefined && typeof criterion.weight !== "string") {
    result.isValid = false;
    result.errors.push(`${fieldName}.weight must be a string if provided`);
  }
  
  if (
    typeof criterion.points !== "number" ||
    !Number.isInteger(criterion.points) ||
    criterion.points < 0
  ) {
    result.isValid = false;
    result.errors.push(`${fieldName}.points must be a non-negative integer`);
  }

  if (typeof criterion.ideal_response !== "string") {
    result.isValid = false;
    result.errors.push(`${fieldName}.ideal_response must be a string`);
  }

  // Validate scores map
  if (criterion.scores && typeof criterion.scores === "object") {
    for (const [responseId, scorePair] of Object.entries<any>(
      criterion.scores
    )) {
      if (!scorePair || typeof scorePair !== "object") {
        result.isValid = false;
        result.errors.push(
          `${fieldName}.scores[${responseId}] must be an object`
        );
        continue;
      }
      if (scorePair.human_score !== undefined) {
        const humanVal = validateEvaluationScore(
          scorePair.human_score,
          `${fieldName}.scores[${responseId}].human_score`
        );
        if (!humanVal.isValid) {
          result.isValid = false;
          result.errors.push(...humanVal.errors);
        }
        result.warnings.push(...humanVal.warnings);
      }
      if (scorePair.ai_score !== undefined) {
        const aiVal = validateEvaluationScore(
          scorePair.ai_score,
          `${fieldName}.scores[${responseId}].ai_score`
        );
        if (!aiVal.isValid) {
          result.isValid = false;
          result.errors.push(...aiVal.errors);
        }
        result.warnings.push(...aiVal.warnings);
      }
    }
  } else {
    // scores can be empty but must be an object
    if (criterion.scores !== undefined) {
      result.isValid = false;
      result.errors.push(
        `${fieldName}.scores must be an object mapping responseId to {human_score, ai_score}`
      );
    }
  }

  return result;
}

/**
 * Validates a rubric with scoring structure
 */
export function validateRubricWithScoring(rubric: any): ValidationResult {
  const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

  if (!rubric || typeof rubric !== "object") {
    result.isValid = false;
    result.errors.push("rubric_with_scoring must be an object");
    return result;
  }

  // Validate criteria array
  if (!Array.isArray(rubric.criteria)) {
    result.isValid = false;
    result.errors.push("rubric_with_scoring.criteria must be an array");
    return result;
  }

  if (rubric.criteria.length === 0) {
    result.isValid = false;
    result.errors.push(
      "rubric_with_scoring.criteria must contain at least one criterion"
    );
    return result;
  }

  // Validate each criterion
  for (let i = 0; i < rubric.criteria.length; i++) {
    const criterionValidation = validateEvaluationCriterion(
      rubric.criteria[i],
      i
    );
    if (!criterionValidation.isValid) {
      result.isValid = false;
    }
    result.errors.push(...criterionValidation.errors);
    result.warnings.push(...criterionValidation.warnings);
  }

  // Check for duplicate criteria names
  const criteriaNames = rubric.criteria.map((c: any) => c.name).filter(Boolean);
  const uniqueNames = new Set(criteriaNames);
  if (criteriaNames.length !== uniqueNames.size) {
    result.warnings.push("Duplicate criteria names found in rubric");
  }

  return result;
}

/**
 * Validates a complete evaluation record
 */
export function validateEvaluationRecord(record: any): ValidationResult {
  const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

  if (!record || typeof record !== "object") {
    result.isValid = false;
    result.errors.push("Evaluation record must be an object");
    return result;
  }

  // Validate required string fields
  const requiredStringFields = [
    "group_id",
    "session_id",
    "test_case_prompt",
    "evaluator_model",
    "evaluator_system_prompt",
    "ideal_response",
    "ideal_test_case",
  ];

  for (const field of requiredStringFields) {
    if (typeof record[field] !== "string" || record[field].length === 0) {
      result.isValid = false;
      result.errors.push(`${field} must be a non-empty string`);
    }
  }

  // Validate UUID format for session_id (basic check)
  if (record.session_id && typeof record.session_id === "string") {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(record.session_id)) {
      result.warnings.push(
        "session_id does not appear to be a valid UUID format"
      );
    }
  }

  // Validate rubric_with_scoring
  if (record.rubric_with_scoring) {
    const rubricValidation = validateRubricWithScoring(
      record.rubric_with_scoring
    );
    if (!rubricValidation.isValid) {
      result.isValid = false;
    }
    result.errors.push(...rubricValidation.errors);
    result.warnings.push(...rubricValidation.warnings);
  } else {
    result.isValid = false;
    result.errors.push("rubric_with_scoring is required");
  }

  return result;
}

/**
 * Validates an array of evaluation records for bulk upload
 */
export function validateEvaluationRecordsBulk(records: any[]): {
  isValid: boolean;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  recordValidations: Array<{ index: number; validation: ValidationResult }>;
} {
  const recordValidations: Array<{
    index: number;
    validation: ValidationResult;
  }> = [];
  let validRecords = 0;
  let invalidRecords = 0;

  for (let i = 0; i < records.length; i++) {
    const validation = validateEvaluationRecord(records[i]);
    recordValidations.push({ index: i, validation });

    if (validation.isValid) {
      validRecords++;
    } else {
      invalidRecords++;
    }
  }

  return {
    isValid: invalidRecords === 0,
    totalRecords: records.length,
    validRecords,
    invalidRecords,
    recordValidations,
  };
}

/**
 * Calculates scoring statistics from a rubric
 */
export function calculateScoringStats(rubric: RubricWithScoring): {
  totalCriteria: number;
  maxPossibleScore: number;
  humanTotalScore: number;
  aiTotalScore: number;
  agreementScore: number; // Percentage of criteria where human and AI scores match
} {
  let maxPossibleScore = 0;
  let humanTotalScore = 0;
  let aiTotalScore = 0;
  let agreementCount = 0;

  for (const criterion of rubric.criteria) {
    const points = (criterion as any).points as number;
    maxPossibleScore += typeof points === "number" ? points : 0;

    // Aggregate first available pair per criterion for stats (fallback behavior)
    const scoresMap = (criterion as any).scores as Record<
      string,
      { human_score?: EvaluationScore; ai_score?: EvaluationScore }
    >;
    if (scoresMap && typeof scoresMap === "object") {
      const first = Object.values(scoresMap)[0];
      const humanScoreVal = first?.human_score?.score ?? 0;
      const aiScoreVal = first?.ai_score?.score ?? 0;
      humanTotalScore += humanScoreVal;
      aiTotalScore += aiScoreVal;
      if (
        first?.human_score &&
        first?.ai_score &&
        humanScoreVal === aiScoreVal
      ) {
        agreementCount++;
      }
    }
  }

  const agreementScore =
    rubric.criteria.length > 0
      ? (agreementCount / rubric.criteria.length) * 100
      : 0;

  return {
    totalCriteria: rubric.criteria.length,
    maxPossibleScore,
    humanTotalScore,
    aiTotalScore,
    agreementScore,
  };
}
