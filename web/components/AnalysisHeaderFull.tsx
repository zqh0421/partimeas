"use client";

import Link from "next/link";
import { useState } from "react";

interface AnalysisHeaderFullProps {
  sessionId?: string | null;
  currentSessionId?: string | null;
  isGeneratingOutputs?: boolean; // Keep this prop for future use if needed
  groupId?: string | null;
  onEditGroupId?: () => void;
  onClearGroupId?: () => void;
  shareableLink?: string | null;
}

export default function AnalysisHeaderFull({
  sessionId,
  currentSessionId,
  isGeneratingOutputs = false,
  groupId,
  onEditGroupId,
  onClearGroupId,
  shareableLink,
}: AnalysisHeaderFullProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyLink = () => {
    if (shareableLink) {
      navigator.clipboard.writeText(shareableLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm shadow-slate-300 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl text-slate-600">
              PartiMeas Workshop Assistant
            </h1>

            {/* Group ID Display */}
            {groupId && (
              <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1">
                <span className="text-sm text-blue-700 font-medium">
                  Group:
                </span>
                <span className="text-sm text-blue-800">{groupId}</span>
                {onEditGroupId && (
                  <button
                    onClick={onEditGroupId}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                    title="Edit Group ID"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {/* Shareable link button */}
            {shareableLink && (
              <button
                onClick={handleCopyLink}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isCopied
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100"
                }`}
              >
                {isCopied ? (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy Sharable Link
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
