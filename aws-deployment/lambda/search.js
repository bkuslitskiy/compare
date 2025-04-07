const { cacheService, tmdbApi, formatResponse } = require('./utils');

exports.handler = async (event) => {
  try {
    // Check if this is an IMDb ID search
    if (event.pathParameters && event.pathParameters.id) {
      const imdbId = event.pathParameters.id;
      return await handleImdbSearch(imdbId);
    }
    
    // Otherwise, it's a multi search
    const query = event.queryStringParameters?.query;
    
    if (!query) {
      return formatResponse(400, { error: 'Missing query parameter' });
    }
    
    return await handleMultiSearch(query);
  } catch (error) {
    console.error('Search error:', error);
    return formatResponse(500, { error: error.message });
  }
};

async function handleMultiSearch(query) {
  // Check cache first
  const cacheKey = `search_multi_${query}`;
  const cachedResults = await cacheService.getFromCache(cacheKey);
  
  if (cachedResults) {
    return formatResponse(200, cachedResults);
  }
  
  // Fetch from API if not in cache
  const response = await tmdbApi.get('/search/multi', {
    params: {
      query,
      include_adult: false,
      language: 'en-US',
      page: 1
    }
  });
  
  // Filter to only movies and TV shows
  const filteredResults = {
    ...response.data,
    results: response.data.results.filter(
      item => item.media_type === 'movie' || item.media_type === 'tv'
    )
  };
  
  // Store in cache (short TTL for search results)
  await cacheService.setInCache(cacheKey, filteredResults, 3600); // 1 hour
  
  return formatResponse(200, filteredResults);
}

async function handleImdbSearch(imdbId) {
  // Check cache first
  const cacheKey = `search_imdb_${imdbId}`;
  const cachedResults = await cacheService.getFromCache(cacheKey);
  
  if (cachedResults) {
    return formatResponse(200, cachedResults);
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
  await cacheService.setInCache(cacheKey, formattedResults);
  
  return formatResponse(200, formattedResults);
}
