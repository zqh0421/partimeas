'use client';

import { useState } from 'react';

interface SessionHeaderProps {
  sessionId: string;
}

export default function SessionHeader({ sessionId }: SessionHeaderProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyLink = async () => {
    // Create sharable link with session ID
    const baseUrl = window.location.origin;
    const sharableUrl = `${baseUrl}/workshop-assistant/session/${sessionId}`;
    
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

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm shadow-slate-300 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl text-slate-600">PartiMeas Workshop Assistant</h1>
          </div>
          
          <div className="flex items-center space-x-3">
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
          </div>
        </div>
      </div>
    </div>
  );
} 