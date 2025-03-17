const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.error('Error: .env file not found. Please run "node install.js" first.');
    process.exit(1);
}

// Check if TMDB_API_KEY is set
const envContent = fs.readFileSync(envPath, 'utf8');
if (envContent.includes('TMDB_API_KEY=your_tmdb_api_key_here')) {
    console.warn('Warning: TMDB_API_KEY not set in .env file. API calls will fail.');
    console.warn('For production use, please update your .env file with a valid API key.');
    console.warn('You can get an API key from https://www.themoviedb.org/settings/api');
    console.warn('Continuing for testing purposes...');
}

console.log('Starting development server...');

// Run nodemon
const nodemon = spawn('npx', ['nodemon', 'src/server/index.js'], {
    stdio: 'inherit',
    shell: true
});

nodemon.on('error', (error) => {
    console.error('Failed to start development server:', error);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('Stopping development server...');
    nodemon.kill();
    process.exit();
});
