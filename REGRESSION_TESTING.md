# Regression Testing Guide

This document outlines the steps to test all aspects of the application after making changes, to ensure no regressions are introduced.

## Setup for Testing

1. Ensure the server is running:
   ```bash
   npm run dev
   ```
2. Open the application in a browser at `http://localhost:3000`

## Test Cases

### 1. Basic Functionality

#### 1.1 Search and Suggestions
- [ ] Enter a partial TV show or movie name (e.g., "break")
- [ ] Verify suggestions appear with correct images
- [ ] Verify selecting a suggestion populates the input field
- [ ] Test keyboard navigation (arrow keys, enter) in suggestions

#### 1.2 Adding Projects
- [ ] Click "Add Another Project" button
- [ ] Verify a new input field appears
- [ ] Add at least 3 projects to compare

#### 1.3 Project Confirmation
- [ ] Submit the form with ambiguous project names
- [ ] Verify the confirmation screen shows multiple options
- [ ] Select different options and confirm selections

#### 1.4 Comparison Results
- [ ] Verify the results page loads with cast/crew that appear in multiple projects
- [ ] Test filtering by role (All Roles, Cast Only, Crew Only)
- [ ] Test sorting (Name, Number of Appearances, Role)
- [ ] Test minimum appearances filter
- [ ] Verify expanding person cards works by clicking anywhere on the header
- [ ] Verify character names and roles are displayed correctly

### 2. Image Loading

#### 2.1 Default Images
- [ ] Test with projects/people known to have missing images
- [ ] Verify default-poster.jpg loads correctly without repeated requests
- [ ] Verify default-profile.jpg loads correctly without repeated requests

### 3. Performance

#### 3.1 Caching
- [ ] Make the same search twice
- [ ] Check server logs to verify the second request uses cached data
- [ ] Verify API requests are not made repeatedly for the same data

#### 3.2 Page Responsiveness
- [ ] Verify the page remains responsive during searches
- [ ] Verify the background animation doesn't cause lag
- [ ] Test with larger result sets (5+ projects)

### 4. Background Animation

#### 4.1 Interaction
- [ ] Move cursor around the page and verify dots react appropriately
- [ ] Move cursor off the page and verify dots return to their original positions without wobbling
- [ ] Verify the animation doesn't cause performance issues

### 5. Error Handling

#### 5.1 Invalid Inputs
- [ ] Try to submit with fewer than 2 projects
- [ ] Enter invalid IMDb IDs
- [ ] Test with non-existent show/movie names

#### 5.2 API Errors
- [ ] Temporarily modify the API key to be invalid
- [ ] Verify appropriate error messages are shown

## Regression Test Checklist

For each issue fixed, complete the following checklist:

### Issue: [Issue Name]
- [ ] Fix implemented
- [ ] Basic functionality still works
- [ ] No new console errors
- [ ] Performance is acceptable
- [ ] Server logs show expected behavior
- [ ] Mobile responsiveness maintained
- [ ] All test cases related to the issue pass

## Reporting Results

Document the results of your testing:

1. Which test cases passed/failed
2. Any unexpected behavior
3. Performance observations
4. Browser compatibility issues
5. Mobile responsiveness issues

## Browser Compatibility

Test on multiple browsers if possible:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
