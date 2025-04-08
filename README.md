# TV Show & Movie Cast Comparison Tool

A comprehensive web application for comparing cast and crew across multiple TV shows and movies.

> **Note:** This application is cross-platform compatible and can be run on Mac, Linux, and Windows systems. Command examples for both Unix-based systems (Mac/Linux) and Windows are provided throughout this README.

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
- Git

## Getting Started

### 1. Clone the repository

```bash
# Mac/Linux
git clone https://github.com/bkuslitskiy/compare.git
cd compare
```

```powershell
# Windows (PowerShell)
git clone https://github.com/bkuslitskiy/compare.git
Set-Location -Path compare
```

### 2. Install dependencies

```bash
# Mac/Linux
npm install
```

```powershell
# Windows (PowerShell)
npm install
```

### 3. Get a TMDb API Key

1. Create an account on [The Movie Database](https://www.themoviedb.org/)
2. Go to your account settings
3. Click on the "API" link in the left sidebar
4. Follow the instructions to request an API key for non-commercial use
5. Once approved, copy your API key

### 4. Configure environment variables

Create a `.env` file in the root directory:

```bash
# Mac/Linux
touch .env
echo "# TMDb API Configuration
TMDB_API_KEY=your_tmdb_api_key_here
TMDB_API_BASE_URL=https://api.themoviedb.org/3

# Server Configuration
PORT=3000
NODE_ENV=development

# Cache Configuration
PROJECT_CACHE_TTL=86400  # 24 hours in seconds
COMPARISON_CACHE_TTL=43200  # 12 hours in seconds" > .env
```

```powershell
# Windows (PowerShell)
New-Item -Path ".env" -ItemType "file" -Force
@"
# TMDb API Configuration
TMDB_API_KEY=your_tmdb_api_key_here
TMDB_API_BASE_URL=https://api.themoviedb.org/3

# Server Configuration
PORT=3000
NODE_ENV=development

# Cache Configuration
PROJECT_CACHE_TTL=86400  # 24 hours in seconds
COMPARISON_CACHE_TTL=43200  # 12 hours in seconds
"@ | Out-File -FilePath ".env" -Encoding utf8
```

Replace `your_tmdb_api_key_here` with your actual TMDb API key.

### 5. Start the application

For development:

```bash
# Mac/Linux
npm run dev
```

```powershell
# Windows (PowerShell)
npm run dev
```

For production:

```bash
# Mac/Linux
npm start
```

```powershell
# Windows (PowerShell)
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
   # Mac/Linux
   heroku login
   ```
   ```powershell
   # Windows (PowerShell)
   heroku login
   ```
3. Create a new Heroku app:
   ```bash
   # Mac/Linux
   heroku create your-app-name
   ```
   ```powershell
   # Windows (PowerShell)
   heroku create your-app-name
   ```
4. Set environment variables:
   ```bash
   # Mac/Linux
   heroku config:set TMDB_API_KEY=your_tmdb_api_key_here
   heroku config:set NODE_ENV=production
   ```
   ```powershell
   # Windows (PowerShell)
   heroku config:set TMDB_API_KEY=your_tmdb_api_key_here
   heroku config:set NODE_ENV=production
   ```
5. Deploy the application:
   ```bash
   # Mac/Linux
   git push heroku main
   ```
   ```powershell
   # Windows (PowerShell)
   git push heroku main
   ```

### Option 2: Deploy to Vercel

1. Install the Vercel CLI:
   ```bash
   # Mac/Linux
   npm install -g vercel
   ```
   ```powershell
   # Windows (PowerShell)
   npm install -g vercel
   ```
2. Log in to Vercel:
   ```bash
   # Mac/Linux
   vercel login
   ```
   ```powershell
   # Windows (PowerShell)
   vercel login
   ```
3. Deploy the application:
   ```bash
   # Mac/Linux
   vercel
   ```
   ```powershell
   # Windows (PowerShell)
   vercel
   ```
4. Set environment variables in the Vercel dashboard

### Option 3: Deploy to AWS

For detailed AWS deployment instructions, refer to the [AWS_deployment.md](AWS_deployment.md) file, which includes instructions for both Mac/Linux and Windows environments.

### Option 4: Deploy to a VPS or dedicated server

1. Set up a server with Node.js installed
2. Clone the repository to your server:
   ```bash
   # Mac/Linux
   git clone https://github.com/bkuslitskiy/compare.git
   cd compare
   ```
   ```powershell
   # Windows (PowerShell)
   git clone https://github.com/bkuslitskiy/compare.git
   Set-Location -Path compare
   ```
3. Install dependencies:
   ```bash
   # Mac/Linux
   npm install --production
   ```
   ```powershell
   # Windows (PowerShell)
   npm install --production
   ```
4. Set up environment variables:
   ```bash
   # Mac/Linux
   echo "TMDB_API_KEY=your_tmdb_api_key_here
   NODE_ENV=production" > .env
   ```
   ```powershell
   # Windows (PowerShell)
   @"
   TMDB_API_KEY=your_tmdb_api_key_here
   NODE_ENV=production
   "@ | Out-File -FilePath ".env" -Encoding utf8
   ```
5. Start the application:
   ```bash
   # Mac/Linux
   npm start
   ```
   ```powershell
   # Windows (PowerShell)
   npm start
   ```
6. Set up a reverse proxy (like Nginx) to forward requests to your Node.js application
7. Configure SSL with Let's Encrypt for secure connections

## Maintenance and Future Enhancements

### Regular Maintenance

- Keep dependencies updated:
  ```bash
  # Mac/Linux
  npm update
  ```
  ```powershell
  # Windows (PowerShell)
  npm update
  ```
- Check for outdated packages:
  ```bash
  # Mac/Linux
  npm outdated
  ```
  ```powershell
  # Windows (PowerShell)
  npm outdated
  ```
- Monitor API usage to stay within rate limits
- Check for TMDb API changes or updates

### Backup Your Data

```bash
# Mac/Linux
mkdir -p backups
cp .env backups/.env.$(date +%Y%m%d)
```

```powershell
# Windows (PowerShell)
New-Item -Path "backups" -ItemType Directory -Force
Copy-Item -Path ".env" -Destination "backups\.env.$(Get-Date -Format 'yyyyMMdd')"
```

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

## Troubleshooting

### Common Issues

1. **API Key Issues**:
   - Verify your TMDb API key is correct
   - Check that the `.env` file is in the correct location
   - Ensure the API key is properly formatted

2. **Port Already in Use**:
   ```bash
   # Mac/Linux
   lsof -i :3000
   kill -9 <PID>
   ```
   ```powershell
   # Windows (PowerShell)
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

3. **Node.js Version Issues**:
   ```bash
   # Mac/Linux
   node -v
   nvm install 14  # If using nvm
   ```
   ```powershell
   # Windows (PowerShell)
   node -v
   # Install the required version from nodejs.org
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [The Movie Database (TMDb)](https://www.themoviedb.org/) for providing the API
- All the open-source libraries used in this project
