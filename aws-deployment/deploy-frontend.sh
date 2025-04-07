#!/bin/bash

# Replace these with your actual values
S3_BUCKET="https://compare-tv-shows-frontend.s3-website-us-east-1.amazonaws.com"
CLOUDFRONT_DISTRIBUTION_ID="E2AXJVY25B1RRI"

# Sync frontend files to S3
echo "Uploading frontend files to S3..."
aws s3 sync frontend/ s3://$S3_BUCKET/ --delete

# Invalidate CloudFront cache
echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
  --paths "/*"

echo "Frontend deployment complete!"
