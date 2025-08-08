"use client";

import React from 'react';

interface CaseHeaderProps {
  name: string;
  testCasesCount: number;
  description: string;
  className?: string;
}

export default function CaseHeader({
  name,
  testCasesCount,
  description,
  className = ""
}: CaseHeaderProps) {
  return (
    <div className={`mb-3 ${className}`}>
      <h4 className="font-medium text-gray-900">
        {name}
      </h4>
      <div className="text-xs text-gray-500 mt-1">
        {testCasesCount} test cases
      </div>
      <p className="text-sm text-gray-600 mb-4">
        {description}
      </p>
    </div>
  );
} 