/**
 * Session-based caching for scores and rationales
 * Caches data by session ID and row index, independent of rubric content
 */

interface ScoreData {
  score: number | "";
  rationale: string;
}

interface SessionCache {
  [sessionId: string]: {
    [rowIndex: number]: {
      [responseId: string]: ScoreData;
    };
  };
}

const CACHE_KEY = "sessionScoreCache";

/**
 * Get the cache from localStorage
 */
function getCache(): SessionCache {
  if (typeof window === "undefined") return {};
  
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch (error) {
    console.error("Error reading session cache:", error);
    return {};
  }
}

/**
 * Save the cache to localStorage
 */
function saveCache(cache: SessionCache): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error("Error saving session cache:", error);
  }
}

/**
 * Get cached scores and rationales for a session
 */
export function getCachedSessionData(sessionId: string | null | undefined): Record<number, Record<string, ScoreData>> {
  if (!sessionId) return {};
  
  const cache = getCache();
  return cache[sessionId] || {};
}

/**
 * Cache a score and rationale for a specific session, row, and response
 */
export function cacheSessionScore(
  sessionId: string | null | undefined,
  rowIndex: number,
  responseId: string,
  score: number | "",
  rationale: string
): void {
  if (!sessionId) return;
  
  const cache = getCache();
  
  if (!cache[sessionId]) {
    cache[sessionId] = {};
  }
  
  if (!cache[sessionId][rowIndex]) {
    cache[sessionId][rowIndex] = {};
  }
  
  cache[sessionId][rowIndex][responseId] = {
    score,
    rationale
  };
  
  saveCache(cache);
}

/**
 * Clear cache for a specific session
 */
export function clearSessionCache(sessionId: string | null | undefined): void {
  if (!sessionId) return;
  
  const cache = getCache();
  delete cache[sessionId];
  saveCache(cache);
}

/**
 * Get all cached data for restoring state
 */
export function restoreSessionScores(
  sessionId: string | null | undefined,
  rowCount: number,
  responseIds: string[]
): {
  scores: Record<string, Record<string, number | "">>;
  rationales: Record<string, Record<string, string>>;
} {
  if (!sessionId) {
    return { scores: {}, rationales: {} };
  }
  
  const cachedData = getCachedSessionData(sessionId);
  const scores: Record<string, Record<string, number | "">> = {};
  const rationales: Record<string, Record<string, string>> = {};
  
  // Initialize empty structure for all rows
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const rowId = `row-${rowIndex}`;
    scores[rowId] = {};
    rationales[rowId] = {};
    
    // Fill in cached data if available
    if (cachedData[rowIndex]) {
      for (const responseId of responseIds) {
        const cached = cachedData[rowIndex][responseId];
        if (cached) {
          scores[rowId][responseId] = cached.score;
          rationales[rowId][responseId] = cached.rationale;
        } else {
          scores[rowId][responseId] = "";
          rationales[rowId][responseId] = "";
        }
      }
    } else {
      // No cached data for this row, initialize empty
      for (const responseId of responseIds) {
        scores[rowId][responseId] = "";
        rationales[rowId][responseId] = "";
      }
    }
  }
  
  return { scores, rationales };
}

/**
 * Cache all scores and rationales at once (batch update)
 */
export function batchCacheSessionData(
  sessionId: string | null | undefined,
  scores: Record<string, Record<string, number | "">>,
  rationales: Record<string, Record<string, string>>
): void {
  if (!sessionId) return;
  
  const cache = getCache();
  
  if (!cache[sessionId]) {
    cache[sessionId] = {};
  }
  
  // Convert from rubric item IDs to row indices
  Object.keys(scores).forEach((itemId, rowIndex) => {
    if (!cache[sessionId][rowIndex]) {
      cache[sessionId][rowIndex] = {};
    }
    
    Object.keys(scores[itemId]).forEach(responseId => {
      cache[sessionId][rowIndex][responseId] = {
        score: scores[itemId][responseId],
        rationale: rationales[itemId]?.[responseId] || ""
      };
    });
  });
  
  saveCache(cache);
}