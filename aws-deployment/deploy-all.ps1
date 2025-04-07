# PowerShell script to deploy all components

Write-Host "Starting deployment..."

# Deploy Lambda functions
Write-Host "Running Lambda deployment..."
& .\deploy-lambda.ps1

# Deploy frontend
Write-Host "Running frontend deployment..."
& .\deploy-frontend.ps1

Write-Host "Deployment complete!"
