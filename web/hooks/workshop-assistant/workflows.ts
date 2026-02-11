import { ModelOutput, TestCase, TestCaseWithModelOutputs, IdealModelResponse } from "@/types";

type CriteriaSubcriterion = {
  name: string;
  description?: string;
};

type CriteriaCriterion = {
  name: string;
  subcriteria?: CriteriaSubcriterion[];
};

type CriteriaCategory = {
  name: string;
  criteria?: CriteriaCriterion[];
};

type EvaluationMatch = {
  modelId: string;
  criteriaScores?: Record<string, number>;
};

type OutputGenerationAssistant = {
  id?: string;
  required_to_show?: boolean;
  model_ids?: string[];
};

type EvaluationResult = {
  testCaseId: string;
  modelOutputs: ModelOutput[];
  rubricEffectiveness: "high" | "medium" | "low";
  refinementSuggestions: string[];
};

interface EvaluationWorkflowParams {
  testCasesWithOutputs: TestCaseWithModelOutputs[];
  isRealEvaluation: boolean;
  idealResponses: IdealModelResponse[];
  selectedIdealResponseId: string;
  selectedCriteriaId: string;
  totalTestCases: number;
  onProgress: (currentIndex: number, progress: number) => void;
  onComplete: (results: EvaluationResult[]) => void;
}

// Handles the end-to-end evaluation stage:
// - fetch/flatten criteria
// - evaluate outputs (real or mock mode)
// - map API payload back into local output shape
export async function runEvaluationWorkflow({
  testCasesWithOutputs,
  isRealEvaluation,
  idealResponses,
  selectedIdealResponseId,
  selectedCriteriaId,
  totalTestCases,
  onProgress,
  onComplete,
}: EvaluationWorkflowParams): Promise<void> {
  if (!isRealEvaluation) {
    const evaluationResults: EvaluationResult[] = testCasesWithOutputs.map((testCase) => ({
      testCaseId: testCase.id,
      modelOutputs: testCase.modelOutputs.map((output) => ({
        ...output,
        rubricScores: {
          relevance: Math.floor(Math.random() * 3) + 1,
          accuracy: Math.floor(Math.random() * 3) + 1,
          completeness: Math.floor(Math.random() * 3) + 1,
        },
      })),
      rubricEffectiveness: "medium",
      refinementSuggestions: ["Mock evaluation - scores generated for demonstration"],
    }));

    onComplete(evaluationResults);
    onProgress(totalTestCases - 1, 100);
    return;
  }

  const criteriaResponse = await fetch("/api/criteria-data");
  if (!criteriaResponse.ok) {
    throw new Error("Failed to load evaluation criteria");
  }

  const criteriaData = await criteriaResponse.json();
  const rawCriteria: CriteriaCategory[] = Array.isArray(criteriaData?.criteria)
    ? criteriaData.criteria
    : [];

  const evaluationCriteria = rawCriteria.flatMap(
    (category) =>
      category.criteria?.flatMap(
        (criterion) =>
          criterion.subcriteria?.map((subcriteria) => ({
            id: `${category.name}_${criterion.name}_${subcriteria.name}`
              .replace(/\s+/g, "_")
              .toLowerCase(),
            name: `${criterion.name}: ${subcriteria.name}`,
            description: subcriteria.description || subcriteria.name,
            category: category.name,
            criterion: criterion.name,
            subcriteria: subcriteria.name,
          })) || [],
      ) || [],
  );

  const evaluationPromises = testCasesWithOutputs.map(async (testCase, index) => {
    if (!testCase.modelOutputs || testCase.modelOutputs.length === 0) {
      return { testCaseIndex: index, data: null };
    }

    const selectedIdealResponse = idealResponses.find(
      (response) => response.id === selectedIdealResponseId,
    );

    const response = await fetch("/api/model-evaluation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phase: "evaluate",
        testCase: {
          input: testCase.input,
          context: testCase.context,
          useCase: testCase.useCase,
          useContext: testCase.scenarioCategory,
        },
        criteria: evaluationCriteria,
        outputs: testCase.modelOutputs,
        criteriaSheetName: selectedCriteriaId,
        idealResponse: selectedIdealResponse
          ? {
              id: selectedIdealResponse.id,
              idealTestCase: selectedIdealResponse.testCaseInput,
              testCaseInput: selectedIdealResponse.testCaseInput,
            }
          : null,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${response.status}`);
    }

    const payload = await response.json();
    const progress = ((index + 1) / testCasesWithOutputs.length) * 50 + 50;
    onProgress(index, progress);

    return { testCaseIndex: index, data: payload };
  });

  const settled = await Promise.allSettled(evaluationPromises);

  const evaluationResults: EvaluationResult[] = testCasesWithOutputs.map((testCase, index) => {
    const settledResult = settled[index];
    let evaluatedOutputs = testCase.modelOutputs;

    if (settledResult.status === "fulfilled") {
      const payload = settledResult.value.data;
      if (payload?.evaluations && Array.isArray(payload.evaluations)) {
        evaluatedOutputs = testCase.modelOutputs.map((modelOutput) => {
          const match = payload.evaluations.find(
            (evaluation: EvaluationMatch) => evaluation.modelId === modelOutput.modelId,
          );
          return {
            ...modelOutput,
            rubricScores: match?.criteriaScores || modelOutput.rubricScores || {},
          };
        });
      }
    }

    return {
      testCaseId: testCase.id,
      modelOutputs: evaluatedOutputs,
      rubricEffectiveness: "medium",
      refinementSuggestions: ["Evaluation completed"],
    };
  });

  onComplete(evaluationResults);
  onProgress(testCasesWithOutputs.length - 1, 100);
  onProgress(totalTestCases - 1, 100);
}

interface GenerationWorkflowParams {
  testCase: TestCase | undefined;
  currentGroupId: string | null;
  idealResponses: IdealModelResponse[];
  selectedIdealResponseId: string;
  selectedCriteriaId: string;
  resetStream: () => void;
  startStreaming: (
    testCase: TestCase,
    groupId?: string,
    idealResponse?: {
      id: string;
      idealTestCase: string;
      testCaseInput: string;
    } | null,
    criteriaSheetName?: string,
  ) => Promise<void>;
  setLoadingModelIds: (ids: string[]) => void;
  onUsingStreamingChange: (isUsing: boolean) => void;
}

// Handles output generation stage:
// - preselect visible loading model ids
// - start streaming generation for current test case
export async function runGenerationWorkflow({
  testCase,
  currentGroupId,
  idealResponses,
  selectedIdealResponseId,
  selectedCriteriaId,
  resetStream,
  startStreaming,
  setLoadingModelIds,
  onUsingStreamingChange,
}: GenerationWorkflowParams): Promise<void> {
  if (!testCase) {
    throw new Error("No test case available for generation");
  }

  try {
    const assistantsRes = await fetch("/api/admin/assistants?type=output_generation");
    if (assistantsRes.ok) {
      const assistantsData = await assistantsRes.json();
      const assistants: OutputGenerationAssistant[] = Array.isArray(assistantsData?.assistants)
        ? assistantsData.assistants
        : [];
      const required = assistants.filter((assistant) => assistant.required_to_show);
      const optional = assistants.filter((assistant) => !assistant.required_to_show);
      const desired = Math.min(2, assistants.length || 0);
      const selected = [
        ...required.slice(0, desired),
        ...optional.slice(0, Math.max(0, desired - required.length)),
      ].slice(0, desired);

      const placeholderIds = selected.flatMap((assistant) =>
        Array.isArray(assistant.model_ids) ? assistant.model_ids : [assistant.id || "loading"],
      );

      if (placeholderIds.length > 0) {
        setLoadingModelIds(placeholderIds);
      }
    } else {
      setLoadingModelIds(["loading-1", "loading-2"]);
    }
  } catch {
    setLoadingModelIds(["loading-1", "loading-2"]);
  }

  const selectedIdealResponse = idealResponses.find(
    (response) => response.id === selectedIdealResponseId,
  );

  onUsingStreamingChange(true);
  resetStream();

  await startStreaming(
    testCase,
    currentGroupId || undefined,
    selectedIdealResponse
      ? {
          id: selectedIdealResponse.id,
          idealTestCase: selectedIdealResponse.testCaseInput,
          testCaseInput: selectedIdealResponse.testCaseInput,
        }
      : null,
    selectedCriteriaId,
  );
}
