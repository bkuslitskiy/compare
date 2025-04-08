# Comprehensive AWS Deployment Guide: Compare TV Shows Application

**Introduction**

This guide provides step-by-step instructions for deploying the Compare TV Shows application to AWS Free Tier. It incorporates all recent improvements and best practices, with a focus on security, monitoring, and troubleshooting. This guide assumes no prior coding experience and uses PowerShell commands where applicable.

## Application Architecture

The application consists of:
- **Frontend**: Static website hosted on S3 and distributed via CloudFront
- **Backend**: Lambda functions that handle search, project details, and comparison operations
- **BFF (Backend-For-Frontend)**: A Lambda function that securely proxies requests to the TMDB API
- **API Gateway**: Routes frontend requests to the appropriate Lambda functions

> **Important**: This deployment uses the Backend-For-Frontend (BFF) pattern to securely handle the TMDB API key, ensuring it's never exposed in frontend code.

## Prerequisites

1. **AWS Account**: Sign up at [https://aws.amazon.com/](https://aws.amazon.com/)
2. **AWS CLI**: Download and install from [https://aws.amazon.com/cli/](https://aws.amazon.com/cli/)
3. **AWS CLI Configuration**: Run `aws configure` in PowerShell and enter your credentials
4. **Node.js and npm**: Download and install from [https://nodejs.org/](https://nodejs.org/)
5. **PowerShell**: Pre-installed on Windows
6. **TMDB API Key**: Register at [https://www.themoviedb.org/](https://www.themoviedb.org/) and request an API key

## Step 1: Prepare Your Local Environment

1. **Clone or download the project repository**
2. **Open PowerShell and navigate to the project directory**
3. **Verify the project structure**:
   - Ensure you have the `aws-deployment` directory containing deployment scripts
   - Verify the `public` directory contains the frontend files
   - Check that the `aws-deployment/lambda` directory contains the Lambda function files

## Step 2: Set Up Lambda Functions

### 2.1 Prepare Lambda Packages

1. **Navigate to the project directory in PowerShell**
2. **Run the Lambda package preparation script**:
   ```powershell
   .\aws-deployment\prepare-lambda-packages.ps1
   ```
   This script will:
   - Navigate to the lambda directory
   - Install dependencies
   - Create ZIP packages for each Lambda function (search, project, compare, and bff)

### 2.2 Create Lambda Functions in AWS Console

1. **Log in to the AWS Console and navigate to Lambda**
2. **Create the following Lambda functions**:
   - `compare-shows-search`
   - `compare-shows-project`
   - `compare-shows-compare`
   - `compare-shows-bff`

3. **For each function, use these settings**:
   - Runtime: Node.js 18.x (or latest available)
   - Architecture: x86_64
   - Permissions: Create a new role with basic Lambda permissions
   - Memory: 256 MB (increase if needed)
   - Timeout: 30 seconds
   - **Important**: For the `compare-shows-bff` function, set the handler to `bff.handler` (not the default `index.handler`)
   - For all other functions, use the default handler (`index.handler`)

### 2.3 Configure Environment Variables

1. **For the `compare-shows-bff` function only**:
   - Go to the function's "Configuration" tab
   - Select "Environment variables"
   - Add the following variables:
     - Key: `TMDB_API_KEY`, Value: Your TMDB API key
     - Key: `TMDB_API_BASE_URL`, Value: `https://api.themoviedb.org/3`

### 2.4 Configure CloudWatch Logs

1. **For each Lambda function**:
   - Go to the function's "Configuration" tab
   - Select "Monitoring and operations tools"
   - Enable "Enhanced monitoring" for detailed metrics
   - Under "CloudWatch Logs", ensure log group creation is enabled

2. **Set up log retention to manage costs**:
   - Go to CloudWatch > Log Groups
   - For each Lambda function's log group:
     - Select the log group
     - Actions > Edit retention setting
     - Set to 14 days (or appropriate period for your needs)

### 2.5 Deploy Lambda Functions

1. **Navigate to the project directory in PowerShell**
2. **Run the Lambda deployment script**:
   ```powershell
   .\aws-deployment\deploy-lambda.ps1
   ```
   This script will upload each ZIP package to its corresponding Lambda function in AWS.

## Step 3: Set Up API Gateway

### 3.1 Create a REST API

1. **In the AWS Console, go to API Gateway**
2. **Create a new REST API** (not HTTP API)
3. **Name it** (e.g., "compare-shows-api")

### 3.2 Create Resources and Methods

1. **Create a resource named `/bff`**:
   - Click "Create Resource"
   - Resource Name: `bff`
   - Resource Path: `/bff`
   - Click "Create Resource"

2. **Create a proxy resource under `/bff`**:
   - With `/bff` selected, click "Create Resource"
   - Check "Configure as proxy resource"
   - Resource Path: `/{proxy+}`
   - Click "Create Resource"

3. **Set up the ANY method for the proxy resource**:
   - Integration type: Lambda Function
   - Lambda Function: `compare-shows-bff`
   - Use Lambda Proxy integration: Yes (checked)
   - Click "Save"

4. **Grant API Gateway permission to invoke Lambda**:
   - If prompted, click "OK" to add permission to the Lambda function

### 3.3 Enable CORS

1. **Select the `/bff` resource**
2. **Click "Actions" > "Enable CORS"**
3. **Configure CORS settings**:
   - Access-Control-Allow-Origin: `*`
   - Access-Control-Allow-Headers: `Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token`
   - Access-Control-Allow-Methods: `GET,POST,PUT,DELETE,OPTIONS,PATCH`
   - Click "Enable CORS and replace existing CORS headers"

### 3.4 Deploy the API

1. **Click "Actions" > "Deploy API"**
2. **Deployment stage**: Create a new stage named "prod"
3. **Click "Deploy"**
4. **Note the Invoke URL** displayed at the top of the stage editor page

## Step 4: Set Up Frontend Hosting

### 4.1 Create an S3 Bucket

1. **In the AWS Console, go to S3**
2. **Create a new bucket**:
   - Bucket name: Choose a globally unique name (e.g., `compare-tv-shows-frontend-yourusername`)
   - Region: Same as your Lambda functions
   - Block all public access: Yes (checked)
   - Bucket versioning: Disabled
   - Default encryption: Enable
   - Click "Create bucket"

### 4.2 Configure the Bucket for Static Website Hosting

1. **Select your bucket**
2. **Go to the "Properties" tab**
3. **Scroll down to "Static website hosting"**
4. **Click "Edit"**
5. **Configure**:
   - Static website hosting: Enable
   - Hosting type: Host a static website
   - Index document: `index.html`
   - Error document: `error.html`
   - Click "Save changes"

### 4.3 Create a CloudFront Distribution

1. **In the AWS Console, go to CloudFront**
2. **Create a new distribution**:
   - Origin domain: Select your S3 bucket
   - Origin access: Origin access control settings (recommended)
   - Create new OAC: Yes
   - Origin access control: Create a new control setting
   - Sign requests: Yes
   - Default cache behavior:
     - Viewer protocol policy: Redirect HTTP to HTTPS
     - Allowed HTTP methods: GET, HEAD
     - Cache policy: CachingOptimized
   - Default root object: `index.html`
   - Click "Create distribution"

3. **Update S3 bucket policy**:
   - CloudFront will display a policy to copy
   - Go back to your S3 bucket > Permissions > Bucket policy
   - Paste the policy and click "Save"

### 4.4 Update Deployment Scripts

1. **Edit the frontend deployment script**:
   - Open `aws-deployment\deploy-frontend.ps1` in a text editor
   - Update the `$S3_BUCKET` variable with your bucket name
   - Update the `$CLOUDFRONT_DISTRIBUTION_ID` with your distribution ID

### 4.5 Update Frontend Configuration

1. **Edit the frontend API configuration**:
   - Open `public\js\app.js` in a text editor
   - Find the line defining `API_BASE_URL`
   - Update it with your API Gateway URL:
     ```javascript
     const API_BASE_URL = 'https://your-api-id.execute-api.region.amazonaws.com/prod/bff';
     ```

### 4.6 Deploy the Frontend

1. **Navigate to the project directory in PowerShell**
2. **Run the frontend deployment script**:
   ```powershell
   .\aws-deployment\deploy-frontend.ps1
   ```
   This script will:
   - Sync the `../public` directory (relative to the aws-deployment directory) to your S3 bucket
   - Invalidate the CloudFront cache

## Step 5: Test the Application

1. **Access your application**:
   - Open your CloudFront distribution URL in a web browser
   - The URL will look like: `https://d1234abcdef.cloudfront.net`

2. **Test functionality**:
   - Search for TV shows or movies
   - Select shows to compare
   - Verify comparison results display correctly

## Step 6: Monitoring and Maintenance

### 6.1 Set Up CloudWatch Alarms

1. **In the AWS Console, go to CloudWatch > Alarms**
2. **Create alarms for Lambda errors**:
   - Click "Create alarm"
   - Select metric: Lambda > By Function Name > Errors
   - Select your Lambda functions
   - Set threshold: Greater than 0
   - Configure notifications (optional)
   - Click "Create alarm"

### 6.2 Set Up CloudWatch Dashboard

1. **In CloudWatch, go to Dashboards**
2. **Create a new dashboard**:
   - Add widgets for:
     - Lambda invocations and errors
     - API Gateway requests
     - CloudFront requests and error rates
     - S3 bucket metrics

### 6.3 Regular Maintenance Tasks

1. **Review CloudWatch Logs weekly**:
   - Check for errors or performance issues
   - Adjust Lambda memory/timeout if needed

2. **Monitor AWS costs**:
   - Use AWS Cost Explorer to track spending
   - Set up budget alerts to avoid unexpected charges

3. **Update dependencies periodically**:
   - Run the prepare and deploy scripts to update packages

## Troubleshooting Common Issues

### Lambda Function Errors

1. **"Cannot find module 'index'" error**:
   - Ensure the handler is correctly set to `bff.handler` for the BFF function
   - Verify the ZIP package contains the correct files

2. **API Key errors (403 Forbidden)**:
   - Check that the `TMDB_API_KEY` environment variable is correctly set
   - Verify the API key is valid by testing it directly with the TMDB API

3. **Timeout errors**:
   - Increase the Lambda function timeout in the configuration
   - Consider optimizing the code or increasing memory allocation

### API Gateway Issues

1. **CORS errors**:
   - Ensure CORS is properly configured on the API Gateway
   - Verify the `Access-Control-Allow-Origin` header is set correctly

2. **403 Forbidden errors**:
   - Check that API Gateway has permission to invoke the Lambda function
   - Verify the resource policy on the Lambda function

3. **404 Not Found errors**:
   - Ensure the API Gateway resources and methods are correctly configured
   - Verify the API is deployed to the "prod" stage

### Frontend Deployment Issues

1. **Changes not reflecting after deployment**:
   - Ensure the CloudFront cache is invalidated
   - Check browser cache (try hard refresh: Ctrl+F5)

2. **S3 access denied**:
   - Verify the bucket policy allows CloudFront to access the bucket
   - Check that the Origin Access Control is correctly configured

## Best Practices

1. **Security**:
   - Never store API keys in frontend code
   - Use the BFF pattern to proxy API requests
   - Enable AWS CloudTrail for auditing
   - Regularly rotate AWS access keys

2. **Cost Management**:
   - Set up AWS Budgets to monitor spending
   - Configure CloudWatch Logs retention periods
   - Use the AWS Free Tier limits as guidance

3. **Performance**:
   - Optimize Lambda functions for cold starts
   - Use CloudFront caching effectively
   - Consider API Gateway caching for repeated requests

4. **Monitoring**:
   - Set up CloudWatch Alarms for critical metrics
   - Create a CloudWatch Dashboard for visibility
   - Enable X-Ray tracing for request analysis

## AWS Free Tier Considerations

The AWS Free Tier includes:
- Lambda: 1 million free requests per month, 400,000 GB-seconds of compute time
- API Gateway: 1 million API calls per month
- CloudFront: 50 GB data transfer out, 2 million HTTP/HTTPS requests per month
- S3: 5 GB standard storage, 20,000 GET requests, 2,000 PUT requests
- CloudWatch: 10 custom metrics, 10 alarms, 1 million API requests

To stay within these limits:
- Set up billing alerts
- Monitor usage regularly
- Configure appropriate log retention periods
- Optimize Lambda functions for efficiency

## Conclusion

You've successfully deployed the Compare TV Shows application to AWS using the free tier. The application uses a secure Backend-For-Frontend pattern to protect your TMDB API key while providing a responsive user experience.

By following this guide, you've learned how to:
1. Set up and configure Lambda functions
2. Create and configure API Gateway
3. Deploy a static website to S3 and CloudFront
4. Implement CloudWatch monitoring
5. Troubleshoot common deployment issues

Remember to regularly check your AWS billing dashboard to ensure you stay within the free tier limits.
