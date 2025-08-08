'use client';

import { ReactNode } from 'react';

interface Step {
  id: string;
  title: string;
  description?: string;
  content: ReactNode;
  status: 'upcoming' | 'current' | 'completed';
  isCollapsed?: boolean;
}

interface VerticalStepperProps {
  steps: Step[];
  className?: string;
}

export default function VerticalStepper({ steps, className = '' }: VerticalStepperProps) {
  return (
    <div className={`space-y-8 ${className}`}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        
        return (
          <div key={step.id} className="relative">
            {/* Step connector line */}
            {!isLast && (
              <div className="absolute left-4 top-10 w-0.5 h-8 bg-gray-200"></div>
            )}
            
            <div className="flex items-start space-x-4">
              {/* Step indicator */}
              <div className="flex-shrink-0">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
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
                    {step.content}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}