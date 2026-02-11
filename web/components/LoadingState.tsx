import React from 'react';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showBackground?: boolean;
}

export default function LoadingState({ 
  message = 'Loading...', 
  size = 'md',
  className = '',
  showBackground = true
}: LoadingStateProps) {
  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const spinnerSizes = {
    sm: 'h-6 w-6 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-2'
  };

  const containerClasses = showBackground 
    ? 'min-h-screen bg-gray-50 flex items-center justify-center'
    : 'flex items-center justify-center';

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="text-center">
        <div
          className={`animate-spin rounded-full border-gray-200 border-t-blue-600 mx-auto mb-4 ${spinnerSizes[size]}`}
        ></div>
        <p className={`text-gray-600 ${textSizes[size]}`}>{message}</p>
      </div>
    </div>
  );
}
