'use client';

import { useEffect } from 'react';

export default function LangSmithProvider() {
  useEffect(() => {
    // Initialize LangSmith environment variables on the client side
    if (typeof window !== 'undefined') {
      // Set LangChain environment variables for tracing
      if (process.env.NEXT_PUBLIC_LANGSMITH_API_KEY) {
        // Note: These need to be set on the server side for API routes
        console.log('LangSmith API key available on client side');
      }
    }
  }, []);

  return null; // This component doesn't render anything
} 