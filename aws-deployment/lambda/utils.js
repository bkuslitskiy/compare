const AWS = require('aws-sdk');
const axios = require('axios');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Cache service using DynamoDB
const cacheService = {
  getFromCache: async (key) => {
    try {
      const result = await dynamoDB.get({
        TableName: 'tmdb-cache',
        Key: { cacheKey: key }
      }).promise();
      
      if (result.Item && result.Item.expiresAt > Math.floor(Date.now() / 1000)) {
        console.log(`Cache hit for key: ${key}`);
        return JSON.parse(result.Item.data);
      }
      console.log(`Cache miss for key: ${key}`);
      return null;
    } catch (error) {
      console.error('Error getting from cache:', error);
      return null;
    }
  },
  
  setInCache: async (key, data, ttl = 86400) => {
    try {
      await dynamoDB.put({
        TableName: 'tmdb-cache',
        Item: {
          cacheKey: key,
          data: JSON.stringify(data),
          expiresAt: Math.floor(Date.now() / 1000) + ttl
        }
      }).promise();
      console.log(`Cached data for key: ${key}, TTL: ${ttl} seconds`);
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  }
};

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

// Helper function for Lambda responses
const formatResponse = (statusCode, body) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify(body)
  };
};

module.exports = {
  cacheService,
  tmdbApi,
  formatResponse
};
