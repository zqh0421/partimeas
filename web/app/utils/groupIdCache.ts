/**
 * Utility functions for managing group ID cache
 */

const GROUP_ID_KEY = 'partimeas_group_id';

/**
 * Get the cached group ID from localStorage
 */
export function getCachedGroupId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    const groupId = localStorage.getItem(GROUP_ID_KEY);
    console.log('[GroupIdCache] Retrieved group ID from cache:', groupId);
    return groupId;
  } catch (error) {
    console.error('[GroupIdCache] Error retrieving group ID from cache:', error);
    return null;
  }
}

/**
 * Save group ID to localStorage
 */
export function saveGroupIdToCache(groupId: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(GROUP_ID_KEY, groupId);
    console.log('[GroupIdCache] Saved group ID to cache:', groupId);
  } catch (error) {
    console.error('[GroupIdCache] Error saving group ID to cache:', error);
  }
}

/**
 * Clear group ID from localStorage
 */
export function clearCachedGroupId(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.removeItem(GROUP_ID_KEY);
    console.log('[GroupIdCache] Cleared group ID from cache');
  } catch (error) {
    console.error('[GroupIdCache] Error clearing group ID from cache:', error);
  }
}