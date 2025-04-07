const axios = require('axios');

const { TMDB_API_KEY } = process.env;
const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';

exports.handler = async (event) => {
  try {
    const { path, method, queryStringParameters, body } = event;

    // Determine the TMDB API endpoint based on the request path
    let tmdbEndpoint = path.replace('/bff', ''); // Remove the /bff prefix
    let tmdbMethod = method;
    let tmdbParams = queryStringParameters;
    let tmdbData = body;

    // Make the request to the TMDB API
    const response = await axios({
      method: tmdbMethod,
      url: `${TMDB_API_BASE_URL}${tmdbEndpoint}`,
      params: {
        ...tmdbParams,
        api_key: TMDB_API_KEY,
      },
      data: tmdbData,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(response.data),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
