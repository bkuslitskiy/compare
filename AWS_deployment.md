# AWS Deployment Guide for Compare TV Shows V2

This guide provides detailed instructions for deploying the Compare TV Shows V2 application on AWS Free Tier services, with DNS configuration for the compare.my.useless.blog subdomain.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [AWS Infrastructure Setup](#aws-infrastructure-setup)
   - [S3 Bucket for Frontend](#s3-bucket-for-frontend)
   - [DynamoDB for Caching](#dynamodb-for-caching)
   - [Lambda Functions for Backend](#lambda-functions-for-backend)
   - [API Gateway](#api-gateway)
   - [CloudFront Distribution](#cloudfront-distribution)
   - [Route 53 for DNS](#route-53-for-dns)
3. [DNS Configuration with Siteground](#dns-configuration-with-siteground)
4. [Local Preparation and Deployment](#local-preparation-and-deployment)
   - [Directory Structure Setup](#directory-structure-setup)
   - [Lambda Function Files](#lambda-function-files)
   - [Frontend Preparation](#frontend-preparation)
   - [Building and Packaging](#building-and-packaging)
   - [Deployment Scripts](#deployment-scripts)
5. [Security Considerations](#security-considerations)
6. [Testing and Verification](#testing-and-verification)
7. [Post-Deployment Steps](#post-deployment-steps)
   - [Accessing Your Application](#accessing-your-application)
   - [Using the Application](#using-the-application)
   - [Updating the Application](#updating-the-application)
8. [Troubleshooting](#troubleshooting)
9. [Monitoring and Maintenance](#monitoring-and-maintenance)

## Prerequisites

Before starting the deployment process, ensure you have:

1. An AWS account with Free Tier access
2. AWS CLI installed and configured on your local machine
   ```powershell
   # Install AWS CLI (using pip)
   pip install awscli
   
   # Configure with your credentials
   aws configure
   ```
3. Your TMDB API key
4. Node.js and npm installed locally
5. Access to your Siteground account for DNS configuration
6. Domain ownership for useless.blog and its subdomains
7. PowerShell 5.1 or higher

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
   - Select "Node.js 20.x" for the runtime (or the latest LTS version)
   - Under "Permissions", select "Use an existing role"
   - Select the `CompareShowsLambdaRole` you created
   - Click "Create function"
   - In the "Code" tab, you'll upload a ZIP file containing your search function code (we'll prepare this in the local steps)
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

3. **Lambda Layer (Optional)**:
   - If you prefer to manage shared code separately, you can create a Lambda Layer
   - In the Lambda console, click "Layers" in the left sidebar
   - Click "Create layer"
   - Enter `compare-shows-common` for the name
   - Upload a ZIP file containing shared code (axios, utilities, etc.)
   - Select compatible runtimes: Node.js 20.x (or the version you're using)
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

### Directory Structure Setup

1. **Create the deployment directory structure**:
   ```powershell
   # Create the main directories
   New-Item -ItemType Directory -Path aws-deployment -Force
   New-Item -ItemType Directory -Path aws-deployment\lambda -Force
   New-Item -ItemType Directory -Path aws-deployment\frontend -Force
   ```

### Lambda Function Files

1. **Create the necessary Lambda function files**:
   - Create `utils.js` in the lambda directory with shared utilities for all functions
   - Create `search.js` for the search function handler
   - Create `project.js` for the project details function handler
   - Create `compare.js` for the compare function handler

2. **Create a package.json file for Lambda functions**:
   ```powershell
   # Navigate to the lambda directory
   Set-Location -Path aws-deployment\lambda

   # Create package.json
   @'
   {
     "name": "compare-shows-lambda",
     "version": "1.0.0",
     "description": "Lambda functions for Compare TV Shows application",
     "dependencies": {
       "aws-sdk": "^2.1048.0",
       "axios": "^0.24.0"
     }
   }
   '@ | Out-File -FilePath package.json -Encoding utf8

   # Return to the project root
   Set-Location -Path ..\..
   ```

### Frontend Preparation

1. **Copy frontend files**:
   ```powershell
   # Copy frontend files
   Copy-Item -Path public\* -Destination aws-deployment\frontend\ -Recurse
   ```

2. **Update the API endpoint in app.js**:
   ```powershell
   # Replace the API endpoint in app.js
   # Replace YOUR-API-ID and YOUR-REGION with your actual values
   (Get-Content aws-deployment\frontend\js\app.js) -replace 'const API_BASE_URL = "/api";', 'const API_BASE_URL = "https://YOUR-API-ID.execute-api.YOUR-REGION.amazonaws.com/prod";' | Set-Content aws-deployment\frontend\js\app.js
   ```

### Building and Packaging

1. **Create a script to prepare Lambda packages**:
   ```powershell
   # Create the prepare-lambda-packages.ps1 script
   @'
   # PowerShell script to prepare Lambda deployment packages

   Write-Host "Preparing Lambda deployment packages..."

   # Navigate to the lambda directory
   Set-Location -Path lambda

   # Install dependencies
   Write-Host "Installing dependencies..."
   npm install

   # Create dist directory if it doesn't exist
   if (-not (Test-Path -Path "dist")) {
       New-Item -ItemType Directory -Path "dist"
   }

   # Package search function
   Write-Host "Creating search function package..."
   Compress-Archive -Path "search.js", "utils.js", "node_modules" -DestinationPath "dist\search.zip" -Force

   # Package project function
   Write-Host "Creating project function package..."
   Compress-Archive -Path "project.js", "utils.js", "node_modules" -DestinationPath "dist\project.zip" -Force

   # Package compare function
   Write-Host "Creating compare function package..."
   Compress-Archive -Path "compare.js", "utils.js", "node_modules" -DestinationPath "dist\compare.zip" -Force

   Write-Host "Lambda packages prepared successfully!"
   '@ | Out-File -FilePath aws-deployment\prepare-lambda-packages.ps1 -Encoding utf8
   ```

2. **Run the script to create the Lambda packages**:
   ```powershell
   # Navigate to the aws-deployment directory
   Set-Location -Path aws-deployment

   # Run the script
   .\prepare-lambda-packages.ps1

   # Return to the project root
   Set-Location -Path ..
   ```

### Deployment Scripts

1. **Create a script for deploying Lambda functions**:
   ```powershell
   # Create the deploy-lambda.ps1 script
   @'
   # PowerShell script to deploy Lambda functions

   # Replace these with your actual values
   $REGION = "us-east-1"

   # Deploy search function
   Write-Host "Deploying search function..."
   aws lambda update-function-code `
     --function-name compare-shows-search `
     --zip-file fileb://lambda/dist/search.zip `
     --region $REGION

   # Deploy project function
   Write-Host "Deploying project function..."
   aws lambda update-function-code `
     --function-name compare-shows-project `
     --zip-file fileb://lambda/dist/project.zip `
     --region $REGION

   # Deploy compare function
   Write-Host "Deploying compare function..."
   aws lambda update-function-code `
     --function-name compare-shows-compare `
     --zip-file fileb://lambda/dist/compare.zip `
     --region $REGION

   Write-Host "Lambda deployment complete!"
   '@ | Out-File -FilePath aws-deployment\deploy-lambda.ps1 -Encoding utf8
   ```

2. **Create a script for deploying frontend files**:
   ```powershell
   # Create the deploy-frontend.ps1 script
   @'
   # PowerShell script to deploy frontend files

   # Replace these with your actual values
   $S3_BUCKET = "your-s3-bucket-name"
   $CLOUDFRONT_DISTRIBUTION_ID = "your-cloudfront-distribution-id"

   # Sync frontend files to S3
   Write-Host "Uploading frontend files to S3..."
   aws s3 sync frontend/ s3://$S3_BUCKET/ --delete

   # Invalidate CloudFront cache
   Write-Host "Invalidating CloudFront cache..."
   aws cloudfront create-invalidation `
     --distribution-id $CLOUDFRONT_DISTRIBUTION_ID `
     --paths "/*"

   Write-Host "Frontend deployment complete!"
   '@ | Out-File -FilePath aws-deployment\deploy-frontend.ps1 -Encoding utf8
   ```

3. **Create a master deployment script**:
   ```powershell
   # Create the deploy-all.ps1 script
   @'
   # PowerShell script to deploy all components

   Write-Host "Starting deployment..."

   # Deploy Lambda functions
   Write-Host "Running Lambda deployment..."
   & .\deploy-lambda.ps1

   # Deploy frontend
   Write-Host "Running frontend deployment..."
   & .\deploy-frontend.ps1

   Write-Host "Deployment complete!"
   '@ | Out-File -FilePath aws-deployment\deploy-all.ps1 -Encoding utf8
   ```

4. **Run the deployment scripts**:
   ```powershell
   # Navigate to the aws-deployment directory
   Set-Location -Path aws-deployment

   # Run the master deployment script
   .\deploy-all.ps1

   # Return to the project root
   Set-Location -Path ..
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
   - Add the AWS SDK for Systems Manager to your Lambda function
   - Modify your code to retrieve the API key from Parameter Store
   - Update the IAM role to include permissions for `ssm:GetParameter`

### Restricting API Access

1. **Set up API Key for API Gateway**:
   - In API Gateway, go to "API Keys" in the left sidebar
   - Click "Create API key"
   - Enter a name for your API key
   - Click "Save"
   - Go to "Usage Plans" and create a new usage plan
   - Associate your API key with the usage plan
   - Associate your API stage with the usage plan

2. **Configure CORS Properly**:
   - Instead of allowing all origins (`*`), specify only the domains that need access
   - Limit the allowed HTTP methods to only those needed
   - Consider implementing a more restrictive CORS policy in production

## Testing and Verification

1. **Test Lambda Functions**:
   - In the Lambda console, use the "Test" feature to create test events
   - Create test events for each function with sample input data
   - Verify that the functions return the expected output

2. **Test API Gateway Endpoints**:
   - Use a tool like Postman or curl to test your API endpoints
   - Verify that the endpoints return the expected responses
   - Test error handling by providing invalid input

3. **Test Frontend Integration**:
   - Open your CloudFront URL in a browser
   - Verify that the frontend can communicate with the API
   - Test all features of the application

## Post-Deployment Steps

### Accessing Your Application

1. **Access via CloudFront URL**:
   - After deployment is complete, you can access your application using the CloudFront URL
   - This URL will look something like `https://d1234abcd.cloudfront.net`
   - You can find this URL in the CloudFront console under "Distributions"

2. **Access via Custom Domain**:
   - Once DNS propagation is complete, you can access your application using your custom domain
   - In this case, the URL would be `https://compare.my.useless.blog`
   - This may take up to 48 hours after DNS configuration, but often completes within a few hours

3. **Verify SSL Certificate**:
   - Ensure that the SSL certificate is working correctly by checking for the padlock icon in your browser
   - If there are certificate issues, check the ACM console to verify the certificate status

### Using the Application

1. **Search for TV Shows and Movies**:
   - Use the search bar at the top of the application to search for TV shows and movies
   - Enter a title or keyword and press Enter or click the search icon
   - The application will display matching results from the TMDB API

2. **View Project Details**:
   - Click on a search result to view detailed information about the TV show or movie
   - This includes cast, crew, ratings, release dates, and other metadata

3. **Compare Projects**:
   - Select multiple TV shows or movies to compare
   - Click the "Compare" button to see a side-by-side comparison
   - The comparison will highlight common cast and crew members between the selected projects

4. **Share Comparisons**:
   - Use the share button to generate a shareable link for your comparison
   - This link can be sent to others to view the same comparison

### Updating the Application

1. **Update Frontend**:
   - Make changes to the frontend code in your local development environment
   - Test the changes locally
   - Copy the updated files to the `aws-deployment/frontend` directory
   - Run the frontend deployment script to update the S3 bucket and invalidate the CloudFront cache:
     ```powershell
     Set-Location -Path aws-deployment
     .\deploy-frontend.ps1
     ```

2. **Update Lambda Functions**:
   - Make changes to the Lambda function code in your local development environment
   - Test the changes locally
   - Update the files in the `aws-deployment/lambda` directory
   - Run the Lambda deployment script to update the functions:
     ```powershell
     Set-Location -Path aws-deployment
     .\prepare-lambda-packages.ps1
     .\deploy-lambda.ps1
     ```

3. **Update API Gateway**:
   - If you need to make changes to the API Gateway configuration:
     - Make the changes in the API Gateway console
     - Deploy the API again by clicking "Actions" and selecting "Deploy API"
     - Select the "prod" stage and click "Deploy"
     - Update the API endpoint in the frontend code if necessary

## Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Verify that CORS is properly configured in API Gateway
   - Check that the frontend is using the correct API endpoint
   - Ensure that the necessary headers are included in the API responses

2. **Lambda Function Errors**:
   - Check CloudWatch Logs for error messages
   - Verify that the IAM role has the necessary permissions
   - Ensure that environment variables are correctly set

3. **CloudFront Issues**:
   - Check that the distribution is properly configured
   - Verify that the origin is correctly set to your S3 bucket
   - Ensure that the cache behavior is properly configured

## Monitoring and Maintenance

1. **Set up CloudWatch Alarms**:
   - Create alarms for Lambda function errors
   - Monitor API Gateway request counts and latency
   - Set up notifications for when thresholds are exceeded

2. **Regular Updates**:
   - Keep dependencies up to date
   - Regularly review and update IAM policies
   - Monitor AWS service announcements for changes

3. **Backup Strategy**:
   - Regularly backup your DynamoDB table
   - Keep a copy of your deployment files
   - Document your infrastructure setup
