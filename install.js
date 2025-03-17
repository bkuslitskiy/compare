const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('TV Show & Movie Cast Comparison Tool - Installation Script');
console.log('--------------------------------------------------------');
console.log('This script will help you set up the application.');
console.log('');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

// Install dependencies
console.log('Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('Dependencies installed successfully.');
  console.log('');
} catch (error) {
  console.error('Error installing dependencies:', error.message);
  process.exit(1);
}

// Create .env file if it doesn't exist
if (!envExists) {
  console.log('Creating .env file...');
  
  rl.question('Enter your TMDb API key (or press Enter to skip for now): ', (apiKey) => {
    const envContent = `# TMDb API Configuration
TMDB_API_KEY=${apiKey || 'your_tmdb_api_key_here'}
TMDB_API_BASE_URL=https://api.themoviedb.org/3

# Server Configuration
PORT=3000
NODE_ENV=development

# Cache Configuration
PROJECT_CACHE_TTL=86400  # 24 hours in seconds
COMPARISON_CACHE_TTL=43200  # 12 hours in seconds
`;

    fs.writeFileSync(envPath, envContent);
    console.log('.env file created successfully.');
    
    if (!apiKey) {
      console.log('');
      console.log('NOTE: You need to add your TMDb API key to the .env file before running the application.');
      console.log('You can get an API key from https://www.themoviedb.org/settings/api');
    }
    
    console.log('');
    console.log('Installation complete!');
    console.log('');
    console.log('To start the application in development mode:');
    console.log('  npm run dev');
    console.log('');
    console.log('To start the application in production mode:');
    console.log('  npm start');
    console.log('');
    
    rl.close();
  });
} else {
  console.log('.env file already exists. Skipping creation.');
  console.log('');
  console.log('Installation complete!');
  console.log('');
  console.log('To start the application in development mode:');
  console.log('  npm run dev');
  console.log('');
  console.log('To start the application in production mode:');
  console.log('  npm start');
  console.log('');
  
  rl.close();
}
