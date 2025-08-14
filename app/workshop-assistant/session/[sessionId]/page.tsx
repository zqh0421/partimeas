'use client';
import { Suspense, useEffect, useState, use } from 'react';
import VerticalStepper from '@/components/steps/VerticalStepper';
import { RefreshIcon } from '@/components/icons';
import SessionHeader from '@/components/SessionHeader';
import { TestCase, TestCaseWithModelOutputs } from '@/types';
import type { SessionWithResponses } from '@/utils/sessionManager';
import { useRouter } from 'next/navigation';
import TestCaseNavigation from '@/components/TestCaseNavigation';
import ModelOutputsGrid from '@/components/ModelOutputsGrid';

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-blue-600"></div>
        </div>
      </div>
    </div>
  );
}

// Client component for session display
function SessionPageContent({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<SessionWithResponses | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadSession = async () => {
      try {
        console.log('🔍 Attempting to load session:', sessionId);
        setLoading(true);
        
        // Fetch session data via API to avoid client-side DB access
        const response = await fetch(`/api/sessions?action=byId&id=${sessionId}`);
        if (!response.ok) {
          throw new Error(`Failed to load session: ${response.status}`);
        }
        const data = await response.json();
        const sessionData: SessionWithResponses | null = data?.success ? data.session : null;
        console.log('📋 Session data loaded:', sessionData ? 'success' : 'not found');
        
        if (!sessionData) {
          console.log('❌ Session not found');
          setError('Session not found');
          return;
        }

        // Validate that the session has the expected number of responses
        console.log(`📊 Session validation: ${sessionData.responses.length} responses, expected ${sessionData.response_count}`);
        if (sessionData.responses.length !== sessionData.response_count) {
          throw new Error(`Session response count mismatch: expected ${sessionData.response_count}, got ${sessionData.responses.length}`);
        }
        
        console.log('✅ Session validation passed');
        setSession(sessionData);
      } catch (err) {
        console.error('Error loading session:', err);
        setError(err instanceof Error ? err.message : 'Failed to load session');
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [sessionId]);

  // Handle loading state
  if (loading) {
    return <LoadingFallback />;
  }

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/workshop-assistant')}
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
            onClick={() => router.push('/workshop-assistant')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Convert session responses to test cases format
  const testCases: TestCase[] = [{
    id: 'session-test-case',
    input: session.test_case_prompt || 'Session test case',
    context: session.test_case_scenario_category || 'Session context',
    useCase: 'session-loaded',
    scenarioCategory: session.test_case_scenario_category || 'session'
  }];

  // Convert session responses to model outputs format
  const sessionModelOutputs = session.responses.map((response) => ({
    id: response.id,
    modelId: `${response.provider}/${response.model}`,
    modelName: response.model,
    output: response.response_content,
    timestamp: response.created_at,
    rubricScores: {},
    feedback: '',
    suggestions: []
  }));

  // Create TestCaseWithModelOutputs from session data
  const testCasesWithModelOutputs: TestCaseWithModelOutputs[] = [{
    id: 'session-test-case',
    input: session.test_case_prompt || 'Session test case',
    context: session.test_case_scenario_category || 'Session context',
    modelOutputs: sessionModelOutputs,
    useCase: 'session-loaded',
    scenarioCategory: session.test_case_scenario_category || 'session'
  }];

  // No handlers needed for read-only session page

  // Create steps for the vertical stepper with consistent styling
  const steps = [
    {
      id: 'setup',
      title: 'Load Test Cases',
      description: 'Choose a set of test cases from a use case.',
      status: 'completed' as const,
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
      )
    },
    {
      id: 'analysis',
      title: 'Test the Rubric',
      description: 'Review possible responses to the selected test cases.',
      status: 'completed' as const,
      isCollapsed: false,
      content: (
        <div className="space-y-6">
          {/* Model Outputs Grid - using consistent styling */}
          <ModelOutputsGrid
            modelOutputs={testCasesWithModelOutputs[0]?.modelOutputs}
            testCases={testCases}
            selectedTestCaseIndex={0}
            onTestCaseSelect={() => {}} // No-op for read-only session
            stepId="analysis"
            className=""
            showEvaluationFeatures={false}
            isRealEvaluation={false}
            currentPhase="complete"
            numOutputsToShow={testCasesWithModelOutputs[0]?.modelOutputs.length || 0}
            sessionId={sessionId}
          />
        </div>
      )
    }
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

export default function SessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SessionPageContent sessionId={sessionId} />
    </Suspense>
  );
} 