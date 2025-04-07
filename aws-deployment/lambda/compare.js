const { cacheService, tmdbApi, formatResponse } = require('./utils');

exports.handler = async (event) => {
  try {
    // Parse the request body
    const body = JSON.parse(event.body);
    
    if (!body.projects || !Array.isArray(body.projects) || body.projects.length < 2) {
      return formatResponse(400, { error: 'Invalid request. Must include at least 2 projects' });
    }
    
    // Generate a cache key based on the projects
    const projectIds = body.projects.map(p => `${p.media_type}-${p.id}`).sort().join('_');
    const cacheKey = `comparison_${projectIds}`;
    
    // Check cache first
    const cachedComparison = await cacheService.getFromCache(cacheKey);
    if (cachedComparison) {
      return formatResponse(200, cachedComparison);
    }
    
    // Fetch credits for each project
    const creditsPromises = body.projects.map(project => 
      getProjectCredits(project.media_type, project.id)
    );
    
    const creditsResults = await Promise.all(creditsPromises);
    
    // Process and compare the credits
    const comparisonData = processComparisonData(body.projects, creditsResults);
    
    // Store in cache
    await cacheService.setInCache(cacheKey, comparisonData, 43200); // 12 hours
    
    return formatResponse(200, comparisonData);
  } catch (error) {
    console.error('Comparison error:', error);
    return formatResponse(500, { error: error.message });
  }
};

async function getProjectCredits(mediaType, id) {
  // Check cache first
  const cacheKey = `credits_${mediaType}_${id}`;
  const cachedCredits = await cacheService.getFromCache(cacheKey);
  
  if (cachedCredits) {
    return cachedCredits;
  }
  
  // Fetch from API if not in cache
  const response = await tmdbApi.get(`/${mediaType}/${id}/credits`, {
    params: {
      language: 'en-US'
    }
  });
  
  // Add project ID and media type to each credit
  const credits = {
    cast: response.data.cast.map(person => ({
      ...person,
      project_id: id,
      media_type: mediaType
    })),
    crew: response.data.crew.map(person => ({
      ...person,
      project_id: id,
      media_type: mediaType
    }))
  };
  
  // Store in cache
  await cacheService.setInCache(cacheKey, credits);
  
  return credits;
}

function processComparisonData(projects, creditsResults) {
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
          cast_appearances: [],
          crew_appearances: []
        });
      }
      
      const person = peopleMap.get(personId);
      person.cast_appearances.push(castMember);
    });
    
    // Process crew
    credits.crew.forEach(crewMember => {
      const personId = crewMember.id;
      
      if (!peopleMap.has(personId)) {
        peopleMap.set(personId, {
          id: personId,
          name: crewMember.name,
          profile_path: crewMember.profile_path,
          cast_appearances: [],
          crew_appearances: []
        });
      }
      
      const person = peopleMap.get(personId);
      person.crew_appearances.push(crewMember);
    });
  });
  
  // Convert map to array and filter to only people who appear in multiple projects
  const people = Array.from(peopleMap.values()).filter(person => {
    // Count unique projects this person appears in
    const uniqueProjectIds = new Set();
    
    // Add all project IDs from cast appearances
    person.cast_appearances.forEach(appearance => {
      uniqueProjectIds.add(`${appearance.media_type}-${appearance.project_id}`);
    });
    
    // Add all project IDs from crew appearances
    person.crew_appearances.forEach(appearance => {
      uniqueProjectIds.add(`${appearance.media_type}-${appearance.project_id}`);
    });
    
    // Keep only people who appear in at least 2 projects
    return uniqueProjectIds.size >= 2;
  });
  
  return {
    projects,
    people
  };
}
