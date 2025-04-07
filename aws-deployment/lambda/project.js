const { cacheService, tmdbApi, formatResponse } = require('./utils');

exports.handler = async (event) => {
  try {
    const mediaType = event.pathParameters?.mediaType;
    const id = event.pathParameters?.id;
    
    if (!mediaType || !id) {
      return formatResponse(400, { error: 'Missing mediaType or id parameter' });
    }
    
    if (mediaType !== 'movie' && mediaType !== 'tv') {
      return formatResponse(400, { error: 'Invalid mediaType. Must be "movie" or "tv"' });
    }
    
    // Check cache first
    const cacheKey = `project_${mediaType}_${id}`;
    const cachedProject = await cacheService.getFromCache(cacheKey);
    
    if (cachedProject) {
      return formatResponse(200, cachedProject);
    }
    
    // Fetch from API if not in cache
    const response = await tmdbApi.get(`/${mediaType}/${id}`, {
      params: {
        language: 'en-US',
        append_to_response: 'credits'
      }
    });
    
    // Add media_type to the response
    const project = {
      ...response.data,
      media_type: mediaType
    };
    
    // Store in cache
    await cacheService.setInCache(cacheKey, project);
    
    return formatResponse(200, project);
  } catch (error) {
    console.error('Project details error:', error);
    return formatResponse(500, { error: error.message });
  }
};
