# Issues and Solutions Tracker

## Current Issues

### 1. Default Poster Image Requests
**Issue:** The default-poster.jpg is being requested repeatedly, slowing down the page.

**Details:** When images fail to load, the onerror handler sets the src to DEFAULT_POSTER, but if that also fails, it might create an infinite loop of requests.

### 2. Background Animation Wobbling
**Issue:** The background CSS dots still wobble even after the mouse is removed from the window.

**Details:** The dots should snap to their location instead of bouncing around it. Current physics parameters (friction and spring factor) need adjustment.

### 3. Unknown Roles for Main Characters
**Issue:** Some actors have "Unknown Role" listed when they're one of the main stars of the show.

**Details:** Mike Colter shows up as an unknown cast member on Marvel's Jessica Jones despite being a major character.

### 4. Performance and Caching Issues
**Issue:** The page is less snappy and lags. There might be excessive TMDB API requests despite caching.

**Details:** Need to verify if caching is working properly and optimize performance.

## Solutions

### 1. Default Poster Image Requests
**Solution:** Modified the image loading logic to avoid infinite loops and unnecessary requests:
- Added checks to verify if poster/profile paths exist before setting src attributes
- Removed onerror handlers after they trigger once to prevent loops
- Set default images directly when no path is available instead of relying on onerror

### 2. Background Animation Wobbling
**Solution:** Completely redesigned the background animation physics:
- Reduced friction to 0.85 for smoother movement
- Used a moderate spring factor of 0.1 for better control
- Implemented direct position interpolation when cursor leaves window
- Added snap-back logic for dots that are close to their original positions
- Made grid connections fainter (opacity 0.2) and cursor connections more visible (blue color, opacity 0.8)
- Increased line width for cursor connections to 1.5px for better visibility

### 3. Unknown Roles for Main Characters
**Solution:** Enhanced character information retrieval from TMDB API:
- Added logic to always use the most detailed character information available
- Implemented comparison between different character sources (credits, aggregate_credits, roles)
- Used the longest/most detailed character name when multiple sources are available
- Added explicit requests for cast and crew data in API calls

### 4. "Appears in X of Y" Text Alignment
**Solution:** Modified the display logic for appearance information:
- Only show "Appears in X of Y projects" text when there are more than 2 projects
- Hide the text completely when comparing exactly 2 projects (since all results appear in both)
