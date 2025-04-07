#!/bin/bash

echo "Preparing Lambda deployment packages..."

# Navigate to the lambda directory
cd lambda

# Install dependencies
echo "Installing dependencies..."
npm install

# Create dist directory if it doesn't exist
mkdir -p dist

# Package search function
echo "Creating search function package..."
zip -r dist/search.zip search.js utils.js node_modules

# Package project function
echo "Creating project function package..."
zip -r dist/project.zip project.js utils.js node_modules

# Package compare function
echo "Creating compare function package..."
zip -r dist/compare.zip compare.js utils.js node_modules

echo "Lambda packages prepared successfully!"
