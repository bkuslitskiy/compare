# AWS Deployment Guide for Compare TV Shows V2

This guide provides detailed instructions for deploying the Compare TV Shows V2 application on AWS Free Tier services, with DNS configuration for the compare.my.useless.blog subdomain.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [AWS Infrastructure Setup](#aws-infrastructure-setup)
   - [S3 Bucket for Frontend](#s3-bucket-for-frontend)
   - [Lambda Functions for Backend](#lambda-functions-for-backend)
   - [API Gateway](#api-gateway)
   - [DynamoDB for Caching](#dynamodb-for-caching)
   - [CloudFront Distribution](#cloudfront-distribution)
   - [Route 53 for DNS](#route-53-for-dns)
3. [DNS Configuration with Siteground](#dns-configuration-with-siteground)
4. [Local Preparation and Deployment](#local-preparation-and-deployment)
   - [Code Modifications](#code-modifications)
   - [Building and Packaging](#building-and-packaging)
   - [Deployment Scripts](#deployment-scripts)
5. [Security Considerations](#security-considerations)
6. [Testing and Verification](#testing-and-verification)
7. [Troubleshooting](#troubleshooting)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)

## Prerequisites

Before starting the deployment process, ensure you have:

1. An AWS account with Free Tier access
2. AWS CLI installed and configured on your local machine
   ```bash
   # Install AWS CLI
   pip install awscli
   
   # Configure with your credentials
   aws configure
   ```
3. Your TMDB API key
4. Node.js and npm installed locally
5. Access to your Siteground account for DNS configuration
6. Domain ownership for useless.blog and its subdomains

## AWS Infrastructure Setup

### S3 Bucket for Frontend

1. **Create an S3 bucket**:
   - Sign in to the AWS Management Console
   - Navigate to S3 service
   - Click "Create bucket"
   - Enter a globally unique name (e.g., `compare-tv-shows-frontend`)
   - Select your preferred region (use the same region for all services)
   - Uncheck "Block all public access"
   - Acknowledge the warning about making the bucket public
   - Click "Create bucket"

2. **Enable static website hosting**:
   - Select your newly created bucket
   - Go to the "Properties" tab
   - Scroll down to "Static website hosting"
   - Click "Edit"
   - Select "Enable"
   - Enter `index.html` for both Index document and Error document
   - Click "Save changes"

3. **Configure bucket policy for public access**:
   - Go to the "Permissions" tab
   - Click "Bucket policy"
   - Enter the following policy (replace `YOUR-BUCKET-NAME` with your actual bucket name):
     ```json
     {
       "Version": "2012-10-17",
       "Statement": [
         {
           "Sid": "PublicReadGetObject",
           "Effect": "Allow",
           "Principal": "*",
           "Action": "s3:GetObject",
           "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
         }
       ]
     }
     ```
   - Click "Save changes"

4. **Note your bucket website endpoint**:
   - Go back to the "Properties" tab
   - Scroll down to "Static website hosting"
   - Note the "Bucket website endpoint" URL (you'll need this later)

### DynamoDB for Caching

1. **Create a DynamoDB table**:
   - Navigate to DynamoDB in the AWS Console
   - Click "Create table"
   - Enter `tmdb-cache` for the table name
   - Enter `cacheKey` for the partition key (type: String)
   - Uncheck "Use default settings"
   - Select "On-demand" for capacity mode (better for free tier)
   - Click "Create"

2. **Configure TTL for automatic cache expiration**:
   - Select your newly created table
   - Go to the "Additional settings" tab
   - Find "Time to Live (TTL)" and click "Enable"
   - Enter `expiresAt` as the TTL attribute
   - Click "Save"

### Lambda Functions for Backend

1. **Create IAM Role for Lambda**:
   - Navigate to IAM in the AWS Console
   - Click "Roles" and then "Create role"
   - Select "AWS service" as the trusted entity type
   - Select "Lambda" as the use case
   - Click "Next"
   - Search for and attach the following policies:
     - `AmazonDynamoDBFullAccess`
     - `AWSLambdaBasicExecutionRole`
   - Click "Next"
   - Enter `CompareShowsLambdaRole` for the role name
   - Click "Create role"

2. **Create Lambda Functions** (repeat for each endpoint):

   a. **Search Function**:
   - Navigate to Lambda in the AWS Console
   - Click "Create function"
   - Select "Author from scratch"
   - Enter `compare-shows-search` for the function name
   - Select "Node.js 18.x" for the runtime
   - Under "Permissions", select "Use an existing role"
   - Select the `CompareShowsLambdaRole` you created
   - Click "Create function"
   - In the "Code" tab, upload a ZIP file containing your search function code (we'll prepare this in the local steps)
   - In the "Configuration" tab, set the following:
     - Memory: 256 MB
     - Timeout: 30 seconds
     - Environment variables:
       - `TMDB_API_KEY`: Your TMDB API key
       - `TMDB_API_BASE_URL`: https://api.themoviedb.org/3

   b. **Project Details Function**:
   - Repeat the steps above, but name the function `compare-shows-project`
   
   c. **Compare Function**:
   - Repeat the steps above, but name the function `compare-shows-compare`

3. **Create Lambda Layer for Shared Code**:
   - In the Lambda console, click "Layers" in the left sidebar
   - Click "Create layer"
   - Enter `compare-shows-common` for the name
   - Upload a ZIP file containing shared code (axios, utilities, etc.)
   - Select compatible runtimes: Node.js 18.x
   - Click "Create"
   - Attach this layer to all your Lambda functions

### API Gateway

1. **Create a REST API**:
   - Navigate to API Gateway in the AWS Console
   - Click "Create API"
   - Select "REST API" (not private)
   - Click "Build"
   - Enter `CompareShowsAPI` for the API name
   - Select "Regional" for the endpoint type
   - Click "Create API"

2. **Create Resources and Methods**:

   a. **Search Resource**:
   - Click "Create Resource"
   - Enter `search` for the resource name
   - Click "Create Resource"
   - With the `/search` resource selected, click "Create Resource" again
   - Enter `multi` for the resource name
   - Click "Create Resource"
   - With the `/search/multi` resource selected, click "Create Method"
   - Select "GET" and click the checkmark
   - Select "Lambda Function" for the integration type
   - Check "Use Lambda Proxy integration"
   - Select your region and enter `compare-shows-search` for the Lambda function
   - Click "Save"
   
   b. **IMDb Search Resource**:
   - With the `/search` resource selected, click "Create Resource"
   - Enter `imdb` for the resource name
   - Click "Create Resource"
   - With the `/search/imdb` resource selected, click "Create Resource"
   - Check "Configure as proxy resource"
   - Enter `{id}` for the resource name
   - Click "Create Resource"
   - Select "Lambda Function" for the integration type
   - Select your region and enter `compare-shows-search` for the Lambda function
   - Click "Save"
   
   c. **Project Resource**:
   - Click on the root of your API
   - Click "Create Resource"
   - Enter `project` for the resource name
   - Click "Create Resource"
   - With the `/project` resource selected, click "Create Resource"
   - Enter `{mediaType}` for the resource name
   - Click "Create Resource"
   - With the `/project/{mediaType}` resource selected, click "Create Resource"
   - Enter `{id}` for the resource name
   - Click "Create Resource"
   - With the `/project/{mediaType}/{id}` resource selected, click "Create Method"
   - Select "GET" and click the checkmark
   - Select "Lambda Function" for the integration type
   - Check "Use Lambda Proxy integration"
   - Select your region and enter `compare-shows-project` for the Lambda function
   - Click "Save"
   
   d. **Compare Resource**:
   - Click on the root of your API
   - Click "Create Resource"
   - Enter `compare` for the resource name
   - Click "Create Resource"
   - With the `/compare` resource selected, click "Create Method"
   - Select "POST" and click the checkmark
   - Select "Lambda Function" for the integration type
   - Check "Use Lambda Proxy integration"
   - Select your region and enter `compare-shows-compare` for the Lambda function
   - Click "Save"

3. **Enable CORS**:
   - For each resource (e.g., `/search/multi`, `/project/{mediaType}/{id}`, `/compare`):
     - Select the resource
     - Click "Actions" and select "Enable CORS"
     - Enter `*` for "Access-Control-Allow-Origin"
     - Check all the default methods
     - Click "Enable CORS and replace existing CORS headers"
     - Click "Yes, replace existing values"

4. **Deploy the API**:
   - Click "Actions" and select "Deploy API"
   - Select "New Stage" for the deployment stage
   - Enter `prod` for the stage name
   - Click "Deploy"
   - Note the "Invoke URL" at the top of the page (you'll need this later)

### CloudFront Distribution

1. **Request an SSL Certificate**:
   - Navigate to AWS Certificate Manager (ACM)
   - Click "Request a certificate"
   - Select "Request a public certificate" and click "Next"
   - Enter `compare.my.useless.blog` for the domain name
   - Select "DNS validation" for the validation method
   - Click "Request"
   - Note the CNAME record details for domain validation (you'll need these for Route 53)

2. **Create a CloudFront Distribution**:
   - Navigate to CloudFront in the AWS Console
   - Click "Create Distribution"
   - For "Origin Domain", enter your S3 website endpoint URL
   - For "Origin ID", leave the default
   - For "Viewer Protocol Policy", select "Redirect HTTP to HTTPS"
   - For "Allowed HTTP Methods", select "GET, HEAD, OPTIONS"
   - For "Cache Policy", select "CachingOptimized"
   - For "Price Class", select "Use only North America and Europe" (cheapest option)
   - For "Alternate Domain Names (CNAMEs)", enter `compare.my.useless.blog`
   - For "Custom SSL Certificate", select the certificate you requested
   - For "Default Root Object", enter `index.html`
   - Click "Create Distribution"
   - Note the distribution domain name (e.g., `d1234abcd.cloudfront.net`)

### Route 53 for DNS

1. **Create a Hosted Zone**:
   - Navigate to Route 53 in the AWS Console
   - Click "Hosted zones"
   - Click "Create hosted zone"
   - Enter `compare.my.useless.blog` for the domain name
   - Select "Public hosted zone" for the type
   - Click "Create hosted zone"
   - Note the four nameservers listed in the NS record (you'll need these for Siteground)

2. **Create Records**:
   - In your hosted zone, click "Create record"
   - Leave the "Record name" field empty (for the apex domain)
   - Select "A - Routes traffic to an IPv4 address and some AWS resources" for the record type
   - Enable "Alias"
   - Select "Alias to CloudFront distribution" for the route traffic to
   - Select your CloudFront distribution
   - Click "Create records"

3. **Validate Your ACM Certificate**:
   - Go back to the ACM console
   - Find your certificate and click on it
   - In the "Domains" section, click "Create records in Route 53"
   - Select all domains and click "Create records"
   - Wait for the certificate status to change to "Issued" (this may take a few minutes)

## DNS Configuration with Siteground

1. **Create a Subdomain in Siteground**:
   - Log in to your Siteground account
   - Navigate to "Websites" > "Site Tools" for your useless.blog domain
   - In the left sidebar, go to "Domain" > "Subdomains"
   - Create a new subdomain:
     - Enter "compare.my" in the subdomain field
     - Select "useless.blog" as the domain
     - Choose any document root directory (this won't matter since we're delegating DNS)
     - Click "Create"

2. **Set Up DNS Delegation**:
   - In Siteground, navigate to "Domain" > "DNS Zone Editor"
   - Find the "compare.my" subdomain
   - Create four NS records, one for each of the Route 53 nameservers you noted earlier
   - Remove any existing A or CNAME records for the subdomain
   - Click "Save"

3. **Verify DNS Propagation**:
   - DNS changes can take up to 48 hours to propagate, but often complete within a few hours
   - Use a tool like [dnschecker.org](https://dnschecker.org) to verify that your subdomain is pointing to the Route 53 nameservers
   - Once propagation is complete, your subdomain should resolve to your CloudFront distribution

## Local Preparation and Deployment

### Code Modifications

1. **Create a deployment directory structure**:
   ```bash
   mkdir -p aws-deployment/lambda
   mkdir -p aws-deployment/frontend
   ```

2. **Modify the frontend code**:
   - Copy your frontend files to the `aws-deployment/frontend` directory
   - Update the API endpoint in `app.js`:
     ```javascript
     // Change this line
     const API_BASE_URL = '/api';
     
     // To this (replace with your actual API Gateway URL)
     const API_BASE_URL = 'https://your-api-id.execute-api.your-region.amazonaws.com/prod';
     ```

3. **Create Lambda function handlers**:

   a. **Create a shared utilities file**:
   ```bash
   # Create utils.js in the lambda directory
   cat > aws-deployment/lambda/utils.js << 'EOF'
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
   EOF
   ```

   b. **Create the search function handler**:
   ```bash
   # Create search.js in the lambda directory
   cat > aws-deployment/lambda/search.js << 'EOF'
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
   EOF
   ```

   c. **Create the project details function handler**:
   ```bash
   # Create project.js in the lambda directory
   cat > aws-deployment/lambda/project.js << 'EOF'
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
   EOF
   ```

   d. **Create the compare function handler**:
   ```bash
   # Create compare.js in the lambda directory
   cat > aws-deployment/lambda/compare.js << 'EOF'
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
   EOF
   ```

### Building and Packaging

1. **Create a package.json file for Lambda functions**:
   ```bash
   cat > aws-deployment/lambda/package.json << 'EOF'
   {
     "name": "compare-shows-lambda",
     "version": "1.0.0",
     "description": "Lambda functions for Compare TV Shows application",
     "dependencies": {
       "aws-sdk": "^2.1048.0",
       "axios": "^0.24.0"
     }
   }
   EOF
   ```

2. **Install dependencies and create deployment packages**:
   ```bash
   # Navigate to the lambda directory
   cd aws-deployment/lambda

   # Install dependencies
   npm install

   # Create deployment packages
   mkdir -p dist

   # Package search function
   zip -r dist/search.zip search.js utils.js node_modules

   # Package project function
   zip -r dist/project.zip project.js utils.js node_modules

   # Package compare function
   zip -r dist/compare.zip compare.js utils.js node_modules

   # Return to the project root
   cd ../..
   ```

3. **Prepare frontend files for S3**:
   ```bash
   # Copy frontend files
   cp -r public/* aws-deployment/frontend/

   # Update API endpoint in app.js
   # Replace this manually with your actual API Gateway URL
   sed -i 's|const API_BASE_URL = "/api";|const API_BASE_URL = "https://your-api-id.execute-api.your-region.amazonaws.com/prod";|g' aws-deployment/frontend/js/app.js
   ```

### Deployment Scripts

1. **Create a deployment script for Lambda functions**:
   ```bash
   cat > aws-deployment/deploy-lambda.sh << 'EOF'
   #!/bin/bash
   
   # Replace these with your actual values
   REGION="us-east-1"
   
   # Deploy search function
   echo "Deploying search function..."
   aws lambda update-function-code \
     --function-name compare-shows-search \
     --zip-file fileb://lambda/dist/search.zip \
     --region $REGION
   
   # Deploy project function
   echo "Deploying project function..."
   aws lambda update-function-code \
     --function-name compare-shows-project \
     --zip-file fileb://lambda/dist/project.zip \
     --region $REGION
   
   # Deploy compare function
   echo "Deploying compare function..."
   aws lambda update-function-code \
     --function-name compare-shows-compare \
     --zip-file fileb://lambda/dist/compare.zip \
     --region $REGION
   
   echo "Lambda deployment complete!"
   EOF
   
   chmod +x aws-deployment/deploy-lambda.sh
   ```

2. **Create a deployment script for frontend files**:
   ```bash
   cat > aws-deployment/deploy-frontend.sh << 'EOF'
   #!/bin/bash
   
   # Replace these with your actual values
   S3_BUCKET="your-s3-bucket-name"
   CLOUDFRONT_DISTRIBUTION_ID="your-cloudfront-distribution-id"
   
   # Sync frontend files to S3
   echo "Uploading frontend files to S3..."
   aws s3 sync frontend/ s3://$S3_BUCKET/ --delete
   
   # Invalidate CloudFront cache
   echo "Invalidating CloudFront cache..."
   aws cloudfront create-invalidation \
     --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
     --paths "/*"
   
   echo "Frontend deployment complete!"
   EOF
   
   chmod +x aws-deployment/deploy-frontend.sh
   ```

3. **Create a master deployment script**:
   ```bash
   cat > aws-deployment/deploy-all.sh << 'EOF'
   #!/bin/bash
   
   echo "Starting deployment..."
   
   # Deploy Lambda functions
   ./deploy-lambda.sh
   
   # Deploy frontend
   ./deploy-frontend.sh
   
   echo "Deployment complete!"
   EOF
   
   chmod +x aws-deployment/deploy-all.sh
   ```

## Security Considerations

### Protecting Your TMDB API Key

1. **Use AWS Systems Manager Parameter Store**:
   - Navigate to AWS Systems Manager in the console
   - Click "Parameter Store" in the left sidebar
   - Click "Create parameter"
   - Enter `/compare-shows/tmdb-api-key` for the name
   - Select "SecureString" for the type
   - Enter your TMDB API key for the value
   - Click "Create parameter"

2. **Update Lambda functions to use Parameter Store**:
   - Add the following
