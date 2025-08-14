import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SessionWithResponses } from '@/utils/sessionManager';

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
  
  const searchParams = useSearchParams();
  const router = useRouter();

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
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('session');
    const newUrl = `${window.location.pathname}${newSearchParams.toString() ? '?' + newSearchParams.toString() : ''}`;
    router.replace(newUrl);
  }, [searchParams, router]);

  // Check for session in URL on mount
  useEffect(() => {
    const sessionParam = searchParams.get('session');
    
    if (sessionParam && sessionParam !== sessionId) {
      loadSession(sessionParam);
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