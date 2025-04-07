#!/bin/bash

echo "Starting deployment..."

# Deploy Lambda functions
./deploy-lambda.sh

# Deploy frontend
./deploy-frontend.sh

echo "Deployment complete!"
