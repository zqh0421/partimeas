/**
 * Session-based caching for scores and rationales
 * Caches data by session ID and criterion num, independent of rubric content
 */

interface ScoreData {
  score: number;
  rationale: string;
}

interface SessionCache {
  [sessionId: string]: {
    [criterionNum: number]: {
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
export function getCachedSessionData(
  sessionId: string | null | undefined
): Record<number, Record<string, ScoreData>> {
  if (!sessionId) return {};

  const cache = getCache();
  return cache[sessionId] || {};
}

/**
 * Cache a score and rationale for a specific session, criterion num, and response
 */
export function cacheSessionScore(
  sessionId: string | null | undefined,
  criterionNum: number,
  responseId: string,
  score: number,
  rationale: string
): void {
  if (!sessionId) return;

  const cache = getCache();

  if (!cache[sessionId]) {
    cache[sessionId] = {};
  }

  if (!cache[sessionId][criterionNum]) {
    cache[sessionId][criterionNum] = {};
  }

  cache[sessionId][criterionNum][responseId] = {
    score,
    rationale,
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

export type PointValue = Record<string, number>;
export type PointOption = Record<string, PointValue>;

/**
 * Get all cached data for restoring state
 * @param criterionNums - Array of criterion num values for mapping cached data
 */
export function restoreSessionScores(
  sessionId: string | null | undefined,
  criterionNums: number[],
  responseIds: string[]
): {
  scores: PointOption;
  rationales: Record<string, Record<string, string>>;
} {
  if (!sessionId) {
    return { scores: {}, rationales: {} };
  }

  const cachedData = getCachedSessionData(sessionId);
  const scores: PointOption = {};
  const rationales: Record<string, Record<string, string>> = {};

  // Initialize empty structure for all criteria by their num
  criterionNums.forEach((num, index) => {
    const rowId = `criterion-${num}`;
    scores[rowId] = {};
    rationales[rowId] = {};

    // Fill in cached data if available
    if (cachedData[num]) {
      for (const responseId of responseIds) {
        const cached = cachedData[num][responseId];
        if (cached) {
          scores[rowId][responseId] = cached.score;
          rationales[rowId][responseId] = cached.rationale;
        } else {
          scores[rowId][responseId] = 0;
          rationales[rowId][responseId] = "";
        }
      }
    } else {
      // No cached data for this criterion, initialize empty
      for (const responseId of responseIds) {
        scores[rowId][responseId] = 0;
        rationales[rowId][responseId] = "";
      }
    }
  });

  return { scores, rationales };
}

/**
 * Cache all scores and rationales at once (batch update)
 * @param criterionNumMap - Map of item IDs to their num values
 */
export function batchCacheSessionData(
  sessionId: string | null | undefined,
  scores: PointOption,
  rationales: Record<string, Record<string, string>>,
  criterionNumMap: Record<string, number>
): void {
  if (!sessionId) return;

  const cache = getCache();

  if (!cache[sessionId]) {
    cache[sessionId] = {};
  }

  // Convert from rubric item IDs to criterion nums
  Object.keys(scores).forEach((itemId) => {
    const num = criterionNumMap[itemId];
    if (num === undefined) return; // Skip if no num mapping

    if (!cache[sessionId][num]) {
      cache[sessionId][num] = {};
    }

    Object.keys(scores[itemId]).forEach((responseId) => {
      cache[sessionId][num][responseId] = {
        score: scores[itemId][responseId],
        rationale: rationales[itemId]?.[responseId] || "",
      };
    });
  });

  saveCache(cache);
}
