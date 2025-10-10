/**
 * Enhanced cache with TTL, LRU eviction, localStorage persistence, and smarter invalidation
 * Provides better performance by caching API responses intelligently
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  lastAccessed: number;
}

class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxSize: number = 100; // Maximum cache entries (LRU eviction)
  private storageKey: string = 'fms_cache_v1';
  private persistentKeys: Set<string> = new Set([
    'getUsers',
    'getAllFMS',
    'getTaskUsers',
    'getAllDepartments'
  ]); // Keys that should persist across sessions
  
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0
  };
  
  constructor() {
    // Load persistent cache from localStorage on initialization
    this.loadFromStorage();
    
    // Save to localStorage periodically
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.saveToStorage());
      setInterval(() => this.saveToStorage(), 60000); // Save every minute
    }
  }
  
  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return;
      
      const parsed = JSON.parse(stored);
      const now = Date.now();
      
      // Only restore non-expired entries
      Object.entries(parsed).forEach(([key, entry]: [string, any]) => {
        const age = now - entry.timestamp;
        if (age < entry.ttl) {
          this.cache.set(key, entry);
        }
      });
      
      if (import.meta.env.DEV) {
        console.log(`✓ Cache restored: ${this.cache.size} entries from localStorage`);
      }
    } catch (err) {
      console.warn('Failed to load cache from localStorage:', err);
      localStorage.removeItem(this.storageKey);
    }
  }
  
  /**
   * Save persistent cache entries to localStorage
   */
  private saveToStorage(): void {
    try {
      const toStore: Record<string, CacheEntry<any>> = {};
      
      // Only save entries with persistent keys
      for (const [key, entry] of this.cache.entries()) {
        const shouldPersist = Array.from(this.persistentKeys).some(pattern => 
          key.includes(pattern)
        );
        
        if (shouldPersist) {
          toStore[key] = entry;
        }
      }
      
      if (Object.keys(toStore).length > 0) {
        localStorage.setItem(this.storageKey, JSON.stringify(toStore));
        
        if (import.meta.env.DEV) {
          console.log(`✓ Cache saved: ${Object.keys(toStore).length} persistent entries to localStorage`);
        }
      }
    } catch (err) {
      console.warn('Failed to save cache to localStorage:', err);
    }
  }
  
  /**
   * Set cache entry with TTL in milliseconds
   * Default TTL: 5 minutes for better performance
   */
  set<T>(key: string, data: T, ttl: number = 300000): void {
    // Enforce LRU eviction if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0,
      lastAccessed: Date.now()
    });
    
    // Save to localStorage if this is a persistent key
    const shouldPersist = Array.from(this.persistentKeys).some(pattern => 
      key.includes(pattern)
    );
    
    if (shouldPersist) {
      this.saveToStorage();
    }
  }
  
  /**
   * Get cache entry if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    const now = Date.now();
    const age = now - entry.timestamp;
    
    if (age > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    
    // Update access stats
    entry.hits++;
    entry.lastAccessed = now;
    this.stats.hits++;
    
    return entry.data as T;
  }
  
  /**
   * LRU eviction - remove least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }
  
  /**
   * Clear specific cache entry
   */
  clear(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clear all cache entries (including localStorage)
   */
  clearAll(): void {
    this.cache.clear();
    try {
      localStorage.removeItem(this.storageKey);
      if (import.meta.env.DEV) {
        console.log('✓ Cache cleared from memory and localStorage');
      }
    } catch (err) {
      console.warn('Failed to clear localStorage cache:', err);
    }
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
   * Invalidate cache entries matching pattern (smarter pattern matching)
   */
  invalidatePattern(pattern: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    // Update localStorage if persistent keys were deleted
    const hasPersistentKeys = keysToDelete.some(key => 
      Array.from(this.persistentKeys).some(p => key.includes(p))
    );
    
    if (hasPersistentKeys) {
      this.saveToStorage();
    }
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : '0.00';
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
  
  /**
   * Set max cache size
   */
  setMaxSize(size: number): void {
    this.maxSize = size;
    while (this.cache.size > this.maxSize) {
      this.evictLRU();
    }
  }
  
  /**
   * Preload multiple keys (batch fetch optimization)
   */
  has(key: string): boolean {
    return this.cache.has(key) && this.get(key) !== null;
  }
  
  /**
   * Get cache size in bytes (approximate)
   */
  getSize(): number {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? new Blob([stored]).size : 0;
    } catch {
      return 0;
    }
  }
  
  /**
   * Add a key pattern to persist across sessions
   */
  addPersistentKey(pattern: string): void {
    this.persistentKeys.add(pattern);
  }
  
  /**
   * Remove a key pattern from persistent storage
   */
  removePersistentKey(pattern: string): void {
    this.persistentKeys.delete(pattern);
  }
}

// Singleton instance
export const cache = new CacheService();

// Cleanup expired entries every 5 minutes
setInterval(() => cache.cleanup(), 5 * 60 * 1000);

// Log cache stats in development (every 30 seconds)
if (import.meta.env.DEV) {
  setInterval(() => {
    console.log('[Cache Stats]', cache.getStats());
  }, 30000);
}

export default cache;

