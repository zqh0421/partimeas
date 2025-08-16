"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import { CheckIcon } from "@/app/components/icons";
import { STEP_COLORS, ANIMATIONS, themeUtils } from "@/utils/theme";

// Type definitions
interface LoadingContextType {
  registerLoading: (stepId: string, isLoading: boolean) => void;
  isStepLoading: (stepId: string) => boolean;
}

interface StepContextType {
  stepId: string;
}

interface Step {
  id: string;
  title: string;
  description?: string;
  content: ReactNode;
  status: "upcoming" | "current" | "completed";
  isCollapsed?: boolean;
  isLoading?: boolean;
}

// Style constants using new theme system
const STEP_STYLES = {
  upcoming: {
    circle: STEP_COLORS.pending.circle,
    title: STEP_COLORS.pending.text,
    description: STEP_COLORS.pending.text,
    background: STEP_COLORS.pending.background,
    border: STEP_COLORS.pending.border,
  },
  current: {
    circle: STEP_COLORS.current.circle,
    title: STEP_COLORS.current.text,
    description: STEP_COLORS.current.textSecondary,
    background: STEP_COLORS.current.background,
    border: STEP_COLORS.current.border,
    ring: STEP_COLORS.current.ring,
  },
  completed: {
    circle: STEP_COLORS.completed.circle,
    title: STEP_COLORS.completed.text,
    description: STEP_COLORS.completed.textSecondary,
    background: STEP_COLORS.completed.background,
    border: STEP_COLORS.completed.border,
  },
} as const;

const LoadingContext = createContext<LoadingContextType | null>(null);
const StepContext = createContext<StepContextType | null>(null);

// Utility functions
const getStepStyles = (status: Step["status"]) => STEP_STYLES[status];

const StepIndicator = ({
  step,
  index,
  shouldShowLoading,
}: {
  step: Step;
  index: number;
  shouldShowLoading: boolean;
}) => {
  const styles = getStepStyles(step.status);

  return (
    <div className="flex-shrink-0">
      <div className="relative">
        {/* Loading spinner */}
        {shouldShowLoading && step.status === "current" && (
          <div className="absolute -inset-2 w-12 h-12 flex items-center justify-center">
            <div
              className={themeUtils.cn(
                "w-full h-full border-2 rounded-full animate-spin",
                "border-blue-200 border-t-blue-600"
              )}
            ></div>
          </div>
        )}

        {/* Step circle */}
        <div
          className={themeUtils.cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium relative",
            ANIMATIONS.transition,
            styles.circle
          )}
        >
          {step.status === "completed" ? (
            <CheckIcon className="w-5 h-5" />
          ) : (
            <span>{index + 1}</span>
          )}
        </div>
      </div>
    </div>
  );
};

const StepHeader = ({ step }: { step: Step }) => {
  const styles = getStepStyles(step.status);

  return (
    <div className="mb-2">
      <h3
        className={themeUtils.cn(
          "text-lg font-medium",
          ANIMATIONS.transition,
          styles.title
        )}
      >
        {step.title}
      </h3>
      {step.description && (
        <p
          className={themeUtils.cn(
            "text-sm mt-1",
            ANIMATIONS.transition,
            styles.description
          )}
        >
          {step.description}
        </p>
      )}
    </div>
  );
};

/**
 * Hook for child components to register loading state automatically using current step context
 * Use this when the component knows it's inside the current step
 */
export const useCurrentStepLoading = (isLoading: boolean) => {
  const stepContext = useContext(StepContext);
  const loadingContext = useContext(LoadingContext);

  useEffect(() => {
    if (stepContext && loadingContext) {
      loadingContext.registerLoading(stepContext.stepId, isLoading);
    }
  }, [stepContext, loadingContext, isLoading]);
};

/**
 * Hook for child components to register loading state with explicit step ID
 * Use this when you need to control loading for a specific step
 */
export const useStepLoading = (stepId: string, isLoading: boolean) => {
  const context = useContext(LoadingContext);

  useEffect(() => {
    if (context) {
      context.registerLoading(stepId, isLoading);
    }
  }, [context, stepId, isLoading]);
};

// Context provider component for step content
const StepContent = ({
  stepId,
  children,
}: {
  stepId: string;
  children: ReactNode;
}) => {
  const stepContextValue = { stepId };

  return (
    <StepContext.Provider value={stepContextValue}>
      {children}
    </StepContext.Provider>
  );
};

/**
 * A vertical stepper component that displays a series of steps with loading states
 *
 * Features:
 * - Visual indicators for upcoming, current, and completed steps
 * - Loading spinner integration for current steps
 * - Collapsible content for completed steps
 * - Context providers for child components to register loading states
 */
export default function VerticalStepper({
  steps,
  className = "",
}: {
  steps: Step[];
  className?: string;
}) {
  const [loadingSteps, setLoadingSteps] = useState<Record<string, boolean>>({});

  // Loading context implementation
  const loadingContext: LoadingContextType = {
    registerLoading: (stepId: string, isLoading: boolean) => {
      setLoadingSteps((prev) => {
        if (prev[stepId] === isLoading) return prev;
        return { ...prev, [stepId]: isLoading };
      });
    },
    isStepLoading: (stepId: string) => !!loadingSteps[stepId],
  };

  return (
    <LoadingContext.Provider value={loadingContext}>
      <div className={`space-y-8 ${className}`}>
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const shouldShowLoading =
            step.isLoading ||
            (step.status === "current" &&
              loadingContext.isStepLoading(step.id));
          const styles = getStepStyles(step.status);

          return (
            <div key={step.id} className="relative">
              {/* Connector line */}
              {!isLast && (
                <div
                  className={themeUtils.cn(
                    "absolute left-[15px] top-10 w-0.5 h-[calc(100%-1rem)]",
                    "connector" in styles
                      ? (styles as any).connector
                      : "bg-slate-200/50"
                  )}
                />
              )}

              <div className="flex items-start space-x-4">
                <StepIndicator
                  step={step}
                  index={index}
                  shouldShowLoading={shouldShowLoading}
                />

                <div className="flex-1 min-w-0">
                  <StepHeader step={step} />

                  {/* Step content */}
                  {(step.status === "current" ||
                    (step.status === "completed" && !step.isCollapsed)) && (
                    <div
                      className={themeUtils.cn(
                        "rounded-lg p-6 border shadow-sm",
                        ANIMATIONS.slideUp,
                        styles.background || "bg-white border-neutral-200",
                        step.status === "current" && "ring" in styles
                          ? `ring-1 ${styles.ring}`
                          : ""
                      )}
                    >
                      <StepContent stepId={step.id}>{step.content}</StepContent>
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
