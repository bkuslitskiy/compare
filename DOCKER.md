# Docker Deployment Guide

This guide provides instructions for deploying the TV Show & Movie Cast Comparison Tool using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose installed on your system
- A TMDb API key

## Option 1: Using Docker Compose (Recommended)

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/tv-show-movie-comparison.git
cd tv-show-movie-comparison
```

### Step 2: Set Environment Variables

Create a `.env` file in the root directory with your TMDb API key:

```bash
echo "TMDB_API_KEY=your_tmdb_api_key_here" > .env
```

Replace `your_tmdb_api_key_here` with your actual TMDb API key.

### Step 3: Build and Start the Container

```bash
docker-compose up -d
```

This command will:
- Build the Docker image
- Start the container in detached mode
- Map port 3000 on your host to port 3000 in the container
- Set up environment variables from your `.env` file
- Configure the container to restart automatically unless explicitly stopped

### Step 4: Access the Application

Open your browser and navigate to:

```
http://localhost:3000
```

### Step 5: View Logs

```bash
docker-compose logs -f
```

### Step 6: Stop the Container

```bash
docker-compose down
```

## Option 2: Using Docker Directly

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/tv-show-movie-comparison.git
cd tv-show-movie-comparison
```

### Step 2: Build the Docker Image

```bash
docker build -t tv-show-comparison .
```

### Step 3: Run the Container

```bash
docker run -d \
  --name tv-show-comparison \
  -p 3000:3000 \
  -e TMDB_API_KEY=your_tmdb_api_key_here \
  -e NODE_ENV=production \
  -e TMDB_API_BASE_URL=https://api.themoviedb.org/3 \
  -e PROJECT_CACHE_TTL=86400 \
  -e COMPARISON_CACHE_TTL=43200 \
  --restart unless-stopped \
  tv-show-comparison
```

Replace `your_tmdb_api_key_here` with your actual TMDb API key.

### Step 4: Access the Application

Open your browser and navigate to:

```
http://localhost:3000
```

### Step 5: View Logs

```bash
docker logs -f tv-show-comparison
```

### Step 6: Stop the Container

```bash
docker stop tv-show-comparison
docker rm tv-show-comparison
```

## Deploying to a Cloud Provider

### AWS Elastic Container Service (ECS)

1. Push your Docker image to Amazon ECR:
   ```bash
   aws ecr create-repository --repository-name tv-show-comparison
   aws ecr get-login-password | docker login --username AWS --password-stdin your-aws-account-id.dkr.ecr.region.amazonaws.com
   docker tag tv-show-comparison:latest your-aws-account-id.dkr.ecr.region.amazonaws.com/tv-show-comparison:latest
   docker push your-aws-account-id.dkr.ecr.region.amazonaws.com/tv-show-comparison:latest
   ```

2. Create an ECS cluster, task definition, and service using the AWS Management Console or AWS CLI.

3. Set environment variables in the task definition.

### Google Cloud Run

1. Push your Docker image to Google Container Registry:
   ```bash
   gcloud auth configure-docker
   docker tag tv-show-comparison:latest gcr.io/your-project-id/tv-show-comparison:latest
   docker push gcr.io/your-project-id/tv-show-comparison:latest
   ```

2. Deploy to Cloud Run:
   ```bash
   gcloud run deploy tv-show-comparison \
     --image gcr.io/your-project-id/tv-show-comparison:latest \
     --platform managed \
     --set-env-vars TMDB_API_KEY=your_tmdb_api_key_here,NODE_ENV=production
   ```

### DigitalOcean App Platform

1. Push your Docker image to DigitalOcean Container Registry:
   ```bash
   doctl registry login
   docker tag tv-show-comparison:latest registry.digitalocean.com/your-registry/tv-show-comparison:latest
   docker push registry.digitalocean.com/your-registry/tv-show-comparison:latest
   ```

2. Create a new app in the DigitalOcean App Platform, selecting your container image.

3. Configure environment variables in the App Platform settings.

## Updating the Application

### Using Docker Compose

1. Pull the latest code:
   ```bash
   git pull origin main
   ```

2. Rebuild and restart the container:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

### Using Docker Directly

1. Pull the latest code:
   ```bash
   git pull origin main
   ```

2. Rebuild the image:
   ```bash
   docker build -t tv-show-comparison .
   ```

3. Stop and remove the old container:
   ```bash
   docker stop tv-show-comparison
   docker rm tv-show-comparison
   ```

4. Run a new container with the updated image:
   ```bash
   docker run -d \
     --name tv-show-comparison \
     -p 3000:3000 \
     -e TMDB_API_KEY=your_tmdb_api_key_here \
     -e NODE_ENV=production \
     -e TMDB_API_BASE_URL=https://api.themoviedb.org/3 \
     -e PROJECT_CACHE_TTL=86400 \
     -e COMPARISON_CACHE_TTL=43200 \
     --restart unless-stopped \
     tv-show-comparison
   ```

## Troubleshooting

### Container Fails to Start

1. Check the logs:
   ```bash
   docker logs tv-show-comparison
   ```

2. Verify environment variables:
   ```bash
   docker inspect tv-show-comparison | grep -A 10 "Env"
   ```

3. Check if the port is already in use:
   ```bash
   netstat -tuln | grep 3000
   ```

### API Errors

1. Verify your TMDb API key is correct.
2. Check if you've reached the API rate limit.
3. Ensure the container has internet access.

### Performance Issues

1. Increase container resources:
   ```bash
   docker run -d \
     --name tv-show-comparison \
     -p 3000:3000 \
     -e TMDB_API_KEY=your_tmdb_api_key_here \
     -e NODE_ENV=production \
     --memory=1g \
     --cpus=1 \
     tv-show-comparison
   ```

2. Adjust cache settings by modifying the `PROJECT_CACHE_TTL` and `COMPARISON_CACHE_TTL` environment variables.
