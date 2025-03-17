# Deployment Guide for TV Show & Movie Cast Comparison Tool

This guide provides detailed instructions for deploying the application to Siteground.com on the GrowBig hosting plan at compare.my.useless.blog.

## Prerequisites

Before deploying, make sure you have:

1. A TMDb API key (get one from [The Movie Database](https://www.themoviedb.org/settings/api))
2. Access to your Siteground.com account with the GrowBig hosting plan
3. Access to your domain management for useless.blog (to set up the compare.my subdomain if not already configured)

## Deployment to Siteground.com (GrowBig Plan)

### Step 1: Set Up the Subdomain

1. Log in to your Siteground.com account dashboard
2. Navigate to "Websites" > "Site Tools" for your useless.blog domain
3. In the left sidebar, go to "Domain" > "Subdomains"
4. Create a new subdomain:
   - Enter "compare.my" in the subdomain field
   - Select "useless.blog" as the domain
   - Choose the document root directory (e.g., `/public_html/compare.my`)
   - Click "Create"

### Step 2: Enable Node.js Support

The GrowBig plan on Siteground supports Node.js applications through their Site Tools:

1. In Site Tools, navigate to "Devs" > "Node.js"
2. Click "Enable Node.js"
3. Select the latest stable Node.js version (v16.x or higher)
4. Set the application path to your subdomain's document root (e.g., `/public_html/compare.my`)
5. Set the Application URL to `https://compare.my.useless.blog`
6. Set the Application Entry Point to `src/server/index.js`
7. Click "Save" to enable Node.js for your subdomain

### Step 3: Upload the Application

You have two options for uploading your application:

#### Option A: Using FTP/SFTP

1. Connect to your Siteground hosting using an FTP client (like FileZilla):
   - Host: Your Siteground FTP host (usually ftp.useless.blog)
   - Username: Your Siteground username
   - Password: Your Siteground password
   - Port: 21 (for FTP) or 22 (for SFTP)

2. Navigate to the document root directory for your subdomain (e.g., `/public_html/compare.my`)

3. Upload all project files to this directory, maintaining the directory structure

#### Option B: Using Git (if Git is available on your hosting)

1. Connect to your Siteground hosting via SSH:
   ```bash
   ssh username@useless.blog
   ```

2. Navigate to the document root directory for your subdomain:
   ```bash
   cd ~/public_html/compare.my
   ```

3. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/tv-show-movie-comparison.git .
   ```

### Step 4: Configure Environment Variables

Siteground's Node.js implementation allows you to set environment variables through their interface:

1. In Site Tools, navigate to "Devs" > "Node.js"
2. Select your application
3. Scroll down to the "Environment Variables" section
4. Add the following environment variables:
   - `TMDB_API_KEY`: Your TMDb API key
   - `TMDB_API_BASE_URL`: https://api.themoviedb.org/3
   - `NODE_ENV`: production
   - `PORT`: 3000 (or the port assigned by Siteground)
   - `PROJECT_CACHE_TTL`: 86400 (24 hours in seconds)
   - `COMPARISON_CACHE_TTL`: 43200 (12 hours in seconds)
5. Click "Save" to update the environment variables

### Step 5: Install Dependencies and Start the Application

1. Connect to your Siteground hosting via SSH:
   ```bash
   ssh username@useless.blog
   ```

2. Navigate to your application directory:
   ```bash
   cd ~/public_html/compare.my
   ```

3. Install dependencies:
   ```bash
   npm install --production
   ```

4. Start the application using the Node.js manager provided by Siteground:
   - In Site Tools, navigate to "Devs" > "Node.js"
   - Select your application
   - Click "Restart" to start or restart the application

### Step 6: Set Up SSL for Your Subdomain

Siteground provides free Let's Encrypt SSL certificates:

1. In Site Tools, navigate to "Security" > "SSL Manager"
2. Find your subdomain (compare.my.useless.blog) in the list
3. Click "Get" under the Let's Encrypt column
4. Select "Let's Encrypt Wildcard" if you want to cover all subdomains of my.useless.blog
5. Click "Get" to issue the certificate
6. Once issued, click "Install" to activate the SSL certificate

### Step 7: Configure HTTPS Redirection

To ensure all traffic uses HTTPS:

1. In Site Tools, navigate to "Security" > "HTTPS Enforce"
2. Toggle the switch to "On" for your subdomain
3. Click "Save" to apply the changes

## Maintenance

### Updating the Application

1. Connect to your Siteground hosting via SSH:
   ```bash
   ssh username@useless.blog
   ```

2. Navigate to your application directory:
   ```bash
   cd ~/public_html/compare.my
   ```

3. If using Git, pull the latest changes:
   ```bash
   git pull origin main
   ```
   
   If not using Git, upload the updated files via FTP/SFTP.

4. Install any new dependencies:
   ```bash
   npm install --production
   ```

5. Restart the application:
   - In Site Tools, navigate to "Devs" > "Node.js"
   - Select your application
   - Click "Restart" to apply the changes

### Monitoring

1. Check application logs:
   - In Site Tools, navigate to "Devs" > "Node.js"
   - Select your application
   - Click on "Logs" to view the application logs

2. Monitor resource usage:
   - In Site Tools, navigate to "Statistics" > "Resource Usage"
   - Review CPU, memory, and bandwidth usage to ensure your application is running efficiently

### Backup

Siteground's GrowBig plan includes daily backups:

1. In Site Tools, navigate to "Security" > "Backups"
2. You can restore from a previous backup if needed
3. Additionally, you can manually create backups before making significant changes

## Troubleshooting

### Common Issues

1. **Application not starting:**
   - Check the Node.js logs in Site Tools
   - Verify that all environment variables are set correctly
   - Ensure the entry point path is correct

2. **API errors:**
   - Verify that your TMDb API key is valid
   - Check if you've reached the API rate limit
   - Ensure the API endpoints haven't changed

3. **Performance issues:**
   - The GrowBig plan includes SuperCacher for improved performance
   - Enable Dynamic Caching in Site Tools > Speed > SuperCacher
   - Optimize the application's cache settings
   - Consider upgrading to a higher plan if you consistently hit resource limits

4. **Domain/Subdomain issues:**
   - Verify DNS propagation using online tools
   - Check that the subdomain is properly configured in Siteground
   - Ensure SSL is properly installed and enforced

For more help, contact Siteground support or refer to the project's GitHub repository.
