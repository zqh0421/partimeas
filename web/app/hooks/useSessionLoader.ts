import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SessionWithResponses } from '@/app/utils/sessionManager';

export interface UseSessionLoaderReturn {
  sessionId: string | null;
  sessionData: SessionWithResponses | null;
  isLoadingSession: boolean;
  sessionError: string | null;
  clearSession: () => void;
  loadSession: (id: string) => Promise<boolean>;
}

export function useSessionLoader(): UseSessionLoaderReturn {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<SessionWithResponses | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  
  // Wrap useSearchParams in try-catch to handle potential Suspense boundary issues
  let searchParams;
  let router;
  
  try {
    searchParams = useSearchParams();
    router = useRouter();
  } catch (error) {
    console.warn('useSearchParams or useRouter called outside of Suspense boundary:', error);
    // Provide fallback behavior
    searchParams = new URLSearchParams();
    router = {
      replace: (url: string) => {
        if (typeof window !== 'undefined') {
          window.location.href = url;
        }
      }
    };
  }

  // Load session data from API
  const loadSession = useCallback(async (id: string): Promise<boolean> => {
    setIsLoadingSession(true);
    setSessionError(null);
    
    try {
      const response = await fetch(`/api/sessions?action=byId&id=${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load session: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success || !data.session) {
        throw new Error('Session not found or invalid response');
      }
      
      const session = data.session as SessionWithResponses;
      
      // Validate that the session has the expected number of responses
      if (session.responses.length !== session.response_count) {
        throw new Error(`Session response count mismatch: expected ${session.response_count}, got ${session.responses.length}`);
      }
      
      setSessionData(session);
      setSessionId(id);
      return true;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error loading session';
      setSessionError(errorMessage);
      console.error('Session loading error:', error);
      return false;
    } finally {
      setIsLoadingSession(false);
    }
  }, []);

  // Clear session data and search params
  const clearSession = useCallback(() => {
    setSessionData(null);
    setSessionId(null);
    setSessionError(null);
    
    // Remove session param from URL
    try {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('session');
      const newUrl = `${window.location.pathname}${newSearchParams.toString() ? '?' + newSearchParams.toString() : ''}`;
      router.replace(newUrl);
    } catch (error) {
      console.warn('Failed to clear session from URL:', error);
      // Fallback: just reload the page
      if (typeof window !== 'undefined') {
        window.location.href = window.location.pathname;
      }
    }
  }, [searchParams, router]);

  // Check for session in URL on mount
  useEffect(() => {
    try {
      const sessionParam = searchParams.get('session');
      
      if (sessionParam && sessionParam !== sessionId) {
        loadSession(sessionParam);
      }
    } catch (error) {
      console.warn('Failed to get session from search params:', error);
    }
  }, [searchParams, sessionId, loadSession]);

  return {
    sessionId,
    sessionData,
    isLoadingSession,
    sessionError,
    clearSession,
    loadSession
  };
} 