import { IdealResponseScore, IdealResponseCache } from '@/app/types';

export interface Selection {
  useCaseId: string;
  scenarioCategoryIds: string[];
}

export interface SelectionCache {
  selections: Selection[];
  expandedUseCases: string[];
  selectedCriteriaVersionId?: string;
  selectedIdealResponseId?: string;
  lastUpdated: string;
  version: string;
}

const CACHE_KEY = 'partimeas_multi_level_selections';
const IDEAL_SCORES_CACHE_KEY = 'partimeas_ideal_response_scores';
const CACHE_VERSION = '1.1.0'; // Updated to support ideal responses
const CACHE_EXPIRY_HOURS = 0.5; // 缓存30分钟

// 检查localStorage是否可用
const isLocalStorageAvailable = (): boolean => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

// 安全的localStorage包装器
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (!isLocalStorageAvailable()) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (!isLocalStorageAvailable()) return;
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('[SelectionCache] Failed to save to localStorage:', error);
    }
  },
  removeItem: (key: string): void => {
    if (!isLocalStorageAvailable()) return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('[SelectionCache] Failed to remove from localStorage:', error);
    }
  }
};

class SelectionCacheManager {
  private memoryCache: Map<string, SelectionCache> = new Map();
  private isInitialized = false;

  constructor() {
    this.initializeCache();
  }

  private initializeCache() {
    if (this.isInitialized) return;
    
    try {
      // 从localStorage加载缓存
      const cached = safeLocalStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache: SelectionCache = JSON.parse(cached);
        
        // 检查缓存版本和过期时间
        if (this.isCacheValid(parsedCache)) {
          this.memoryCache.set('default', parsedCache);
          console.log('[SelectionCache] Loaded cached selections from localStorage');
        } else {
          // 清除过期缓存
          safeLocalStorage.removeItem(CACHE_KEY);
          console.log('[SelectionCache] Cleared expired cache');
        }
      }
    } catch (error) {
      console.warn('[SelectionCache] Failed to load cache from localStorage:', error);
      // 清除损坏的缓存
      safeLocalStorage.removeItem(CACHE_KEY);
    }
    
    this.isInitialized = true;
  }

  private isCacheValid(cache: SelectionCache): boolean {
    if (cache.version !== CACHE_VERSION) return false;
    
    const lastUpdated = new Date(cache.lastUpdated);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
    
    return hoursDiff < CACHE_EXPIRY_HOURS;
  }

  private saveToLocalStorage(cache: SelectionCache) {
    safeLocalStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  }

  // 保存选择状态
  saveSelections(
    selections: Selection[], 
    expandedUseCases: Set<string> | string[],
    selectedCriteriaVersionId?: string,
    selectedIdealResponseId?: string,
    cacheKey: string = 'default'
  ) {
    const expandedArray = Array.isArray(expandedUseCases) 
      ? expandedUseCases 
      : Array.from(expandedUseCases);

    const cache: SelectionCache = {
      selections: [...selections],
      expandedUseCases: expandedArray,
      selectedCriteriaVersionId,
      selectedIdealResponseId,
      lastUpdated: new Date().toISOString(),
      version: CACHE_VERSION
    };

    // 保存到内存缓存
    this.memoryCache.set(cacheKey, cache);
    
    // 保存到localStorage
    this.saveToLocalStorage(cache);
    
    console.log(`[SelectionCache] Saved selections for key: ${cacheKey}`, {
      selectionsCount: selections.length,
      expandedCount: expandedArray.length,
      criteriaVersionId: selectedCriteriaVersionId,
      idealResponseId: selectedIdealResponseId
    });
  }

  // 恢复选择状态
  restoreSelections(cacheKey: string = 'default'): {
    selections: Selection[];
    expandedUseCases: Set<string>;
    selectedCriteriaVersionId?: string;
    selectedIdealResponseId?: string;
  } | null {
    const cache = this.memoryCache.get(cacheKey);
    
    if (!cache) {
      console.log(`[SelectionCache] No cache found for key: ${cacheKey}`);
      return null;
    }

    if (!this.isCacheValid(cache)) {
      console.log(`[SelectionCache] Cache expired for key: ${cacheKey}`);
      this.memoryCache.delete(cacheKey);
      return null;
    }

    console.log(`[SelectionCache] Restored selections for key: ${cacheKey}`, {
      selectionsCount: cache.selections.length,
      expandedCount: cache.expandedUseCases.length,
      criteriaVersionId: cache.selectedCriteriaVersionId,
      idealResponseId: cache.selectedIdealResponseId
    });

    return {
      selections: [...cache.selections],
      expandedUseCases: new Set(cache.expandedUseCases),
      selectedCriteriaVersionId: cache.selectedCriteriaVersionId,
      selectedIdealResponseId: cache.selectedIdealResponseId
    };
  }

  // 清除特定缓存
  clearCache(cacheKey: string = 'default') {
    this.memoryCache.delete(cacheKey);
    
    if (cacheKey === 'default') {
      safeLocalStorage.removeItem(CACHE_KEY);
    }
    
    console.log(`[SelectionCache] Cleared cache for key: ${cacheKey}`);
  }

  // 清除所有缓存
  clearAllCaches() {
    this.memoryCache.clear();
    safeLocalStorage.removeItem(CACHE_KEY);
    console.log('[SelectionCache] Cleared all caches');
  }

  // 获取缓存统计信息
  getCacheStats() {
    return {
      memoryCacheSize: this.memoryCache.size,
      localStorageAvailable: typeof localStorage !== 'undefined',
      isInitialized: this.isInitialized
    };
  }

  // 检查是否有缓存
  hasCache(cacheKey: string = 'default'): boolean {
    const cache = this.memoryCache.get(cacheKey);
    return cache ? this.isCacheValid(cache) : false;
  }
}

// 创建单例实例
export const selectionCache = new SelectionCacheManager();

// 导出便捷函数
export const saveSelections = (
  selections: Selection[], 
  expandedUseCases: Set<string> | string[],
  selectedCriteriaVersionId?: string,
  selectedIdealResponseId?: string,
  cacheKey?: string
) => selectionCache.saveSelections(selections, expandedUseCases, selectedCriteriaVersionId, selectedIdealResponseId, cacheKey);

export const restoreSelections = (cacheKey?: string) => 
  selectionCache.restoreSelections(cacheKey);

export const clearSelectionCache = (cacheKey?: string) => 
  selectionCache.clearCache(cacheKey);

export const clearAllSelectionCaches = () => 
  selectionCache.clearAllCaches();

// 专门用于保存和恢复criteria版本选择的便捷函数
export const saveCriteriaVersionSelection = (selectedCriteriaVersionId: string) => {
  // 获取现有缓存，保持其他选择不变
  const existing = selectionCache.restoreSelections();
  if (existing) {
    selectionCache.saveSelections(
      existing.selections,
      existing.expandedUseCases,
      selectedCriteriaVersionId,
      existing.selectedIdealResponseId
    );
  } else {
    // 如果没有现有缓存，创建新的
    selectionCache.saveSelections([], [], selectedCriteriaVersionId);
  }
};

export const restoreCriteriaVersionSelection = (): string | null => {
  const restored = selectionCache.restoreSelections();
  return restored?.selectedCriteriaVersionId || null;
};

// 专门用于保存和恢复ideal response选择的便捷函数
export const saveIdealResponseSelection = (selectedIdealResponseId: string) => {
  // 获取现有缓存，保持其他选择不变
  const existing = selectionCache.restoreSelections();
  if (existing) {
    selectionCache.saveSelections(
      existing.selections,
      existing.expandedUseCases,
      existing.selectedCriteriaVersionId,
      selectedIdealResponseId
    );
  } else {
    // 如果没有现有缓存，创建新的
    selectionCache.saveSelections([], [], undefined, selectedIdealResponseId);
  }
};

export const restoreIdealResponseSelection = (): string | null => {
  const restored = selectionCache.restoreSelections();
  return restored?.selectedIdealResponseId || null;
};

// 理想回复分数缓存管理
const IDEAL_SCORES_CACHE = new Map<string, IdealResponseCache>();

export const saveIdealResponseScores = (
  idealResponseId: string,
  scores: IdealResponseScore[]
) => {
  const cache: IdealResponseCache = {
    selectedIdealResponseId: idealResponseId,
    scores: [...scores],
    lastUpdated: new Date().toISOString(),
  };

  IDEAL_SCORES_CACHE.set(idealResponseId, cache);
  
  // 也保存到localStorage
  safeLocalStorage.setItem(
    `${IDEAL_SCORES_CACHE_KEY}_${idealResponseId}`,
    JSON.stringify(cache)
  );

  console.log(`[SelectionCache] Saved ideal response scores for: ${idealResponseId}`, {
    scoresCount: scores.length,
    scores: scores,
    localStorage_key: `${IDEAL_SCORES_CACHE_KEY}_${idealResponseId}`,
  });
};

export const restoreIdealResponseScores = (
  idealResponseId: string
): IdealResponseScore[] => {
  // 首先从内存缓存中获取
  let cache = IDEAL_SCORES_CACHE.get(idealResponseId);
  
  // 如果内存中没有，尝试从localStorage恢复
  if (!cache) {
    const stored = safeLocalStorage.getItem(`${IDEAL_SCORES_CACHE_KEY}_${idealResponseId}`);
    if (stored) {
      try {
        cache = JSON.parse(stored);
        if (cache) {
          IDEAL_SCORES_CACHE.set(idealResponseId, cache);
        }
      } catch (error) {
        console.warn(`[SelectionCache] Failed to parse ideal response scores for ${idealResponseId}:`, error);
      }
    }
  }

  const result = cache?.scores || [];
  console.log(`[SelectionCache] Restored ideal response scores for: ${idealResponseId}`, {
    found: !!cache,
    scoresCount: result.length,
    localStorage_key: `${IDEAL_SCORES_CACHE_KEY}_${idealResponseId}`,
    scores: result,
  });
  return result;
};

export const clearIdealResponseScores = (idealResponseId: string) => {
  IDEAL_SCORES_CACHE.delete(idealResponseId);
  safeLocalStorage.removeItem(`${IDEAL_SCORES_CACHE_KEY}_${idealResponseId}`);
  console.log(`[SelectionCache] Cleared ideal response scores for: ${idealResponseId}`);
}; 