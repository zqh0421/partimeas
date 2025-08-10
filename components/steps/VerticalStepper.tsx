'use client';

import { ReactNode, createContext, useContext, useState, useEffect } from 'react';

// Loading detection context
interface LoadingContextType {
  registerLoading: (stepId: string, isLoading: boolean) => void;
  isStepLoading: (stepId: string) => boolean;
}

// Current step context for easier usage by child components
interface StepContextType {
  stepId: string;
}

const LoadingContext = createContext<LoadingContextType | null>(null);
const StepContext = createContext<StepContextType | null>(null);

// Hook for child components to register their loading state automatically using current step context
export const useCurrentStepLoading = (isLoading: boolean) => {
  const stepContext = useContext(StepContext);
  const loadingContext = useContext(LoadingContext);
  
  useEffect(() => {
    if (stepContext && loadingContext) {
      loadingContext.registerLoading(stepContext.stepId, isLoading);
    }
  }, [stepContext, loadingContext, isLoading]);
};

// Hook for child components to register their loading state with explicit step ID
export const useStepLoading = (stepId: string, isLoading: boolean) => {
  const context = useContext(LoadingContext);
  useEffect(() => {
    if (context) {
      context.registerLoading(stepId, isLoading);
    }
  }, [context, stepId, isLoading]);
};

// Context provider component for step content
const StepContent = ({ stepId, children }: { stepId: string; children: ReactNode }) => {
  const stepContextValue = { stepId };
  
  return (
    <StepContext.Provider value={stepContextValue}>
      {children}
    </StepContext.Provider>
  );
};

interface Step {
  id: string;
  title: string;
  description?: string;
  content: ReactNode;
  status: 'upcoming' | 'current' | 'completed';
  isCollapsed?: boolean;
  isLoading?: boolean;
}

interface VerticalStepperProps {
  steps: Step[];
  className?: string;
}

export default function VerticalStepper({ steps, className = '' }: VerticalStepperProps) {
  const [loadingSteps, setLoadingSteps] = useState<Record<string, boolean>>({});

  // Loading context implementation
  const loadingContext: LoadingContextType = {
    registerLoading: (stepId: string, isLoading: boolean) => {
      console.log(`🔄 Loading state registered for step ${stepId}: ${isLoading}`);
      setLoadingSteps(prev => {
        if (prev[stepId] === isLoading) return prev;
        const newState = { ...prev, [stepId]: isLoading };
        console.log('🔄 Updated loading steps:', newState);
        return newState;
      });
    },
    isStepLoading: (stepId: string) => !!loadingSteps[stepId]
  };

  return (
    <LoadingContext.Provider value={loadingContext}>
      <div className={`space-y-8 ${className}`}>
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          // Determine if step should show loading: manual isLoading prop OR (current step AND has loading children)
          const shouldShowLoading = step.isLoading || (step.status === 'current' && loadingContext.isStepLoading(step.id));
          
          if (step.status === 'current') {
            console.log(`🔄 Step ${step.id} (current): shouldShowLoading=${shouldShowLoading}, step.isLoading=${step.isLoading}, loadingContext.isStepLoading=${loadingContext.isStepLoading(step.id)}`);
          }
        
        return (
          <div key={step.id} className="relative">
            {/* Step connector line */}
            {!isLast && (
              <div className="absolute left-4 top-10 w-0.5 h-[calc(100%-1.5rem)] bg-gray-200"></div>
            )}
            
            <div className="flex items-start space-x-4">
              {/* Step indicator */}
              <div className="flex-shrink-0">
                <div className="relative">
                  {/* Outer loading spinner ring - only show when loading */}
                  {shouldShowLoading && step.status === 'current' && (
                    <div className="absolute -inset-1 w-10 h-10">
                      <div className="w-full h-full border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                  )}
                  
                  {/* Main step circle */}
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium relative
                      ${step.status === 'completed' 
                        ? 'bg-green-600 text-white' 
                        : step.status === 'current'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                      }
                    `}
                  >
                    {step.status === 'completed' ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Step content */}
              <div className="flex-1 min-w-0">
                <div className="mb-2">
                  <h3
                    className={`
                      text-lg font-medium
                      ${step.status === 'completed' 
                        ? 'text-green-900' 
                        : step.status === 'current'
                        ? 'text-blue-900'
                        : 'text-gray-500'
                      }
                    `}
                  >
                    {step.title}
                  </h3>
                  {step.description && (
                    <p
                      className={`
                        text-sm
                        ${step.status === 'completed' 
                          ? 'text-green-700' 
                          : step.status === 'current'
                          ? 'text-blue-700'
                          : 'text-gray-500'
                        }
                      `}
                    >
                      {step.description}
                    </p>
                  )}
                </div>
                
                {/* Step content - show if current, completed, or explicitly not collapsed */}
                {(step.status === 'current' || (step.status === 'completed' && !step.isCollapsed)) && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <StepContent stepId={step.id}>
                      {step.content}
                    </StepContent>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
      </div>
    </LoadingContext.Provider>
  );
}