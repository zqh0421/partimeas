'use client';

import { useState } from 'react';
import Link from 'next/link';

interface AnalysisHeaderFullProps {
  sessionId?: string | null;
  currentSessionId?: string | null;
  isGeneratingOutputs?: boolean; // Keep this prop for future use if needed
  groupId?: string | null;
  onEditGroupId?: () => void;
  onClearGroupId?: () => void;
}

export default function AnalysisHeaderFull({ 
  sessionId, 
  currentSessionId,
  isGeneratingOutputs = false,
  groupId,
  onEditGroupId,
  onClearGroupId
}: AnalysisHeaderFullProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyLink = async () => {
    // If we have a current session ID, use that; otherwise use the sessionId prop
    const activeSessionId = currentSessionId || sessionId;
    
    if (!activeSessionId) {
      // If no session ID, copy the current page URL
      await navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      return;
    }

    // Create sharable link with session ID - use new session page
    const baseUrl = window.location.origin;
    const sharableUrl = `${baseUrl}/workshop-assistant/session/${activeSessionId}`;
    
    try {
      await navigator.clipboard.writeText(sharableUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = sharableUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Show copy button only when we have a session ID returned from the API
  // AND we're not currently generating outputs (waiting for session ID)
  const shouldShowCopyButton = Boolean(currentSessionId || sessionId) && !isGeneratingOutputs;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm shadow-slate-300 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl text-slate-600">PartiMeas Workshop Assistant</h1>
            
            {/* Group ID Display */}
            {groupId && (
              <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1">
                <span className="text-sm text-blue-700 font-medium">Group:</span>
                <span className="text-sm text-blue-800">{groupId}</span>
                {onEditGroupId && (
                  <button
                    onClick={onEditGroupId}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                    title="Edit Group ID"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Show copy button only after session ID is returned */}
            {shouldShowCopyButton && (
              <button
                onClick={handleCopyLink}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  copySuccess
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100'
                }`}
                title="Copy sharable link"
              >
                {copySuccess ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
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