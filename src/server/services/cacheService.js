const NodeCache = require('node-cache');

// Create cache instances
const projectCache = new NodeCache({
    stdTTL: parseInt(process.env.PROJECT_CACHE_TTL) || 86400, // 24 hours in seconds
    checkperiod: 600, // Check for expired keys every 10 minutes
    useClones: false // Store references to objects instead of cloning them
});

const comparisonCache = new NodeCache({
    stdTTL: parseInt(process.env.COMPARISON_CACHE_TTL) || 43200, // 12 hours in seconds
    checkperiod: 600, // Check for expired keys every 10 minutes
    useClones: false
});

// Search cache with shorter TTL
const searchCache = new NodeCache({
    stdTTL: 3600, // 1 hour in seconds
    checkperiod: 300, // Check for expired keys every 5 minutes
    useClones: false
});

// Map cache types to cache instances
const cacheMap = {
    project_: projectCache,
    credits_: projectCache,
    comparison_: comparisonCache,
    search_: searchCache
};

const cacheService = {
    /**
     * Get an item from the appropriate cache
     * @param {string} key - The cache key
     * @returns {any} - The cached item or undefined if not found
     */
    getFromCache(key) {
        // Determine which cache to use based on key prefix
        const cachePrefix = Object.keys(cacheMap).find(prefix => key.startsWith(prefix));
        const cache = cachePrefix ? cacheMap[cachePrefix] : projectCache; // Default to project cache
        
        return cache.get(key);
    },
    
    /**
     * Set an item in the appropriate cache
     * @param {string} key - The cache key
     * @param {any} value - The value to cache
     * @param {number} ttl - Optional TTL in seconds
     * @returns {boolean} - True if successful
     */
    setInCache(key, value, ttl) {
        // Determine which cache to use based on key prefix
        const cachePrefix = Object.keys(cacheMap).find(prefix => key.startsWith(prefix));
        const cache = cachePrefix ? cacheMap[cachePrefix] : projectCache; // Default to project cache
        
        return cache.set(key, value, ttl);
    },
    
    /**
     * Delete an item from the appropriate cache
     * @param {string} key - The cache key
     * @returns {number} - Number of deleted entries
     */
    deleteFromCache(key) {
        // Determine which cache to use based on key prefix
        const cachePrefix = Object.keys(cacheMap).find(prefix => key.startsWith(prefix));
        const cache = cachePrefix ? cacheMap[cachePrefix] : projectCache; // Default to project cache
        
        return cache.del(key);
    },
    
    /**
     * Flush all caches
     */
    flushAllCaches() {
        projectCache.flushAll();
        comparisonCache.flushAll();
        searchCache.flushAll();
        console.log('All caches flushed');
    },
    
    /**
     * Get cache statistics
     * @returns {Object} - Cache statistics
     */
    getCacheStats() {
        return {
            project: projectCache.getStats(),
            comparison: comparisonCache.getStats(),
            search: searchCache.getStats()
        };
    },
    
    /**
     * Invalidate cache entries related to a specific project
     * @param {string} mediaType - 'movie' or 'tv'
     * @param {number} id - The TMDb ID
     */
    invalidateProjectCache(mediaType, id) {
        // Delete project details
        this.deleteFromCache(`project_${mediaType}_${id}`);
        
        // Delete project credits
        this.deleteFromCache(`credits_${mediaType}_${id}`);
        
        // Find and delete comparison caches that include this project
        const comparisonKeys = comparisonCache.keys();
        const projectPattern = `${mediaType}_${id}`;
        
        comparisonKeys.forEach(key => {
            if (key.includes(projectPattern)) {
                comparisonCache.del(key);
            }
        });
        
        console.log(`Cache invalidated for ${mediaType} ${id}`);
    }
};

// Set up automatic cache invalidation
const setupCacheInvalidation = () => {
    // Invalidate search cache every day
    setInterval(() => {
        searchCache.flushAll();
        console.log('Search cache invalidated');
    }, 24 * 60 * 60 * 1000); // 24 hours
};

setupCacheInvalidation();

module.exports = cacheService;
