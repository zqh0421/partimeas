import { IdealResponseScore, IdealResponseCache } from '@/app/types';

export interface Selection {
  useCaseId: string;
  scenarioCategoryIds: string[];
}

// 旧的缓存结构 - 保持向后兼容
export interface SelectionCache {
  selections: Selection[];
  expandedUseCases: string[];
  selectedCriteriaVersionId?: string;
  selectedIdealResponseId?: string;
  lastUpdated: string;
  version: string;
}

// 新的独立缓存结构 - 每个selector有自己的缓存空间
export interface IndependentCache {
  multiLevelSelector?: {
    selections: Selection[];
    expandedUseCases: string[];
  };
  criteriaSelector?: {
    selectedCriteriaVersionId: string;
  };
  idealResponseSelector?: {
    selectedIdealResponseId: string;
  };
  lastUpdated: string;
  version: string;
}

const CACHE_KEY = 'partimeas_multi_level_selections';
const INDEPENDENT_CACHE_KEY = 'partimeas_independent_selections'; // 新的独立缓存键
const IDEAL_SCORES_CACHE_KEY = 'partimeas_ideal_response_scores';
const CACHE_VERSION = '1.1.0'; // Updated to support ideal responses
const INDEPENDENT_CACHE_VERSION = '2.0.0'; // 新的独立缓存版本
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

// 新的独立缓存管理器
class IndependentCacheManager {
  private memoryCache: IndependentCache | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeCache();
  }

  private initializeCache() {
    if (this.isInitialized) return;
    
    try {
      // 从localStorage加载缓存
      const cached = safeLocalStorage.getItem(INDEPENDENT_CACHE_KEY);
      if (cached) {
        const parsedCache: IndependentCache = JSON.parse(cached);
        
        // 检查缓存版本和过期时间
        if (this.isCacheValid(parsedCache)) {
          this.memoryCache = parsedCache;
          console.log('[IndependentCache] Loaded cached data from localStorage');
        } else {
          // 清除过期缓存
          safeLocalStorage.removeItem(INDEPENDENT_CACHE_KEY);
          console.log('[IndependentCache] Cleared expired cache');
        }
      }
    } catch (error) {
      console.warn('[IndependentCache] Failed to load cache from localStorage:', error);
      safeLocalStorage.removeItem(INDEPENDENT_CACHE_KEY);
    }
    
    this.isInitialized = true;
  }

  private isCacheValid(cache: IndependentCache): boolean {
    if (cache.version !== INDEPENDENT_CACHE_VERSION) return false;
    
    const lastUpdated = new Date(cache.lastUpdated);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
    
    return hoursDiff < CACHE_EXPIRY_HOURS;
  }

  private saveToLocalStorage() {
    if (this.memoryCache) {
      safeLocalStorage.setItem(INDEPENDENT_CACHE_KEY, JSON.stringify(this.memoryCache));
    }
  }

  // 获取当前缓存
  getCache(): IndependentCache {
    if (!this.memoryCache) {
      this.memoryCache = {
        lastUpdated: new Date().toISOString(),
        version: INDEPENDENT_CACHE_VERSION
      };
    }
    return this.memoryCache;
  }

  // 保存多级选择器数据
  saveMultiLevelSelections(selections: Selection[], expandedUseCases: Set<string> | string[]) {
    const cache = this.getCache();
    const expandedArray = Array.isArray(expandedUseCases) 
      ? expandedUseCases 
      : Array.from(expandedUseCases);

    cache.multiLevelSelector = {
      selections: [...selections],
      expandedUseCases: expandedArray
    };
    cache.lastUpdated = new Date().toISOString();
    
    this.saveToLocalStorage();
    console.log('[IndependentCache] Saved MultiLevelSelector data', {
      selectionsCount: selections.length,
      expandedCount: expandedArray.length
    });
  }

  // 恢复多级选择器数据
  restoreMultiLevelSelections(): { selections: Selection[]; expandedUseCases: Set<string>; } | null {
    const cache = this.getCache();
    if (!cache.multiLevelSelector) return null;

    return {
      selections: [...cache.multiLevelSelector.selections],
      expandedUseCases: new Set(cache.multiLevelSelector.expandedUseCases)
    };
  }

  // 保存标准选择器数据
  saveCriteriaSelection(selectedCriteriaVersionId: string) {
    const cache = this.getCache();
    cache.criteriaSelector = { selectedCriteriaVersionId };
    cache.lastUpdated = new Date().toISOString();
    
    this.saveToLocalStorage();
    console.log('[IndependentCache] Saved CriteriaSelector data:', selectedCriteriaVersionId);
  }

  // 恢复标准选择器数据
  restoreCriteriaSelection(): string | null {
    const cache = this.getCache();
    return cache.criteriaSelector?.selectedCriteriaVersionId || null;
  }

  // 保存理想回复选择器数据
  saveIdealResponseSelection(selectedIdealResponseId: string) {
    const cache = this.getCache();
    cache.idealResponseSelector = { selectedIdealResponseId };
    cache.lastUpdated = new Date().toISOString();
    
    this.saveToLocalStorage();
    console.log('[IndependentCache] Saved IdealResponseSelector data:', selectedIdealResponseId);
  }

  // 恢复理想回复选择器数据
  restoreIdealResponseSelection(): string | null {
    const cache = this.getCache();
    return cache.idealResponseSelector?.selectedIdealResponseId || null;
  }

  // 清除特定选择器的缓存
  clearCache(selector?: 'multiLevel' | 'criteria' | 'idealResponse') {
    const cache = this.getCache();
    
    if (!selector) {
      // 清除所有
      this.memoryCache = null;
      safeLocalStorage.removeItem(INDEPENDENT_CACHE_KEY);
      console.log('[IndependentCache] Cleared all cache');
    } else {
      // 清除特定选择器
      switch (selector) {
        case 'multiLevel':
          delete cache.multiLevelSelector;
          break;
        case 'criteria':
          delete cache.criteriaSelector;
          break;
        case 'idealResponse':
          delete cache.idealResponseSelector;
          break;
      }
      cache.lastUpdated = new Date().toISOString();
      this.saveToLocalStorage();
      console.log(`[IndependentCache] Cleared ${selector} cache`);
    }
  }

  // 获取缓存统计信息
  getCacheStats() {
    const cache = this.getCache();
    return {
      hasMultiLevelCache: !!cache.multiLevelSelector,
      hasCriteriaCache: !!cache.criteriaSelector,
      hasIdealResponseCache: !!cache.idealResponseSelector,
      lastUpdated: cache.lastUpdated,
      version: cache.version
    };
  }
}

// 创建单例实例
export const selectionCache = new SelectionCacheManager();
export const independentCache = new IndependentCacheManager();

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

// 新的独立缓存便捷函数
export const saveIndependentMultiLevelSelections = (selections: Selection[], expandedUseCases: Set<string> | string[]) =>
  independentCache.saveMultiLevelSelections(selections, expandedUseCases);

export const restoreIndependentMultiLevelSelections = () =>
  independentCache.restoreMultiLevelSelections();

export const saveIndependentCriteriaSelection = (selectedCriteriaVersionId: string) =>
  independentCache.saveCriteriaSelection(selectedCriteriaVersionId);

export const restoreIndependentCriteriaSelection = () =>
  independentCache.restoreCriteriaSelection();

export const saveIndependentIdealResponseSelection = (selectedIdealResponseId: string) =>
  independentCache.saveIdealResponseSelection(selectedIdealResponseId);

export const restoreIndependentIdealResponseSelection = () =>
  independentCache.restoreIdealResponseSelection();

export const clearIndependentCache = (selector?: 'multiLevel' | 'criteria' | 'idealResponse') =>
  independentCache.clearCache(selector);

// 调试函数 - 直接获取当前缓存状态用于调试
export const debugGetCurrentCache = () => {
  const oldCache = selectionCache.restoreSelections();
  const newCache = independentCache.getCacheStats();
  const fullNewCache = independentCache.getCache();
  
  console.log('[SelectionCache] DEBUG - Cache comparison:', {
    oldCacheSystem: {
      found: !!oldCache,
      criteriaVersionId: oldCache?.selectedCriteriaVersionId,
      idealResponseId: oldCache?.selectedIdealResponseId,
      selectionsCount: oldCache?.selections?.length || 0,
      expandedUseCasesCount: oldCache?.expandedUseCases?.size || 0
    },
    newIndependentCacheSystem: {
      stats: newCache,
      criteriaVersionId: independentCache.restoreCriteriaSelection(),
      idealResponseId: independentCache.restoreIdealResponseSelection(),
      multiLevelData: independentCache.restoreMultiLevelSelections(),
      fullCache: fullNewCache
    }
  });
  
  return { oldCache, newCache: fullNewCache };
};

// 在开发环境下将调试函数暴露到全局，方便在控制台调用
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).debugCache = debugGetCurrentCache;
  (window as any).independentCache = independentCache;
  console.log('[SelectionCache] Debug functions exposed: window.debugCache(), window.independentCache');
} 