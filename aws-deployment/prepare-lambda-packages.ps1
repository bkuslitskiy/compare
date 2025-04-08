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

# Package bff function
Write-Host "Creating bff function package..."
Compress-Archive -Path "bff.js", "utils.js", "node_modules" -DestinationPath "dist\bff.zip" -Force

Write-Host "Lambda packages prepared successfully!"
