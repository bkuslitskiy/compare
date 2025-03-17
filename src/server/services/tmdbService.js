const axios = require('axios');
const cacheService = require('./cacheService');
const AppError = require('../utils/AppError');

// TMDb API configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_API_BASE_URL = process.env.TMDB_API_BASE_URL || 'https://api.themoviedb.org/3';

// Create axios instance for TMDb API
const tmdbApi = axios.create({
    baseURL: TMDB_API_BASE_URL,
    params: {
        api_key: TMDB_API_KEY
    }
});

// Add request interceptor for rate limiting
tmdbApi.interceptors.request.use(async (config) => {
    // Simple rate limiting - wait a short time between requests
    await new Promise(resolve => setTimeout(resolve, 100));
    return config;
});

// Add response interceptor for error handling
tmdbApi.interceptors.response.use(
    response => response,
    error => {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('TMDb API Error:', error.response.status, error.response.data);
            
            // Handle rate limiting
            if (error.response.status === 429) {
                const retryAfter = error.response.headers['retry-after'] || 1;
                console.log(`Rate limited. Retrying after ${retryAfter} seconds.`);
                
                // Return a promise that resolves after the retry-after period
                return new Promise(resolve => {
                    setTimeout(() => {
                        resolve(tmdbApi(error.config));
                    }, retryAfter * 1000);
                });
            }
            
            // Map HTTP status codes to AppError types
            if (error.response.status === 400) {
                throw AppError.badRequest('Invalid request to TMDb API');
            } else if (error.response.status === 401) {
                throw AppError.unauthorized('Invalid TMDb API key');
            } else if (error.response.status === 404) {
                throw AppError.notFound('Resource not found on TMDb API');
            } else {
                throw AppError.internal(`TMDb API error: ${error.response.data.status_message || error.message}`);
            }
        } else if (error.request) {
            // The request was made but no response was received
            console.error('TMDb API Error: No response received', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('TMDb API Error:', error.message);
        }
        
        return Promise.reject(error);
    }
);

const tmdbService = {
    /**
     * Search for movies and TV shows by query
     * @param {string} query - The search query
     * @returns {Promise<Object>} - Search results
     */
    async searchMulti(query) {
        try {
            // Check cache first
            const cacheKey = `search_multi_${query}`;
            const cachedResults = cacheService.getFromCache(cacheKey);
            
            if (cachedResults) {
                return cachedResults;
            }
            
            // Fetch first page from API if not in cache
            const firstPageResponse = await tmdbApi.get('/search/multi', {
                params: {
                    query,
                    include_adult: false,
                    language: 'en-US',
                    page: 1
                }
            });
            
            let allResults = [...firstPageResponse.data.results];
            const totalPages = Math.min(firstPageResponse.data.total_pages, 10); // Increased from 5 to 10 pages for even more comprehensive results
            
            // Fetch additional pages if available
            if (totalPages > 1) {
                const additionalPagePromises = [];
                
                for (let page = 2; page <= totalPages; page++) {
                    additionalPagePromises.push(
                        tmdbApi.get('/search/multi', {
                            params: {
                                query,
                                include_adult: false,
                                language: 'en-US',
                                page
                            }
                        })
                    );
                }
                
                const additionalPagesResponses = await Promise.all(additionalPagePromises);
                
                // Add results from additional pages
                additionalPagesResponses.forEach(response => {
                    allResults = [...allResults, ...response.data.results];
                });
            }
            
            // Filter to only movies and TV shows
            const filteredResults = {
                ...firstPageResponse.data,
                results: allResults.filter(
                    item => item.media_type === 'movie' || item.media_type === 'tv'
                )
            };
            
            // Store in cache (short TTL for search results)
            cacheService.setInCache(cacheKey, filteredResults, 3600); // 1 hour
            
            return filteredResults;
        } catch (error) {
            console.error('Error searching TMDb:', error);
            
            // If it's already an AppError, rethrow it
            if (error.isOperational) {
                throw error;
            }
            
            // Otherwise, wrap it in an AppError
            throw AppError.internal(`Error searching TMDb: ${error.message}`);
        }
    },
    
    /**
     * Find a movie or TV show by IMDb ID
     * @param {string} imdbId - The IMDb ID
     * @returns {Promise<Object>} - Search results
     */
    async findByImdbId(imdbId) {
        try {
            // Check cache first
            const cacheKey = `search_imdb_${imdbId}`;
            const cachedResults = cacheService.getFromCache(cacheKey);
            
            if (cachedResults) {
                return cachedResults;
            }
            
            // Fetch from API if not in cache
            const response = await tmdbApi.get('/find/' + imdbId, {
                params: {
                    external_source: 'imdb_id',
                    language: 'en-US'
                }
            });
            
            // Combine movie and TV results and add media_type
            const results = [
                ...response.data.movie_results.map(item => ({ ...item, media_type: 'movie' })),
                ...response.data.tv_results.map(item => ({ ...item, media_type: 'tv' }))
            ];
            
            const formattedResults = {
                results
            };
            
            // Store in cache
            cacheService.setInCache(cacheKey, formattedResults);
            
            return formattedResults;
        } catch (error) {
            console.error('Error finding by IMDb ID:', error);
            
            // If it's already an AppError, rethrow it
            if (error.isOperational) {
                throw error;
            }
            
            // Otherwise, wrap it in an AppError
            throw AppError.internal(`Error finding by IMDb ID: ${error.message}`);
        }
    },
    
    /**
     * Get details for a movie or TV show
     * @param {string} mediaType - 'movie' or 'tv'
     * @param {number} id - The TMDb ID
     * @returns {Promise<Object>} - Project details
     */
    async getProjectDetails(mediaType, id) {
        try {
            // Check cache first
            const cacheKey = `project_${mediaType}_${id}`;
            const cachedProject = cacheService.getFromCache(cacheKey);
            
            if (cachedProject) {
                return cachedProject;
            }
            
            // Fetch from API if not in cache
            const response = await tmdbApi.get(`/${mediaType}/${id}`, {
                params: {
                    language: 'en-US'
                }
            });
            
            // Add media_type to the response
            const project = {
                ...response.data,
                media_type: mediaType
            };
            
            // Store in cache
            cacheService.setInCache(cacheKey, project);
            
            return project;
        } catch (error) {
            console.error(`Error getting ${mediaType} details:`, error);
            
            // If it's already an AppError, rethrow it
            if (error.isOperational) {
                throw error;
            }
            
            // Otherwise, wrap it in an AppError
            throw AppError.internal(`Error getting ${mediaType} details: ${error.message}`);
        }
    },
    
    /**
     * Get credits for a movie or TV show
     * @param {string} mediaType - 'movie' or 'tv'
     * @param {number} id - The TMDb ID
     * @returns {Promise<Object>} - Credits data
     */
    async getProjectCredits(mediaType, id) {
        try {
            // Check cache first
            const cacheKey = `credits_${mediaType}_${id}`;
            const cachedCredits = cacheService.getFromCache(cacheKey);
            
            if (cachedCredits) {
                return cachedCredits;
            }
            
            // Fetch from API if not in cache
            const response = await tmdbApi.get(`/${mediaType}/${id}/credits`, {
                params: {
                    language: 'en-US',
                    append_to_response: 'cast,crew,uncredited' // Explicitly request cast, crew, and uncredited data
                }
            });
            
            // For TV shows, we need to fetch additional credits for each season
            let allCast = [...response.data.cast];
            let allCrew = [...response.data.crew];
            
            if (mediaType === 'tv') {
                try {
                    // Get TV show details to get number of seasons and complete credits
                    const showDetails = await tmdbApi.get(`/tv/${id}`, {
                        params: {
                            language: 'en-US',
                            append_to_response: 'aggregate_credits,credits,external_ids' // Get credits and external IDs for additional lookups
                        }
                    });
                    
                    // Try to get additional crew data from IMDB if available
                    if (showDetails.data.external_ids && showDetails.data.external_ids.imdb_id) {
                        try {
                            const imdbId = showDetails.data.external_ids.imdb_id;
                            const imdbResponse = await tmdbApi.get(`/find/${imdbId}`, {
                                params: {
                                    external_source: 'imdb_id',
                                    language: 'en-US'
                                }
                            });
                            
                            // If we got additional data, process it
                            if (imdbResponse.data && imdbResponse.data.tv_results && imdbResponse.data.tv_results.length > 0) {
                                const tvResult = imdbResponse.data.tv_results[0];
                                if (tvResult.id) {
                                    // Get full credits from this alternate lookup
                                    const altCreditsResponse = await tmdbApi.get(`/tv/${tvResult.id}/credits`, {
                                        params: {
                                            language: 'en-US'
                                        }
                                    });
                                    
                                    // Add any crew members not already in our list
                                    if (altCreditsResponse.data && altCreditsResponse.data.crew) {
                                        altCreditsResponse.data.crew.forEach(crewMember => {
                                            if (!allCrew.some(c => c.id === crewMember.id && c.job === crewMember.job)) {
                                                allCrew.push(crewMember);
                                            }
                                        });
                                    }
                                }
                            }
                        } catch (imdbError) {
                            console.warn('Error fetching additional IMDB data:', imdbError);
                            // Continue with the data we have
                        }
                    }
                    
                    // If credits are available in the show details, use them to fill in missing information
                    if (showDetails.data.credits && showDetails.data.credits.cast) {
                        const detailedCast = showDetails.data.credits.cast;
                        
                        // Update existing cast members with more detailed information if available
                        allCast = allCast.map(castMember => {
                            const detailedMember = detailedCast.find(c => c.id === castMember.id);
                            if (detailedMember) {
                                // Always take the more detailed character information
                                let betterCharacter = castMember.character || '';
                                
                                // If the detailed member has a character and it's longer/more detailed, use it
                                if (detailedMember.character && detailedMember.character.length > betterCharacter.length) {
                                    betterCharacter = detailedMember.character;
                                }
                                
                                // If the character is still empty, try to use the role name
                                if (!betterCharacter && detailedMember.roles && detailedMember.roles.length > 0) {
                                    betterCharacter = detailedMember.roles[0].character || '';
                                }
                                
                                return {
                                    ...castMember,
                                    character: betterCharacter
                                };
                            }
                            return castMember;
                        });
                    }
                    
                    // If aggregate_credits are available, use them for additional cast and crew
                    if (showDetails.data.aggregate_credits) {
                        const aggregateCredits = showDetails.data.aggregate_credits;
                        
                        // Add unique cast members from aggregate credits and update existing ones with better info
                        if (aggregateCredits.cast) {
                            aggregateCredits.cast.forEach(castMember => {
                                const existingIndex = allCast.findIndex(c => c.id === castMember.id);
                                
                                if (existingIndex === -1) {
                                    // Add new cast member
                                    allCast.push(castMember);
                                } else {
                                    // Always check for better character info
                                    const existingCharacter = allCast[existingIndex].character || '';
                                    const aggregateCharacter = castMember.character || '';
                                    const roleCharacter = castMember.roles && castMember.roles.length > 0 ? 
                                                         castMember.roles[0].character || '' : '';
                                    
                                    // Use the longest/most detailed character name
                                    let bestCharacter = existingCharacter;
                                    if (aggregateCharacter.length > bestCharacter.length) {
                                        bestCharacter = aggregateCharacter;
                                    }
                                    if (roleCharacter.length > bestCharacter.length) {
                                        bestCharacter = roleCharacter;
                                    }
                                    
                                    // Update with the best character info
                                    allCast[existingIndex] = {
                                        ...allCast[existingIndex],
                                        character: bestCharacter
                                    };
                                }
                            });
                        }
                        
                        // Add unique crew members from aggregate credits
                        if (aggregateCredits.crew) {
                            aggregateCredits.crew.forEach(crewMember => {
                                if (!allCrew.some(c => c.id === crewMember.id)) {
                                    allCrew.push(crewMember);
                                }
                            });
                        }
                    } else {
                        // Fall back to fetching credits for each season
                        const numSeasons = showDetails.data.number_of_seasons || 0;
                        
                        // Fetch credits for each season
                        for (let season = 1; season <= numSeasons; season++) {
                            try {
                                const seasonCredits = await tmdbApi.get(`/tv/${id}/season/${season}/credits`, {
                                    params: {
                                        language: 'en-US',
                                        append_to_response: 'crew,guest_stars' // Get crew and guest stars
                                    }
                                });
                                
                                // Add unique cast and crew members
                                seasonCredits.data.cast.forEach(castMember => {
                                    if (!allCast.some(c => c.id === castMember.id)) {
                                        allCast.push(castMember);
                                    }
                                });
                                
                                seasonCredits.data.crew.forEach(crewMember => {
                                    if (!allCrew.some(c => c.id === crewMember.id && c.job === crewMember.job)) {
                                        allCrew.push(crewMember);
                                    }
                                });
                                
                                // Add guest stars if available
                                if (seasonCredits.data.guest_stars) {
                                    seasonCredits.data.guest_stars.forEach(guestStar => {
                                        if (!allCast.some(c => c.id === guestStar.id)) {
                                            allCast.push(guestStar);
                                        }
                                    });
                                }
                                
                                // Also fetch episode credits for more detailed crew information
                                const seasonDetails = await tmdbApi.get(`/tv/${id}/season/${season}`, {
                                    params: {
                                        language: 'en-US'
                                    }
                                });
                                
                                if (seasonDetails.data && seasonDetails.data.episodes) {
                                    // Get credits for each episode (limit to first 5 episodes to avoid too many requests)
                                    const episodesToFetch = Math.min(seasonDetails.data.episodes.length, 5);
                                    
                                    for (let episodeNum = 1; episodeNum <= episodesToFetch; episodeNum++) {
                                        try {
                                            const episodeCredits = await tmdbApi.get(`/tv/${id}/season/${season}/episode/${episodeNum}/credits`, {
                                                params: {
                                                    language: 'en-US'
                                                }
                                            });
                                            
                                            // Add unique crew members from episode
                                            if (episodeCredits.data && episodeCredits.data.crew) {
                                                episodeCredits.data.crew.forEach(crewMember => {
                                                    // Check for stunt department specifically
                                                    if (crewMember.department === 'Crew' || 
                                                        crewMember.department === 'Stunts' || 
                                                        crewMember.job.toLowerCase().includes('stunt')) {
                                                        if (!allCrew.some(c => c.id === crewMember.id && c.job === crewMember.job)) {
                                                            allCrew.push(crewMember);
                                                        }
                                                    }
                                                });
                                            }
                                        } catch (episodeError) {
                                            console.warn(`Error fetching credits for S${season}E${episodeNum}:`, episodeError);
                                            // Continue with other episodes
                                        }
                                    }
                                }
                            } catch (seasonError) {
                                console.warn(`Error fetching credits for season ${season}:`, seasonError);
                                // Continue with other seasons even if one fails
                            }
                        }
                    }
                } catch (showDetailsError) {
                    console.warn('Error fetching TV show details:', showDetailsError);
                    // Continue with the credits we already have
                }
            }
            
            // Add project ID and media type to each credit
            const credits = {
                cast: allCast.map(person => ({
                    ...person,
                    project_id: id,
                    media_type: mediaType
                })),
                crew: allCrew.map(person => ({
                    ...person,
                    project_id: id,
                    media_type: mediaType
                }))
            };
            
            // Store in cache
            cacheService.setInCache(cacheKey, credits);
            
            return credits;
        } catch (error) {
            console.error(`Error getting ${mediaType} credits:`, error);
            
            // If it's already an AppError, rethrow it
            if (error.isOperational) {
                throw error;
            }
            
            // Otherwise, wrap it in an AppError
            throw AppError.internal(`Error getting ${mediaType} credits: ${error.message}`);
        }
    },
    
    /**
     * Process and merge credits data for comparison
     * @param {Array} projects - Array of project objects
     * @param {Array} creditsResults - Array of credits results
     * @returns {Object} - Processed comparison data
     */
    async processComparisonData(projects, creditsResults) {
        // Create a map to store people by ID
        const peopleMap = new Map();
        
        // Process each project's credits
        creditsResults.forEach((credits, index) => {
            const project = projects[index];
            
            // Process cast
            credits.cast.forEach(castMember => {
                const personId = castMember.id;
                
                if (!peopleMap.has(personId)) {
                    peopleMap.set(personId, {
                        id: personId,
                        name: castMember.name,
                        profile_path: castMember.profile_path,
                        imdb_id: castMember.imdb_id || null, // Include IMDB ID if available
                        cast_appearances: [],
                        crew_appearances: []
                    });
                }
                
                const person = peopleMap.get(personId);
                
                // Add cast appearance
                person.cast_appearances.push({
                    project_id: project.id,
                    media_type: project.media_type,
                    character: castMember.character,
                    order: castMember.order
                });
            });
            
            // Process crew
            credits.crew.forEach(crewMember => {
                const personId = crewMember.id;
                
                if (!peopleMap.has(personId)) {
                    peopleMap.set(personId, {
                        id: personId,
                        name: crewMember.name,
                        profile_path: crewMember.profile_path,
                        imdb_id: crewMember.imdb_id || null, // Include IMDB ID if available
                        cast_appearances: [],
                        crew_appearances: []
                    });
                }
                
                const person = peopleMap.get(personId);
                
                // Add crew appearance
                person.crew_appearances.push({
                    project_id: project.id,
                    media_type: project.media_type,
                    department: crewMember.department,
                    job: crewMember.job
                });
            });
        });
        
        // Fetch IMDB IDs for people who don't have them
        const peopleArray = Array.from(peopleMap.values());
        const peopleWithoutImdbIds = peopleArray.filter(person => !person.imdb_id);
        
        // Fetch IMDB IDs in batches to avoid too many concurrent requests
        const batchSize = 10;
        for (let i = 0; i < peopleWithoutImdbIds.length; i += batchSize) {
            const batch = peopleWithoutImdbIds.slice(i, i + batchSize);
            const promises = batch.map(person => this.fetchPersonExternalIds(person.id));
            
            try {
                const results = await Promise.all(promises);
                
                // Update people with their IMDB IDs
                results.forEach((externalIds, index) => {
                    if (externalIds && externalIds.imdb_id) {
                        const person = batch[index];
                        person.imdb_id = externalIds.imdb_id;
                    }
                });
            } catch (error) {
                console.error('Error fetching external IDs batch:', error);
                // Continue with the next batch even if this one fails
            }
            
            // Add a small delay between batches to avoid rate limiting
            if (i + batchSize < peopleWithoutImdbIds.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        // Convert map to array and sort by number of appearances
        const people = Array.from(peopleMap.values()).sort((a, b) => {
            const aAppearances = a.cast_appearances.length + a.crew_appearances.length;
            const bAppearances = b.cast_appearances.length + b.crew_appearances.length;
            return bAppearances - aAppearances;
        });
        
        return {
            projects,
            people
        };
    },
    
    /**
     * Fetch external IDs (including IMDB ID) for a person
     * @param {number} personId - The TMDb person ID
     * @returns {Promise<Object>} - External IDs object
     */
    async fetchPersonExternalIds(personId) {
        try {
            // Check cache first
            const cacheKey = `person_external_ids_${personId}`;
            const cachedIds = cacheService.getFromCache(cacheKey);
            
            if (cachedIds) {
                return cachedIds;
            }
            
            // Fetch from API if not in cache
            const response = await tmdbApi.get(`/person/${personId}/external_ids`);
            const externalIds = response.data;
            
            // Store in cache (long TTL since these rarely change)
            cacheService.setInCache(cacheKey, externalIds, 604800); // 7 days
            
            return externalIds;
        } catch (error) {
            console.error(`Error fetching external IDs for person ${personId}:`, error);
            return null;
        }
    }
};

module.exports = tmdbService;
