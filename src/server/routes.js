const express = require('express');
const router = express.Router();
const tmdbService = require('./services/tmdbService');
const cacheService = require('./services/cacheService');
const AppError = require('./utils/AppError');

// Admin route to flush all caches
router.get('/admin/flush-cache', (req, res) => {
    cacheService.flushAllCaches();
    res.json({ success: true, message: 'All caches flushed successfully' });
});

// Search for movies and TV shows
router.get('/search/multi', async (req, res, next) => {
    try {
        const query = req.query.query;
        
        if (!query) {
            throw AppError.badRequest('Missing query parameter');
        }
        
        const results = await tmdbService.searchMulti(query);
        res.json(results);
    } catch (error) {
        next(error);
    }
});

// Search by IMDb ID
router.get('/search/imdb/:id', async (req, res, next) => {
    try {
        const imdbId = req.params.id;
        
        if (!imdbId) {
            throw AppError.badRequest('Missing IMDb ID');
        }
        
        const results = await tmdbService.findByImdbId(imdbId);
        res.json(results);
    } catch (error) {
        next(error);
    }
});

// Get project details by TMDB ID
router.get('/project/:mediaType/:id', async (req, res, next) => {
    try {
        const { mediaType, id } = req.params;
        
        if (!mediaType || !id) {
            throw AppError.badRequest('Missing media type or ID');
        }
        
        // Check cache first
        const cacheKey = `project_${mediaType}_${id}`;
        const cachedProject = cacheService.getFromCache(cacheKey);
        
        if (cachedProject) {
            return res.json(cachedProject);
        }
        
        // Fetch from API if not in cache
        const project = await tmdbService.getProjectDetails(mediaType, id);
        
        // Store in cache
        cacheService.setInCache(cacheKey, project);
        
        res.json(project);
    } catch (error) {
        next(error);
    }
});

// Compare projects
router.post('/compare', async (req, res, next) => {
    try {
        const { projects } = req.body;
        
        if (!projects || !Array.isArray(projects) || projects.length < 2) {
            throw AppError.badRequest('Invalid projects data. Provide an array with at least 2 projects.');
        }
        
        // Generate a cache key based on the sorted project IDs
        const sortedProjects = [...projects].sort((a, b) => {
            if (a.media_type === b.media_type) {
                return a.id - b.id;
            }
            return a.media_type.localeCompare(b.media_type);
        });
        
        const cacheKey = `comparison_${sortedProjects.map(p => `${p.media_type}_${p.id}`).join('_')}`;
        
        // Check cache first
        const cachedComparison = cacheService.getFromCache(cacheKey);
        
        if (cachedComparison) {
            return res.json(cachedComparison);
        }
        
        // Fetch credits for all projects
        const creditsPromises = projects.map(project => 
            tmdbService.getProjectCredits(project.media_type, project.id)
        );
        
        const creditsResults = await Promise.all(creditsPromises);
        
        // Process and merge credits
        const comparisonData = await tmdbService.processComparisonData(projects, creditsResults);
        
        // Store in cache
        cacheService.setInCache(cacheKey, comparisonData, parseInt(process.env.COMPARISON_CACHE_TTL));
        
        res.json(comparisonData);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
