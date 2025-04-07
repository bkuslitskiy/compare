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

# Deploy bff function
echo "Deploying bff function..."
aws lambda update-function-code \
  --function-name compare-shows-bff \
  --zip-file fileb://lambda/dist/bff.zip \
  --region $REGION

echo "Lambda deployment complete!"
