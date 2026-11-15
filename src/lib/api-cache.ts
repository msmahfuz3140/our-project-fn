/**
 * Client-side stale-while-revalidate cache with request deduplication and
 * safe persistence for PUBLIC data only.
 *
 * - Private responses are never persisted to localStorage.
 * - Public settings/plans can survive navigation and a page refresh.
 * - A stale entry is returned immediately while one background request
 *   refreshes it for the next render.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  staleUntil: number;
}

interface PersistedCache {
  version: number;
  entries: Record<string, CacheEntry<any>>;
}

interface CacheOptions {
  ttlMs?: number;
  staleMs?: number;
  bypassCache?: boolean;
  persist?: boolean;
}

const STORAGE_KEY = 'ra:api-cache:v2';
const STORAGE_VERSION = 2;
const MAX_MEMORY_ENTRIES = 300;
const MAX_PERSISTED_ENTRIES = 80;

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();
  private inFlight = new Map<string, Promise<any>>();
  private persistedKeys = new Set<string>();
  private defaultTtlMs = 15_000;
  private defaultStaleMs = 15_000;
  private hits = 0;
  private misses = 0;

  constructor() {
    this.hydrate();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEY) this.hydrate();
      });
    }
  }

  private hydrate(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PersistedCache;
      if (parsed.version !== STORAGE_VERSION || !parsed.entries) return;
      const now = Date.now();
      for (const [key, entry] of Object.entries(parsed.entries)) {
        if (entry && entry.staleUntil > now) {
          this.cache.set(key, entry);
          this.persistedKeys.add(key);
        }
      }
    } catch {
      // Corrupt or unavailable storage must never break the application.
    }
  }

  private persist(): void {
    if (typeof window === 'undefined') return;
    try {
      const entries: Record<string, CacheEntry<any>> = {};
      let count = 0;
      for (const [key, entry] of this.cache.entries()) {
        if (!this.persistedKeys.has(key)) continue;
        if (entry.staleUntil <= Date.now()) continue;
        entries[key] = entry;
        count += 1;
        if (count >= MAX_PERSISTED_ENTRIES) break;
      }
      const payload: PersistedCache = { version: STORAGE_VERSION, entries };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Quota / privacy mode is non-fatal.
    }
  }

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      return undefined;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number = this.defaultTtlMs, persist = false, staleMs?: number): void {
    const now = Date.now();
    const effectiveStaleMs = Math.max(0, staleMs ?? this.defaultStaleMs);
    this.cache.set(key, {
      data,
      expiresAt: now + Math.max(1, ttlMs),
      staleUntil: now + Math.max(1, ttlMs) + effectiveStaleMs
    });

    if (persist) this.persistedKeys.add(key);
    else this.persistedKeys.delete(key);

    if (this.cache.size > MAX_MEMORY_ENTRIES) {
      const oldest = this.cache.keys().next().value;
      if (oldest) {
        this.cache.delete(oldest);
        this.persistedKeys.delete(oldest);
      }
    }

    if (persist) this.persist();
  }

  del(key: string): void {
    this.cache.delete(key);
    this.persistedKeys.delete(key);
    this.persist();
  }

  delPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        this.persistedKeys.delete(key);
      }
    }
    this.persist();
  }

  clear(): void {
    this.cache.clear();
    this.inFlight.clear();
    this.persistedKeys.clear();
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  }

  getStats() {
    return {
      entries: this.cache.size,
      persistedEntries: this.persistedKeys.size,
      inFlight: this.inFlight.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0
        ? Math.round((this.hits / (this.hits + this.misses)) * 1000) / 10
        : 0
    };
  }

  async dedupe<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const now = Date.now();
    const cached = this.cache.get(key);

    if (!options.bypassCache && cached) {
      if (cached.expiresAt > now) {
        this.hits += 1;
        return cached.data as T;
      }

      if (cached.staleUntil > now) {
        this.hits += 1;
        // Stale-while-revalidate: return immediately, refresh in background.
        if (!this.inFlight.has(key)) {
          const refresh = fetcher()
            .then((data) => {
              this.set(
                key,
                data,
                options.ttlMs ?? this.defaultTtlMs,
                Boolean(options.persist),
                options.staleMs
              );
              return data;
            })
            .catch(() => {
              // Keep serving the stale value. A later call can retry.
              return cached.data as T;
            })
            .finally(() => {
              this.inFlight.delete(key);
            });
          this.inFlight.set(key, refresh);
        }
        return cached.data as T;
      }

      this.cache.delete(key);
      this.persistedKeys.delete(key);
    }

    const pending = this.inFlight.get(key);
    if (pending) {
      this.hits += 1;
      return pending as Promise<T>;
    }

    this.misses += 1;
    const promise = fetcher()
      .then((data) => {
        this.set(
          key,
          data,
          options.ttlMs ?? this.defaultTtlMs,
          Boolean(options.persist),
          options.staleMs
        );
        return data;
      })
      .finally(() => {
        this.inFlight.delete(key);
      });

    this.inFlight.set(key, promise);
    return promise;
  }
}

export const apiCache = new ApiCache();
