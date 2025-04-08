# Deployment Guide: Compare TV Shows Application to AWS Free Tier

**Introduction**

This guide will walk you through deploying the Compare TV Shows application to the AWS Free Tier. It is designed for users with no prior programming or coding experience.

![Application Architecture](https://i.imgur.com/XYZ123.png)

*Figure: The application architecture showing how the frontend, API Gateway, Lambda functions, and TMDB API interact.*

> **Important Note About API Keys**: This deployment guide focuses on securely handling the TMDB API key using the Backend-For-Frontend (BFF) pattern. This ensures your API key is never exposed in the frontend code, protecting it from being misused.

**Prerequisites**

1.  **AWS Account:** You'll need an AWS account. Sign up at [https://aws.amazon.com/](https://aws.amazon.com/). The free tier has limitations, but it's sufficient for running this application.
2.  **AWS CLI:** The AWS Command Line Interface (CLI) is a tool for managing AWS services. Download and install it from [https://aws.amazon.com/cli/](https://aws.amazon.com/cli/).
3.  **Configure AWS CLI:** After installing the AWS CLI, you need to configure it with your AWS credentials. Open PowerShell and run `aws configure`. You'll be prompted for your Access Key ID, Secret Access Key, default region name, and output format.
4.  **Node.js and npm:** Node.js is a JavaScript runtime environment, and npm is its package manager. Download and install them from [https://nodejs.org/](https://nodejs.org/).
5.  **PowerShell:** This guide uses PowerShell commands, which are pre-installed on Windows.

**Step 1: Set up the Backend (Lambda Functions)**

1.  **Get a TMDB API Key:**
    *   Go to [https://www.themoviedb.org/](https://www.themoviedb.org/) and create an account.
    *   Navigate to your account settings and request an API key. Choose the "Developer" option.
    *   Once you have the API key, save it. You'll need it later.

2.  **Prepare Lambda Packages:**
    *   Open PowerShell and navigate to the `aws-deployment` directory in your project.
    *   Run the following command to install dependencies and create the deployment packages:

    ```powershell
    .\prepare-lambda-packages.ps1
    ```
    *   This script will:
        *   Navigate to the lambda directory
        *   Install all required dependencies
        *   Create ZIP packages for each Lambda function

3.  **Create Lambda Functions:**
    *   In the AWS Console, go to Lambda and create the following functions:
        *   `compare-shows-search`
        *   `compare-shows-project`
        *   `compare-shows-compare`
        *   `compare-shows-bff` (Backend-For-Frontend)
    *   For each function:
        *   Choose "Node.js" as the runtime.
        *   Set the handler to `index.handler`.
        *   Increase the memory to 256 MB.
        *   Set a timeout of 30 seconds.

4.  **Configure Environment Variables:**
    *   For the `compare-shows-bff` Lambda function, add the following environment variable:
        *   `TMDB_API_KEY`: Your TMDB API key from step 1.
        *   `TMDB_API_BASE_URL`: `https://api.themoviedb.org/3` (or leave blank to use the default)
    *   The other Lambda functions (`compare-shows-search`, `compare-shows-project`, `compare-shows-compare`) do not need any environment variables.

5.  **Deploy Lambda Functions:**
    *   Make sure you're in the `aws-deployment` directory in PowerShell.
    *   Edit the `deploy-lambda.ps1` script:
        *   Set the `$REGION` variable to your AWS region (e.g., `"us-east-1"`).
    *   Run the following command to deploy the Lambda functions:

    ```powershell
    .\deploy-lambda.ps1
    ```
    *   This script will upload each ZIP package to its corresponding Lambda function in AWS.

**Step 2: Set up the Frontend (S3 and CloudFront)**

1.  **Create an S3 Bucket:**
    *   In the AWS Console, go to S3 and create a bucket.
    *   Give it a unique name (e.g., `compare-tv-shows-frontend-yourname`).
    *   Make sure "Block all public access" is enabled.

2.  **Upload Frontend Files:**
    *   Open PowerShell and navigate to the `aws-deployment` directory in your project.
    *   Edit the `deploy-frontend.ps1` script:
        *   Set the `$S3_BUCKET` variable to the name of your S3 bucket (e.g., `"compare-tv-shows-frontend-yourname"`).
    *   Run the following command to deploy the frontend files:

    ```powershell
    .\deploy-frontend.ps1
    ```

3.  **Create a CloudFront Distribution:**
    *   In the AWS Console, go to CloudFront and create a distribution.
    *   Set the origin to your S3 bucket.
    *   Configure the distribution to redirect HTTP to HTTPS.
    *   Set the default root object to `index.html`.
    *   Create the distribution.

4.  **Update CloudFront Distribution ID:**
    *   In the AWS Console, go to CloudFront and find the distribution you just created.
    *   Copy the "Distribution ID".
    *   Edit the `deploy-frontend.ps1` script:
        *   Set the `$CLOUDFRONT_DISTRIBUTION_ID` variable to your CloudFront distribution ID .

5.  **Invalidate CloudFront Cache:**
    *   Run the following command to invalidate the CloudFront cache:

    ```powershell
    .\deploy-frontend.ps1
    ```

**Step 3: Configure API Gateway (Connect Frontend to Backend with BFF)**

1.  **Create an API Gateway:**
    *   In the AWS Console, go to API Gateway and create an API.
    *   Choose "REST API".

2.  **Create Resources and Methods:**
    *   Create a new resource named `/bff`.
    *   Create a catch-all child resource named `/{proxy+}` under `/bff`.
    *   Create an `ANY` method on the `/bff/{proxy+}` resource.
        *   Set the integration type to "Lambda Function".
        *   Select the `compare-shows-bff` Lambda function.
        *   Configure the integration request to pass the method, path, and query string parameters to the Lambda function.

3.  **Enable CORS:**
    *   CORS (Cross-Origin Resource Sharing) is a security feature that prevents web pages from making requests to a different domain than the one that served the web page. To allow your frontend to make requests to your API Gateway, you need to enable CORS.
    *   In the API Gateway console, select the `/bff` resource.
    *   Click on "Actions" and select "Enable CORS".
    *   Configure the CORS settings as follows:
        *   `Access-Control-Allow-Origin`: `*` (This allows requests from any domain. For production environments, you should restrict this to your frontend's domain.)
        *   `Access-Control-Allow-Methods`: `GET, POST, OPTIONS, ANY`
        *   `Access-Control-Allow-Headers`: `Content-Type, X-API-Key`
    *   Click "Enable CORS and generate required OPTIONS responses".

4.  **Deploy the API:**
    *   In the API Gateway console, click on "Actions" and select "Deploy API".
    *   Create a new stage called "prod".
    *   Click "Deploy".
    *   After deployment, you'll see an "Invoke URL" at the top of the page. Copy this URL as you'll need it for the frontend configuration.

5.  **Update Frontend Configuration:**
    *   Edit the `aws-deployment/frontend/js/app.js` file:
        *   Find the line that defines the API base URL:
        ```javascript
        const API_BASE_URL = 'https://ipoxasb5d5.execute-api.us-east-1.amazonaws.com/prod/bff'; // Example URL
        ```
        *   Replace it with your API Gateway URL followed by `/bff`:
        ```javascript
        const API_BASE_URL = 'YOUR_API_GATEWAY_URL/prod/bff'; // Replace with your API Gateway URL
        ```
        *   For example, if your API Gateway URL is `https://abc123def.execute-api.us-east-1.amazonaws.com/prod`, then set:
        ```javascript
        const API_BASE_URL = 'https://abc123def.execute-api.us-east-1.amazonaws.com/prod/bff';
        ```

6.  **Re-deploy Frontend:**
    *   Run the following command to re-deploy the frontend files with the updated API URL:

    ```powershell
    .\deploy-frontend.ps1
    ```

**Step 4: Deploy Everything at Once (Optional)**

If you want to deploy both the Lambda functions and the frontend in one go, you can use the `deploy-all.ps1` script:

```powershell
.\deploy-all.ps1
```

This script will run both the `deploy-lambda.ps1` and `deploy-frontend.ps1` scripts in sequence.

**Step 5: Test the Application**

1.  **Access Your Application:**
    *   Open your CloudFront distribution URL in a web browser.
    *   The URL will look something like `https://d1234abcdef.cloudfront.net`.
    *   You can find this URL in the CloudFront console under "Distributions".

2.  **Test the Application:**
    *   Search for TV shows or movies using the search bar.
    *   Select shows or movies to compare.
    *   Verify that the comparison results are displayed correctly.

**Understanding API Key Security**

This application uses a Backend-For-Frontend (BFF) pattern to securely handle the TMDB API key. Here's how it works:

1.  **What is a BFF?**
    *   BFF stands for Backend-For-Frontend. It's a pattern where a backend service is created specifically to serve a frontend application.
    *   In this case, our BFF is a Lambda function that acts as a proxy between the frontend and the TMDB API.

2.  **How the BFF Secures the API Key:**
    *   The TMDB API key is stored as an environment variable in the BFF Lambda function.
    *   When the frontend makes a request to the BFF, the BFF adds the API key to the request before forwarding it to the TMDB API.
    *   This way, the API key is never exposed in the frontend code, making it impossible for users to extract it from your website.

3.  **The Flow of a Request:**
    *   Frontend makes a request to the BFF (via API Gateway)
    *   BFF receives the request and adds the TMDB API key
    *   BFF forwards the request to the TMDB API
    *   TMDB API responds to the BFF
    *   BFF forwards the response back to the frontend

This approach is much more secure than embedding the API key directly in the frontend code, where anyone could view it by inspecting your website's source code.

**Troubleshooting Common Issues**

1.  **API Gateway CORS Errors:**
    *   If you see CORS errors in the browser console, make sure you've properly configured CORS in API Gateway.
    *   Ensure that the `Access-Control-Allow-Origin` header is set to `*` or your frontend domain.
    *   Make sure you've deployed the API after making CORS changes.

2.  **Lambda Function Errors:**
    *   If your Lambda functions are failing, check the CloudWatch Logs for error messages.
    *   In the AWS Console, go to CloudWatch > Log Groups and look for log groups named after your Lambda functions.
    *   Common issues include:
        *   Missing environment variables (like the TMDB API key)
        *   Incorrect handler name
        *   Timeout (if the function takes too long to execute)

3.  **S3 Access Denied:**
    *   If you can't access your S3 bucket through CloudFront, make sure the bucket policy allows CloudFront to access the bucket.
    *   In the S3 console, go to your bucket > Permissions > Bucket Policy and ensure it allows `s3:GetObject` for your CloudFront distribution.

4.  **CloudFront Cache Issues:**
    *   If you've updated your frontend but don't see the changes, you may need to invalidate the CloudFront cache.
    *   Run the `deploy-frontend.ps1` script again, which includes a cache invalidation step.

**Maintaining Your Application**

1.  **Updating the Frontend:**
    *   Make changes to the files in the `aws-deployment/frontend` directory.
    *   Run the `deploy-frontend.ps1` script to deploy the changes.

2.  **Updating Lambda Functions:**
    *   Make changes to the files in the `aws-deployment/lambda` directory.
    *   Run the `prepare-lambda-packages.ps1` script to create new deployment packages.
    *   Run the `deploy-lambda.ps1` script to deploy the changes.

3.  **Monitoring Costs:**
    *   The AWS Free Tier has limits on usage. Monitor your AWS billing dashboard to ensure you stay within these limits.
    *   Key limits to watch:
        *   Lambda: 1 million free requests per month, 400,000 GB-seconds of compute time per month
        *   S3: 5 GB of standard storage, 20,000 GET requests, 2,000 PUT requests
        *   CloudFront: 50 GB of data transfer out, 2,000,000 HTTP/HTTPS requests per month
        *   API Gateway: 1 million API calls per month

**Conclusion**

Congratulations! You've successfully deployed the Compare TV Shows application to AWS using the free tier. The application uses a secure Backend-For-Frontend pattern to protect your TMDB API key, ensuring that it's never exposed in the frontend code.

By following this guide, you've learned how to:
1. Set up Lambda functions for your backend
2. Configure environment variables to securely store API keys
3. Deploy a static website to S3 and CloudFront
4. Set up API Gateway to connect your frontend to your backend
5. Understand and implement the BFF pattern for API key security

If you encounter any issues or have questions, refer to the troubleshooting section or consult the AWS documentation.
