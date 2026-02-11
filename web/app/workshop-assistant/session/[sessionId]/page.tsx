"use client";
import { useEffect, useState, use } from "react";
import VerticalStepper from "@/components/steps/VerticalStepper";
import SessionHeader from "@/components/SessionHeader";
import { TestCase, TestCaseWithModelOutputs } from "@/types";
import type { SessionWithResponses } from "@/utils/sessionManager";
import { useRouter, useSearchParams } from "next/navigation";
import TestCaseNavigation from "@/components/TestCaseNavigation";
import ModelOutputsGrid from "@/components/ModelOutputsGrid";
import { useConfig } from "@/hooks/useConfig";
import { useIdealResponses } from "@/hooks/useIdealResponses";
import { RefreshIcon } from "@/components/icons";

export default function Page({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const [session, setSession] = useState<SessionWithResponses | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const config = useConfig();
  const { numOutputsToShow } = config;

  // Get rubric and ideal response - will be set from session data, not URL params
  const [rubricId, setRubricId] = useState<string | null>(null);
  const [idealResponseId, setIdealResponseId] = useState<string | null>(null);
  const { idealResponses } = useIdealResponses();

  useEffect(() => {
    const loadSession = async () => {
      try {
        console.log("🔍 Attempting to load session:", sessionId);
        setLoading(true);

        // Fetch session data via API to avoid client-side DB access
        const response = await fetch(
          `/api/sessions?action=byId&id=${sessionId}`,
        );
        if (!response.ok) {
          throw new Error(`Failed to load session: ${response.status}`);
        }
        const data = await response.json();
        const sessionData: SessionWithResponses | null = data?.success
          ? data.session
          : null;
        console.log(
          "📋 Session data loaded:",
          sessionData ? "success" : "not found",
        );
        if (sessionData) {
          console.log("🔗 Session linked data:", {
            linked_criterion_sheet_name:
              sessionData.linked_criterion_sheet_name,
            linked_ideal_response: sessionData.linked_ideal_response,
            linked_ideal_test_case: sessionData.linked_ideal_test_case,
          });
        }

        if (!sessionData) {
          console.log("❌ Session not found");
          setError("Session not found");
          return;
        }

        // Validate that the session has the expected number of responses
        console.log(
          `📊 Session validation: ${sessionData.responses.length} responses, expected ${sessionData.response_count}`,
        );
        if (sessionData.responses.length !== sessionData.response_count) {
          throw new Error(
            `Session response count mismatch: expected ${sessionData.response_count}, got ${sessionData.responses.length}`,
          );
        }

        console.log("✅ Session validation passed");
        setSession(sessionData);

        // Set rubric and ideal response from session data if available
        // Otherwise fall back to URL params (for backward compatibility)
        if (sessionData.linked_criterion_sheet_name) {
          console.log(
            "📋 Using linked rubric from session:",
            sessionData.linked_criterion_sheet_name,
          );
          setRubricId(sessionData.linked_criterion_sheet_name);
        } else {
          // Fallback to URL params if session doesn't have linked rubric
          const urlRubricId = searchParams.get("rubricId");
          if (urlRubricId) {
            console.log(
              "📋 Falling back to rubric from URL params:",
              urlRubricId,
            );
            setRubricId(urlRubricId);
          }
        }

        if (sessionData.linked_ideal_response) {
          console.log(
            "📋 Using linked ideal response from session:",
            sessionData.linked_ideal_response,
          );
          setIdealResponseId(sessionData.linked_ideal_response);
        } else {
          // Fallback to URL params if session doesn't have linked ideal response
          const urlIdealResponseId = searchParams.get("idealResponseId");
          if (urlIdealResponseId) {
            console.log(
              "📋 Falling back to ideal response from URL params:",
              urlIdealResponseId,
            );
            setIdealResponseId(urlIdealResponseId);
          }
        }
      } catch (err) {
        console.error("Error loading session:", err);
        setError(err instanceof Error ? err.message : "Failed to load session");
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [sessionId]);

  // // Handle loading state
  // if (loading) {
  //   return <LoadingFallback />;
  // }

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/workshop-assistant")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Handle no session state
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-xl mb-4">Session not found</div>
          <button
            onClick={() => router.push("/workshop-assistant")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Convert session responses to test cases format
  const testCases: TestCase[] = [
    {
      id: "session-test-case",
      input: session.test_case_prompt || "Session test case",
      context: session.test_case_scenario_category || "Session context",
      useCase: "session-loaded",
      scenarioCategory: session.test_case_scenario_category || "session",
    },
  ];

  // Convert session responses to model outputs format
  const sessionModelOutputs = session.responses.map((response, index) => ({
    id: response.id,
    modelId: `${response.provider}/${response.model}`,
    modelName: response.model,
    output: response.response_content,
    timestamp: response.created_at,
    rubricScores: {},
    feedback: "",
    suggestions: [],
    index: index,
  }));

  // Create TestCaseWithModelOutputs from session data
  const testCasesWithModelOutputs: TestCaseWithModelOutputs[] = [
    {
      id: "session-test-case",
      input: session.test_case_prompt || "Session test case",
      context: session.test_case_scenario_category || "Session context",
      modelOutputs: sessionModelOutputs,
      useCase: "session-loaded",
      scenarioCategory: session.test_case_scenario_category || "session",
    },
  ];

  // Create steps for the vertical stepper with consistent styling
  const steps = [
    {
      id: "setup",
      title: "Load Test Data",
      description: "Choose a set of test cases from a use case.",
      status: "completed" as const,
      isCollapsed: true,
      content: (
        <div className="space-y-6">
          {/* Test Case Navigation - using consistent styling */}
          <TestCaseNavigation
            testCases={testCases}
            selectedTestCaseIndex={0}
            onTestCaseSelect={() => {}} // No-op for read-only session
            className="mb-6"
            showContent={true}
          />
        </div>
      ),
    },
    {
      id: "analysis",
      title: "Test the Rubric",
      description: "Review possible responses to the selected test cases.",
      status: "completed" as const,
      isCollapsed: false,
      content: (
        <div className="space-y-6">
          {/* Model Outputs Grid with scoring - configured exactly like workshop-assistant */}
          <ModelOutputsGrid
            modelOutputs={testCasesWithModelOutputs[0]?.modelOutputs}
            testCases={testCases}
            selectedTestCaseIndex={0}
            onTestCaseSelect={() => {}} // No-op for read-only session
            stepId="analysis"
            className="space-y-4"
            showEvaluationFeatures={rubricId && idealResponseId ? true : false}
            isRealEvaluation={rubricId && idealResponseId ? true : false}
            currentPhase="complete"
            numOutputsToShow={numOutputsToShow}
            sessionId={sessionId}
            showFinalResultsHere={false}
            selectedCriteriaId={rubricId ?? undefined}
            selectedIdealResponseId={idealResponseId ?? undefined}
            idealResponses={idealResponses}
            isStreaming={false}
            isLoading={false}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - consistent with main page */}
      <SessionHeader sessionId={sessionId} />

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        <div className="space-y-6">
          {/* Vertical Stepper - consistent with main page */}
          <VerticalStepper steps={steps} />

          {/* Footer action - consistent with main page */}
          <div className="flex justify-center mb-8">
            <a
              href="/workshop-assistant"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
            >
              <RefreshIcon className="w-5 h-5" />
              Start Over
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
