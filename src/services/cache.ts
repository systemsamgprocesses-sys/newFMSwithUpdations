/**
 * Simple in-memory cache with TTL (Time To Live)
 * Provides better performance by caching API responses
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  
  /**
   * Set cache entry with TTL in milliseconds
   */
  set<T>(key: string, data: T, ttl: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  /**
   * Get cache entry if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    const now = Date.now();
    const age = now - entry.timestamp;
    
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  /**
   * Clear specific cache entry
   */
  clear(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clear all cache entries
   */
  clearAll(): void {
    this.cache.clear();
  }
  
  /**
   * Clear expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Invalidate cache entries matching pattern
   */
  invalidatePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const cache = new CacheService();

// Cleanup expired entries every 5 minutes
setInterval(() => cache.cleanup(), 5 * 60 * 1000);

export default cache;

