import { collectAndUploadEvaluationData } from "@/app/utils/evaluationDataCollector";
import { IdealModelResponse } from "@/app/types";

interface RubricItem {
  id: string;
  name: string;
}

interface RubricInstruction {
  positive: string;
  negative: string;
}

interface EvaluationUploadParams {
  testCase?: any;
  modelOutputs?: any[];
  rubricItems: RubricItem[];
  rubricInstructions: RubricInstruction[];
  rubricPoints: number[];
  humanScores: Record<string, Record<string, number | "">>;
  humanRationales: Record<string, Record<string, string>>;
  aiScores: Record<
    string,
    Record<string, { score: number; rationale: string }>
  >;
  idealResponses: IdealModelResponse[];
  sessionId?: string;
  idealExpectedScores: Record<string, number>;
}

export interface UseEvaluationUploadResult {
  isUploadingData: boolean;
  uploadStatus: string | null;
  uploadEvaluationData: () => Promise<void>;
}

export function useEvaluationDataUpload(
  params: EvaluationUploadParams,
  setIsUploadingData: (loading: boolean) => void,
  setUploadStatus: (status: string | null) => void
): UseEvaluationUploadResult {
  const uploadEvaluationData = async () => {
    console.log(
      "[useEvaluationDataUpload] 📤 Starting evaluation data upload..."
    );

    setIsUploadingData(true);
    setUploadStatus(null);

    try {
      // Prepare the data for upload
      const result = await collectAndUploadEvaluationData({
        testCase: params.testCase,
        modelOutputs: params.modelOutputs,
        rubricItems: params.rubricItems,
        rubricInstructions: params.rubricInstructions,
        rubricPoints: params.rubricPoints,
        humanScores: params.humanScores,
        humanRationales: params.humanRationales,
        aiScores: params.aiScores,
        evaluatorModel: "gpt-4-turbo", // This should be determined from AI evaluation
        evaluatorSystemPrompt: "Evaluation system prompt", // This should come from the actual evaluation
        idealResponses: params.idealResponses,
        sessionId: params.sessionId ?? undefined,
        groupId: params.testCase?.groupId || `group-${Date.now()}`,
        idealExpectedScores: params.idealExpectedScores,
      });

      if (result.success) {
        console.log(
          "[useEvaluationDataUpload] ✅ Evaluation data uploaded successfully:",
          result.id
        );
        setUploadStatus(
          `Successfully saved evaluation data (ID: ${result.id})`
        );
      } else {
        console.error(
          "[useEvaluationDataUpload] ❌ Upload failed:",
          result.error
        );
        setUploadStatus(`Upload failed: ${result.error}`);
      }
    } catch (error) {
      console.error(
        "[useEvaluationDataUpload] ❌ Error uploading evaluation data:",
        error
      );
      setUploadStatus(
        error instanceof Error
          ? `Upload error: ${error.message}`
          : "Upload failed"
      );
    } finally {
      setIsUploadingData(false);

      // Clear status after 5 seconds
      // setTimeout(() => {
      //   setUploadStatus(null);
      // }, 5000);
    }
  };

  return {
    isUploadingData: false, // This will be managed by the parent component
    uploadStatus: null, // This will be managed by the parent component
    uploadEvaluationData,
  };
}
