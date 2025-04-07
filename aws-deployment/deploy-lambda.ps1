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
