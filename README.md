# TV Show & Movie Cast Comparison Tool

A comprehensive web application for comparing cast and crew across multiple TV shows and movies.

## Features

- **Dynamic Input Form**: Enter 2 or more project names or IMDB IDs
- **Auto-Suggestions**: Get real-time suggestions as you type
- **Project Confirmation**: Select the correct project when multiple matches are found
- **Comprehensive Results**: View all cast and crew members who appear in multiple projects
- **Filtering and Sorting**: Filter by role type, sort by name, appearances, or role
- **Responsive Design**: Works on desktop and mobile devices
- **Multi-level Caching**: Efficient data storage and retrieval

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- TMDb API Key (see below)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/tv-show-movie-comparison.git
cd tv-show-movie-comparison
```

### 2. Install dependencies

```bash
npm install
```

### 3. Get a TMDb API Key

1. Create an account on [The Movie Database](https://www.themoviedb.org/)
2. Go to your account settings
3. Click on the "API" link in the left sidebar
4. Follow the instructions to request an API key for non-commercial use
5. Once approved, copy your API key

### 4. Configure environment variables

Create a `.env` file in the root directory with the following content:

```
# TMDb API Configuration
TMDB_API_KEY=your_tmdb_api_key_here
TMDB_API_BASE_URL=https://api.themoviedb.org/3

# Server Configuration
PORT=3000
NODE_ENV=development

# Cache Configuration
PROJECT_CACHE_TTL=86400  # 24 hours in seconds
COMPARISON_CACHE_TTL=43200  # 12 hours in seconds
```

Replace `your_tmdb_api_key_here` with your actual TMDb API key.

### 5. Start the application

For development:

```bash
npm run dev
```

For production:

```bash
npm start
```

### 6. Access the application

Open your browser and navigate to:

```
http://localhost:3000
```

## Deployment Options

### Option 1: Deploy to Heroku

1. Create a Heroku account and install the Heroku CLI
2. Log in to Heroku:
   ```bash
   heroku login
   ```
3. Create a new Heroku app:
   ```bash
   heroku create your-app-name
   ```
4. Set environment variables:
   ```bash
   heroku config:set TMDB_API_KEY=your_tmdb_api_key_here
   heroku config:set NODE_ENV=production
   ```
5. Deploy the application:
   ```bash
   git push heroku main
   ```

### Option 2: Deploy to Vercel

1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. Log in to Vercel:
   ```bash
   vercel login
   ```
3. Deploy the application:
   ```bash
   vercel
   ```
4. Set environment variables in the Vercel dashboard

### Option 3: Deploy to a VPS or dedicated server

1. Set up a server with Node.js installed
2. Clone the repository to your server
3. Install dependencies:
   ```bash
   npm install --production
   ```
4. Set up environment variables
5. Start the application:
   ```bash
   npm start
   ```
6. Set up a reverse proxy (like Nginx) to forward requests to your Node.js application
7. Configure SSL with Let's Encrypt for secure connections

## Maintenance and Future Enhancements

### Regular Maintenance

- Keep dependencies updated:
  ```bash
  npm update
  ```
- Monitor API usage to stay within rate limits
- Check for TMDb API changes or updates

### Potential Enhancements

- User accounts and saved comparisons
- More detailed person information
- Timeline visualization of collaborations
- Export results to CSV or PDF
- Integration with other movie/TV databases
- Advanced filtering options
- Performance optimizations for very large casts

## Security Considerations

- The API key is stored in environment variables, not in the code
- Input validation is implemented to prevent injection attacks
- Rate limiting is implemented to prevent abuse
- Error handling is designed to not expose sensitive information

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [The Movie Database (TMDb)](https://www.themoviedb.org/) for providing the API
- All the open-source libraries used in this project
