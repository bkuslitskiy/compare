# Server Management Guide

## Restarting the Server

### Option 1: Using Terminal Commands
To restart the development server, follow these steps:

1. Press `Ctrl+C` in the terminal where the server is running to stop it
2. Run the following command to start it again:
   ```bash
   npm run dev
   ```

### Option 2: Using Nodemon
If the server is running with nodemon (which is the case when using `npm run dev`), you can trigger a restart by:

1. Typing `rs` in the terminal where the server is running and pressing Enter
2. This will restart the server without stopping the process

### Option 3: File Change Trigger
Since the development server uses nodemon, any changes to server files will automatically trigger a restart. You can:

1. Make a small change to a server file (like adding/removing a comment)
2. Save the file
3. The server will automatically restart

## Checking Server Status

To check if the server is running:

1. Open a browser and navigate to `http://localhost:3000`
2. If the page loads, the server is running
3. Alternatively, check the terminal for messages like "Server running on port 3000"

## Viewing Server Logs

Server logs are displayed in the terminal where the server is running. Look for:

- Error messages (usually in red)
- API request logs
- Cache operations
- Other server activities

## Troubleshooting Common Issues

### Port Already in Use
If you see an error like `EADDRINUSE: address already in use :::3000`:

1. Find the process using port 3000:
   ```bash
   # On Windows
   netstat -ano | findstr :3000
   
   # On macOS/Linux
   lsof -i :3000
   ```

2. Kill the process:
   ```bash
   # On Windows (replace PID with the process ID from the previous command)
   taskkill /F /PID PID
   
   # On macOS/Linux
   kill -9 PID
   ```

3. Restart the server:
   ```bash
   npm run dev
   ```

### Server Crashes
If the server crashes:

1. Check the error message in the terminal
2. Fix the issue based on the error message
3. Restart the server using `npm run dev`

## Cache Management

To flush all caches and force fresh data from the TMDB API:

1. Stop the server (Ctrl+C)
2. Restart it with `npm run dev`

This will create new cache instances with no data, forcing the application to fetch fresh data from the API.
