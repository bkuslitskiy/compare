// Constants
const API_BASE_URL = '/api';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';
const POSTER_SIZE = 'w500';
const PROFILE_SIZE = 'w185';
const THUMBNAIL_SIZE = 'w92';
const DEFAULT_POSTER = '/img/default-poster.jpg';
const DEFAULT_PROFILE = '/img/default-profile.jpg';

// DOM Elements
const comparisonForm = document.getElementById('comparison-form');
const projectInputsContainer = document.getElementById('project-inputs');
const addProjectBtn = document.getElementById('add-project-btn');
const compareBtn = document.getElementById('compare-btn');
const searchSection = document.getElementById('search-section');
const confirmationSection = document.getElementById('confirmation-section');
const confirmationProjects = document.getElementById('confirmation-projects');
const backBtn = document.getElementById('back-btn');
const confirmSelectionsBtn = document.getElementById('confirm-selections-btn');
const resultsSection = document.getElementById('results-section');
const projectsSummary = document.getElementById('projects-summary');
const comparisonResults = document.getElementById('comparison-results');
const newComparisonBtn = document.getElementById('new-comparison-btn');
const roleFilter = document.getElementById('role-filter');
const roleTypeFilter = document.getElementById('role-type-filter');
const sortBy = document.getElementById('sort-by');
const minAppearances = document.getElementById('min-appearances');
const lightThemeToggle = document.getElementById('light-theme');
const systemThemeToggle = document.getElementById('system-theme');
const darkThemeToggle = document.getElementById('dark-theme');

// Templates
const projectCardTemplate = document.getElementById('project-card-template');
const personCardTemplate = document.getElementById('person-card-template');

// State
let projectsToConfirm = [];
let selectedProjects = [];
let comparisonData = null;
let debounceTimeout = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the form with two project inputs
    setupEventListeners();
    
    // Initialize theme
    initializeTheme();
});

function setupEventListeners() {
    // Add project button
    addProjectBtn.addEventListener('click', addProjectInput);
    
    // Form submission
    comparisonForm.addEventListener('submit', handleFormSubmit);
    
    // Back button in confirmation section
    backBtn.addEventListener('click', () => {
        confirmationSection.classList.add('hidden');
        searchSection.classList.remove('hidden');
    });
    
    // Confirm selections button
    confirmSelectionsBtn.addEventListener('click', handleConfirmSelections);
    
    // New comparison button
    newComparisonBtn.addEventListener('click', resetApplication);
    
    // Filter and sort controls
    roleFilter.addEventListener('change', filterAndSortResults);
    roleTypeFilter.addEventListener('change', filterAndSortResults);
    sortBy.addEventListener('change', filterAndSortResults);
    minAppearances.addEventListener('change', filterAndSortResults);
    
    // Theme toggle
    lightThemeToggle.addEventListener('change', () => setTheme('light'));
    systemThemeToggle.addEventListener('change', () => setTheme('system'));
    darkThemeToggle.addEventListener('change', () => setTheme('dark'));
    
    // Setup input event listeners for existing project inputs
    document.querySelectorAll('.project-name').forEach(input => {
        setupProjectInputListeners(input);
    });
}

// Theme functions
function initializeTheme() {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'system';
    
    // Set the appropriate radio button
    if (savedTheme === 'light') {
        lightThemeToggle.checked = true;
    } else if (savedTheme === 'dark') {
        darkThemeToggle.checked = true;
    } else {
        systemThemeToggle.checked = true;
    }
    
    // Apply the theme
    setTheme(savedTheme);
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (localStorage.getItem('theme') === 'system') {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });
}

function setTheme(theme) {
    // Save theme preference
    localStorage.setItem('theme', theme);
    
    // Apply theme
    if (theme === 'system') {
        // Check system preference
        const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(isDarkMode ? 'dark' : 'light');
    } else {
        applyTheme(theme);
    }
}

function applyTheme(theme) {
    // Remove existing theme classes
    document.body.classList.remove('light-theme', 'dark-theme');
    
    // Add appropriate theme class
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else if (theme === 'light') {
        document.body.classList.add('light-theme');
    }
    
    // Dispatch an event for the background.js to listen to
    document.dispatchEvent(new CustomEvent('themeChange', { detail: { theme } }));
}

function setupProjectInputListeners(inputElement) {
    const suggestionsDropdown = inputElement.nextElementSibling;
    let selectedIndex = -1;
    
    // Input event for auto-suggestions
    inputElement.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        // Clear previous timeout
        if (debounceTimeout) {
            clearTimeout(debounceTimeout);
        }
        
        // Reset selected index
        selectedIndex = -1;
        
        // Hide dropdown if input is empty
        if (query.length === 0) {
            suggestionsDropdown.classList.remove('active');
            suggestionsDropdown.innerHTML = '';
            return;
        }
        
        // Debounce API calls
        debounceTimeout = setTimeout(() => {
            fetchSuggestions(query, suggestionsDropdown);
        }, 300);
    });
    
    // Focus event to show dropdown if there are suggestions
    inputElement.addEventListener('focus', () => {
        if (suggestionsDropdown.children.length > 0) {
            suggestionsDropdown.classList.add('active');
        }
    });
    
    // Blur event to hide dropdown (with delay to allow for clicks)
    inputElement.addEventListener('blur', () => {
        setTimeout(() => {
            suggestionsDropdown.classList.remove('active');
        }, 200);
    });
    
    // Keyboard navigation for suggestions
    inputElement.addEventListener('keydown', (e) => {
        // Only handle keyboard navigation if dropdown is active
        if (!suggestionsDropdown.classList.contains('active')) {
            return;
        }
        
        const suggestions = suggestionsDropdown.querySelectorAll('.suggestion-item');
        
        // Down arrow
        if (e.key === 'ArrowDown') {
            e.preventDefault(); // Prevent cursor from moving
            selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
            updateSelectedSuggestion(suggestions, selectedIndex);
        }
        
        // Up arrow
        else if (e.key === 'ArrowUp') {
            e.preventDefault(); // Prevent cursor from moving
            selectedIndex = Math.max(selectedIndex - 1, -1);
            updateSelectedSuggestion(suggestions, selectedIndex);
        }
        
        // Enter key
        else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault(); // Prevent form submission
            suggestions[selectedIndex].click();
        }
        
        // Escape key
        else if (e.key === 'Escape') {
            suggestionsDropdown.classList.remove('active');
        }
    });
}

// Helper function to update the selected suggestion
function updateSelectedSuggestion(suggestions, selectedIndex) {
    // Remove selected class from all suggestions
    suggestions.forEach(item => {
        item.classList.remove('selected');
    });
    
    // Add selected class to the current suggestion
    if (selectedIndex >= 0) {
        suggestions[selectedIndex].classList.add('selected');
        suggestions[selectedIndex].scrollIntoView({ block: 'nearest' });
    }
}

// Functions
function addProjectInput() {
    const projectInput = document.createElement('div');
    projectInput.className = 'project-input';
    
    // Add a remove button if there are already 2 or more inputs
    const projectInputs = document.querySelectorAll('.project-input');
    const includeRemoveButton = projectInputs.length >= 2;
    
    projectInput.innerHTML = `
        <div class="input-wrapper">
            <input type="text" class="project-name" placeholder="Enter TV show or movie name" required>
            <div class="suggestions-dropdown"></div>
        </div>
        ${includeRemoveButton ? '<button type="button" class="remove-project-btn" title="Remove this project"><i class="fas fa-times"></i></button>' : ''}
    `;
    
    projectInputsContainer.appendChild(projectInput);
    
    // Setup event listeners for the new input
    const inputElement = projectInput.querySelector('.project-name');
    setupProjectInputListeners(inputElement);
    
    // Setup remove button event listener if it exists
    const removeButton = projectInput.querySelector('.remove-project-btn');
    if (removeButton) {
        removeButton.addEventListener('click', function() {
            // Only allow removal if there are more than 2 inputs
            const currentInputs = document.querySelectorAll('.project-input');
            if (currentInputs.length > 2) {
                projectInput.remove();
            } else {
                alert('You need at least 2 projects to compare');
            }
        });
        
        // Style the remove button
        removeButton.style.backgroundColor = 'var(--error-color)';
        removeButton.style.padding = '8px';
        removeButton.style.marginLeft = '10px';
    }
    
    // Focus the new input
    inputElement.focus();
}

async function fetchSuggestions(query, dropdownElement) {
    try {
        // Check if it's an IMDb ID
        const isImdbId = /^tt\d+$/i.test(query);
        
        let endpoint = isImdbId 
            ? `${API_BASE_URL}/search/imdb/${query}`
            : `${API_BASE_URL}/search/multi?query=${encodeURIComponent(query)}`;
        
        const response = await fetch(endpoint);
        
        if (!response.ok) {
            throw new Error('Failed to fetch suggestions');
        }
        
        const data = await response.json();
        
        // Clear previous suggestions
        dropdownElement.innerHTML = '';
        
        // If no results
        if (data.results.length === 0) {
            dropdownElement.innerHTML = '<div class="suggestion-item">No results found</div>';
            dropdownElement.classList.add('active');
            return;
        }
        
        // Display suggestions (show up to 10 results)
        data.results.slice(0, 10).forEach(item => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            
            // Check if poster path exists before setting src to avoid unnecessary requests
            let posterSrc = DEFAULT_POSTER;
            if (item.poster_path) {
                posterSrc = `${TMDB_IMAGE_BASE_URL}${THUMBNAIL_SIZE}${item.poster_path}`;
            }
            
            const year = item.release_date 
                ? new Date(item.release_date).getFullYear()
                : item.first_air_date 
                    ? new Date(item.first_air_date).getFullYear()
                    : '';
            
            const mediaType = item.media_type === 'movie' ? 'Movie' : 'TV Show';
            
            suggestionItem.innerHTML = `
                <img src="${posterSrc}" alt="${item.title || item.name}">
                <div class="suggestion-details">
                    <div class="suggestion-title">${item.title || item.name}</div>
                    <div class="suggestion-year">${year} • ${mediaType}</div>
                </div>
            `;
            
            // Add click event to select this suggestion
            suggestionItem.addEventListener('click', () => {
                const inputElement = dropdownElement.previousElementSibling;
                inputElement.value = item.title || item.name;
                inputElement.dataset.tmdbId = item.id;
                inputElement.dataset.mediaType = item.media_type;
                dropdownElement.classList.remove('active');
            });
            
            dropdownElement.appendChild(suggestionItem);
        });
        
        // Show dropdown
        dropdownElement.classList.add('active');
        
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        dropdownElement.innerHTML = '<div class="suggestion-item">Error fetching suggestions</div>';
        dropdownElement.classList.add('active');
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Get all project inputs
    const projectInputs = document.querySelectorAll('.project-name');
    
    // Validate that we have at least 2 projects
    if (projectInputs.length < 2) {
        alert('Please enter at least 2 projects to compare');
        return;
    }
    
    // Collect project queries
    const projectQueries = [];
    
    projectInputs.forEach(input => {
        const query = input.value.trim();
        
        if (query) {
            // If we have a TMDB ID from the suggestions
            if (input.dataset.tmdbId) {
                projectQueries.push({
                    id: input.dataset.tmdbId,
                    mediaType: input.dataset.mediaType,
                    query: query
                });
            } else {
                // Otherwise use the text query
                projectQueries.push({
                    query: query
                });
            }
        }
    });
    
    // Validate that we have at least 2 valid queries
    if (projectQueries.length < 2) {
        alert('Please enter at least 2 valid projects to compare');
        return;
    }
    
    // Show loading state
    compareBtn.disabled = true;
    compareBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
    
    try {
        // Search for projects
        const projectsToConfirm = await searchProjects(projectQueries);
        
        // If all projects have exactly one match, skip confirmation
        if (projectsToConfirm.every(project => project.results.length === 1)) {
            // Select the first result for each project
            selectedProjects = projectsToConfirm.map(project => project.results[0]);
            
            // Fetch comparison data
            await fetchComparisonData();
        } else {
            // Show confirmation section
            displayProjectConfirmation(projectsToConfirm);
        }
    } catch (error) {
        console.error('Error searching projects:', error);
        alert('An error occurred while searching for projects. Please try again.');
    } finally {
        // Reset button state
        compareBtn.disabled = false;
        compareBtn.innerHTML = '<i class="fas fa-search"></i> Compare';
    }
}

async function searchProjects(projectQueries) {
    const searchPromises = projectQueries.map(async (projectQuery) => {
        try {
            let endpoint;
            
            // If we have a TMDB ID
            if (projectQuery.id) {
                endpoint = `${API_BASE_URL}/project/${projectQuery.mediaType}/${projectQuery.id}`;
                const response = await fetch(endpoint);
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch project with ID ${projectQuery.id}`);
                }
                
                const project = await response.json();
                
                // Return a single result
                return {
                    query: projectQuery.query,
                    results: [project]
                };
            } else {
                // Search by query
                endpoint = `${API_BASE_URL}/search/multi?query=${encodeURIComponent(projectQuery.query)}`;
                const response = await fetch(endpoint);
                
                if (!response.ok) {
                    throw new Error(`Failed to search for "${projectQuery.query}"`);
                }
                
                const data = await response.json();
                
                // Filter to only movies and TV shows
                const filteredResults = data.results.filter(
                    item => item.media_type === 'movie' || item.media_type === 'tv'
                );
                
                return {
                    query: projectQuery.query,
                    results: filteredResults
                };
            }
        } catch (error) {
            console.error(`Error searching for "${projectQuery.query}":`, error);
            return {
                query: projectQuery.query,
                results: [],
                error: error.message
            };
        }
    });
    
    return Promise.all(searchPromises);
}

function displayProjectConfirmation(projects) {
    // Store projects for later use
    projectsToConfirm = projects;
    
    // Clear previous confirmation projects
    confirmationProjects.innerHTML = '';
    
    // Create project cards for each project's results
    projects.forEach((project, projectIndex) => {
        // Create a heading for this query
        const queryHeading = document.createElement('h3');
        queryHeading.textContent = `Results for "${project.query}"`;
        queryHeading.style.gridColumn = '1 / -1';
        queryHeading.style.marginTop = projectIndex > 0 ? '20px' : '0';
        confirmationProjects.appendChild(queryHeading);
        
        // If there's an error
        if (project.error) {
            const errorMessage = document.createElement('p');
            errorMessage.textContent = `Error: ${project.error}`;
            errorMessage.style.gridColumn = '1 / -1';
            errorMessage.style.color = 'var(--error-color)';
            confirmationProjects.appendChild(errorMessage);
            return;
        }
        
        // If no results
        if (project.results.length === 0) {
            const noResults = document.createElement('p');
            noResults.textContent = 'No results found. Please try a different search term.';
            noResults.style.gridColumn = '1 / -1';
            confirmationProjects.appendChild(noResults);
            return;
        }
        
        // Create cards for each result
        project.results.forEach((result, resultIndex) => {
            const projectCard = document.importNode(projectCardTemplate.content, true);
            
            // Set poster image
            const posterImg = projectCard.querySelector('.project-poster');
            // Check if poster path exists before setting src to avoid unnecessary requests
            if (result.poster_path) {
                posterImg.src = `${TMDB_IMAGE_BASE_URL}${POSTER_SIZE}${result.poster_path}`;
                // Only set onerror if we're trying to load a real image
                posterImg.onerror = () => { 
                    posterImg.src = DEFAULT_POSTER; 
                    // Remove the handler after triggering once to prevent loops
                    posterImg.onerror = null;
                };
            } else {
                // Set default poster directly if no poster path
                posterImg.src = DEFAULT_POSTER;
            }
            posterImg.alt = result.title || result.name;
            
            // Set project details
            projectCard.querySelector('.project-title').textContent = result.title || result.name;
            
            const year = result.release_date 
                ? new Date(result.release_date).getFullYear()
                : result.first_air_date 
                    ? new Date(result.first_air_date).getFullYear()
                    : 'Unknown Year';
            
            projectCard.querySelector('.project-year').textContent = year;
            projectCard.querySelector('.project-type').textContent = 
                result.media_type === 'movie' ? 'Movie' : 'TV Show';
            
            // Set radio button
            const radioInput = projectCard.querySelector('input[type="radio"]');
            radioInput.name = `project-${projectIndex}`;
            radioInput.value = resultIndex;
            radioInput.id = `project-${projectIndex}-result-${resultIndex}`;
            radioInput.checked = resultIndex === 0; // Select first result by default
            
            const radioLabel = projectCard.querySelector('label');
            radioLabel.htmlFor = `project-${projectIndex}-result-${resultIndex}`;
            
            confirmationProjects.appendChild(projectCard);
        });
    });
    
    // Hide search section and show confirmation section
    searchSection.classList.add('hidden');
    confirmationSection.classList.remove('hidden');
}

function handleConfirmSelections() {
    // Get selected projects
    selectedProjects = [];
    
    projectsToConfirm.forEach((project, projectIndex) => {
        const selectedRadio = document.querySelector(`input[name="project-${projectIndex}"]:checked`);
        
        if (selectedRadio && project.results.length > 0) {
            const resultIndex = parseInt(selectedRadio.value);
            selectedProjects.push(project.results[resultIndex]);
        }
    });
    
    // Validate that we have at least 2 selected projects
    if (selectedProjects.length < 2) {
        alert('Please select at least 2 projects to compare');
        return;
    }
    
    // Fetch comparison data
    fetchComparisonData();
}

async function fetchComparisonData() {
    try {
        // Show loading state
        confirmSelectionsBtn.disabled = true;
        confirmSelectionsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        
        // Prepare project IDs for API call
        const projectIds = selectedProjects.map(project => ({
            id: project.id,
            media_type: project.media_type
        }));
        
        // Call API to get comparison data
        const response = await fetch(`${API_BASE_URL}/compare`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ projects: projectIds })
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch comparison data');
        }
        
        comparisonData = await response.json();
        
        // Display results
        displayComparisonResults();
        
    } catch (error) {
        console.error('Error fetching comparison data:', error);
        alert('An error occurred while fetching comparison data. Please try again.');
    } finally {
        // Reset button state
        if (confirmSelectionsBtn) {
            confirmSelectionsBtn.disabled = false;
            confirmSelectionsBtn.innerHTML = '<i class="fas fa-check"></i> Confirm Selections';
        }
    }
}

function displayComparisonResults() {
    // Hide confirmation section and show results section
    confirmationSection.classList.add('hidden');
    resultsSection.classList.remove('hidden');
    
    // Display projects summary
    displayProjectsSummary();
    
    // Filter and sort results
    filterAndSortResults();
}

function displayProjectsSummary() {
    projectsSummary.innerHTML = '';
    
    selectedProjects.forEach(project => {
        const projectPill = document.createElement('div');
        projectPill.className = 'project-pill';
        
        // Check if poster path exists before setting src to avoid unnecessary requests
        let posterSrc = DEFAULT_POSTER;
        if (project.poster_path) {
            posterSrc = `${TMDB_IMAGE_BASE_URL}${THUMBNAIL_SIZE}${project.poster_path}`;
        }
        
        projectPill.innerHTML = `
            <img src="${posterSrc}" alt="${project.title || project.name}">
            <span>${project.title || project.name}</span>
        `;
        
        projectsSummary.appendChild(projectPill);
    });
}

// Helper function to determine role type from job or department
function getRoleType(job, department) {
    job = (job || '').toLowerCase();
    department = (department || '').toLowerCase();
    
    if (department === 'acting' || job === 'actor' || job === 'actress') {
        return 'actor';
    } else if (job === 'director' || job === 'co-director') {
        return 'director';
    } else if (job === 'writer' || job === 'screenplay' || department === 'writing') {
        return 'writer';
    } else if (job.includes('producer') || department === 'production') {
        return 'producer';
    } else if (job.includes('stunt') || department === 'stunts') {
        return 'stunts';
    } else if (department === 'sound' || job.includes('sound') || job.includes('composer') || job.includes('music')) {
        return 'music';
    } else if (department === 'camera' || job.includes('camera') || job.includes('cinematograph')) {
        return 'camera';
    } else if (department === 'art' || job.includes('design') || job.includes('art')) {
        return 'art';
    } else if (department === 'editing' || job.includes('editor')) {
        return 'editing';
    } else if (department === 'sound' || job.includes('sound')) {
        return 'sound';
    } else if (department === 'visual effects' || job.includes('vfx') || job.includes('visual effect')) {
        return 'vfx';
    } else if (department === 'production design' || job.includes('production design') || 
               job.includes('set design') || job.includes('lighting') || 
               job.includes('set decoration') || job.includes('costume design')) {
        return 'production-design';
    }
    
    return 'other';
}

// Calculate role importance score for sorting
function calculateRoleImportance(person) {
    // Count unique projects this person appears in
    const uniqueProjectIds = new Set();
    
    // Add all project IDs from cast appearances
    person.cast_appearances.forEach(appearance => {
        uniqueProjectIds.add(`${appearance.media_type}-${appearance.project_id}`);
    });
    
    // Add all project IDs from crew appearances
    person.crew_appearances.forEach(appearance => {
        uniqueProjectIds.add(`${appearance.media_type}-${appearance.project_id}`);
    });
    
    const uniqueProjectCount = uniqueProjectIds.size;
    
    // Role importance weights (higher = more important)
    const roleWeights = {
        director: 100,
        mainCast: 90,
        executiveProducer: 80,
        writer: 75,
        departmentLead: 70,
        producer: 65,
        supportingCast: 60,
        otherCrew: 50
    };
    
    // Initialize with lowest importance
    let highestRoleImportance = roleWeights.otherCrew;
    
    // Check for director roles
    const hasDirectorRole = person.crew_appearances.some(appearance => {
        const job = (appearance.job || '').toLowerCase();
        return job === 'director' || job === 'co-director';
    });
    
    if (hasDirectorRole) {
        highestRoleImportance = Math.max(highestRoleImportance, roleWeights.director);
    }
    
    // Check for main cast (top billing)
    const hasMainCastRole = person.cast_appearances.some(appearance => {
        // Check for lead roles (order 0-2)
        if (appearance.order !== undefined && appearance.order < 3) {
            return true;
        }
        
        // Check if character name suggests a main character
        const character = (appearance.character || '').toLowerCase();
        return character.includes('main') || 
               character.includes('lead') || 
               character.includes('protagonist') ||
               character.includes('star');
    });
    
    if (hasMainCastRole) {
        highestRoleImportance = Math.max(highestRoleImportance, roleWeights.mainCast);
    }
    
    // Check for executive producer
    const hasExecutiveProducerRole = person.crew_appearances.some(appearance => {
        const job = (appearance.job || '').toLowerCase();
        return job.includes('executive producer');
    });
    
    if (hasExecutiveProducerRole) {
        highestRoleImportance = Math.max(highestRoleImportance, roleWeights.executiveProducer);
    }
    
    // Check for writer/screenwriter
    const hasWriterRole = person.crew_appearances.some(appearance => {
        const job = (appearance.job || '').toLowerCase();
        const department = (appearance.department || '').toLowerCase();
        return job === 'writer' || job === 'screenplay' || department === 'writing';
    });
    
    if (hasWriterRole) {
        highestRoleImportance = Math.max(highestRoleImportance, roleWeights.writer);
    }
    
    // Check for department leads
    const hasDepartmentLeadRole = person.crew_appearances.some(appearance => {
        const job = (appearance.job || '').toLowerCase();
        return job.includes('supervisor') || 
               job.includes('head') || 
               job.includes('lead') || 
               job.includes('chief') ||
               job.includes('director of');
    });
    
    if (hasDepartmentLeadRole) {
        highestRoleImportance = Math.max(highestRoleImportance, roleWeights.departmentLead);
    }
    
    // Check for producer
    const hasProducerRole = person.crew_appearances.some(appearance => {
        const job = (appearance.job || '').toLowerCase();
        const department = (appearance.department || '').toLowerCase();
        return job.includes('producer') || department === 'production';
    });
    
    if (hasProducerRole && !hasExecutiveProducerRole) {
        highestRoleImportance = Math.max(highestRoleImportance, roleWeights.producer);
    }
    
    // Check for supporting cast
    const hasSupportingCastRole = person.cast_appearances.length > 0 && !hasMainCastRole;
    
    if (hasSupportingCastRole) {
        highestRoleImportance = Math.max(highestRoleImportance, roleWeights.supportingCast);
    }
    
    // Factor in the number of projects (more projects = higher priority)
    // This is a secondary factor after role importance
    const projectBonus = uniqueProjectCount * 0.1; // Small bonus per project
    
    // Return final score (higher = more important)
    return highestRoleImportance + projectBonus;
}

// Get all unique role types for a person
function getPersonRoleTypes(person) {
    const roleTypes = new Set();
    
    // Add cast role type
    if (person.cast_appearances.length > 0) {
        roleTypes.add('actor');
    }
    
    // Add crew role types
    person.crew_appearances.forEach(appearance => {
        const roleType = getRoleType(appearance.job, appearance.department);
        roleTypes.add(roleType);
    });
    
    return Array.from(roleTypes);
}

function filterAndSortResults() {
    // Get filter values
    const roleFilterValue = roleFilter.value;
    const roleTypeFilterValue = roleTypeFilter.value;
    const sortByValue = sortBy.value;
    const minAppearancesValue = minAppearances.value;
    
    // Clear previous results
    comparisonResults.innerHTML = '';
    
    // Show loading spinner
    comparisonResults.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Processing results...</p>
        </div>
    `;
    
    // Use setTimeout to allow the UI to update before processing
    setTimeout(() => {
        // Filter people based on criteria
        let filteredPeople = comparisonData.people.filter(person => {
            // Filter by role
            if (roleFilterValue === 'cast' && !person.cast_appearances.length) {
                return false;
            }
            if (roleFilterValue === 'crew' && !person.crew_appearances.length) {
                return false;
            }
            
            // Filter by role type
            if (roleTypeFilterValue !== 'all') {
                // Get all role types for this person
                const personRoleTypes = getPersonRoleTypes(person);
                
                // Check if the person has the selected role type
                if (!personRoleTypes.includes(roleTypeFilterValue)) {
                    return false;
                }
            }
            
            // Filter by minimum appearances in unique projects
            // Count unique projects this person appears in
            const uniqueProjectIds = new Set();
            
            // Add all project IDs from cast appearances
            person.cast_appearances.forEach(appearance => {
                uniqueProjectIds.add(`${appearance.media_type}-${appearance.project_id}`);
            });
            
            // Add all project IDs from crew appearances
            person.crew_appearances.forEach(appearance => {
                uniqueProjectIds.add(`${appearance.media_type}-${appearance.project_id}`);
            });
            
            const uniqueProjectCount = uniqueProjectIds.size;
            
            if (minAppearancesValue === 'all') {
                return uniqueProjectCount === selectedProjects.length;
            } else {
                return uniqueProjectCount >= parseInt(minAppearancesValue);
            }
        });
        
        // Sort people based on criteria
        filteredPeople.sort((a, b) => {
            const aAppearances = a.cast_appearances.length + a.crew_appearances.length;
            const bAppearances = b.cast_appearances.length + b.crew_appearances.length;
            
            if (sortByValue === 'billing') {
                // Sort by role importance (higher is better)
                return calculateRoleImportance(b) - calculateRoleImportance(a);
            } else if (sortByValue === 'name') {
                return a.name.localeCompare(b.name);
            } else if (sortByValue === 'appearances') {
                return bAppearances - aAppearances;
            } else if (sortByValue === 'role') {
                // Sort by role type (cast first, then crew)
                if (a.cast_appearances.length && !b.cast_appearances.length) {
                    return -1;
                } else if (!a.cast_appearances.length && b.cast_appearances.length) {
                    return 1;
                } else {
                    return a.name.localeCompare(b.name);
                }
            }
            
            // Default sort by appearances
            return bAppearances - aAppearances;
        });
        
        // Clear loading spinner
        comparisonResults.innerHTML = '';
        
        // If no results after filtering
        if (filteredPeople.length === 0) {
            comparisonResults.innerHTML = `
                <div class="no-results">
                    <p>No people match the current filter criteria.</p>
                </div>
            `;
            return;
        }
        
        // Display filtered and sorted people
        filteredPeople.forEach(person => {
            const personCard = document.importNode(personCardTemplate.content, true);
            
            // Set person image
            const personImg = personCard.querySelector('.person-image');
            // Check if profile path exists before setting src to avoid unnecessary requests
            if (person.profile_path) {
                personImg.src = `${TMDB_IMAGE_BASE_URL}${PROFILE_SIZE}${person.profile_path}`;
                // Only set onerror if we're trying to load a real image
                personImg.onerror = () => { 
                    personImg.src = DEFAULT_PROFILE; 
                    // Remove the handler after triggering once to prevent loops
                    personImg.onerror = null;
                };
            } else {
                // Set default profile directly if no profile path
                personImg.src = DEFAULT_PROFILE;
            }
            personImg.alt = person.name;
            
            // Create person info structure
            const personInfo = personCard.querySelector('.person-info');
            personInfo.innerHTML = `
                <div class="person-info-top">
                    <h3 class="person-name">${person.name}</h3>
                    <button class="expand-btn">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                </div>
            `;
            
            // Add appearances text if more than 2 projects
            if (selectedProjects.length > 2) {
                // Count unique projects this person appears in
                const uniqueProjectIds = new Set();
                
                // Add all project IDs from cast appearances
                person.cast_appearances.forEach(appearance => {
                    uniqueProjectIds.add(`${appearance.media_type}-${appearance.project_id}`);
                });
                
                // Add all project IDs from crew appearances
                person.crew_appearances.forEach(appearance => {
                    uniqueProjectIds.add(`${appearance.media_type}-${appearance.project_id}`);
                });
                
                const uniqueProjectCount = uniqueProjectIds.size;
                
                const appearancesElement = document.createElement('p');
                appearancesElement.className = 'person-appearances';
                appearancesElement.textContent = `Appears in ${uniqueProjectCount} of ${selectedProjects.length} projects`;
                personInfo.appendChild(appearancesElement);
            }
            
            // Add role type tags
            const roleTypes = getPersonRoleTypes(person);
            if (roleTypes.length > 0) {
                const roleTags = document.createElement('div');
                roleTags.className = 'role-tags';
                
                roleTypes.forEach(roleType => {
                    const tag = document.createElement('span');
                    tag.className = `role-tag ${roleType}`;
                    tag.textContent = roleType.charAt(0).toUpperCase() + roleType.slice(1);
                    roleTags.appendChild(tag);
                });
                
                personInfo.appendChild(roleTags);
            }
            
            // Get references to elements
            const personHeader = personCard.querySelector('.person-header');
            const expandBtn = personCard.querySelector('.expand-btn');
            const personDetails = personCard.querySelector('.person-details');
            
            // Function to toggle expansion
            const toggleExpansion = () => {
                expandBtn.querySelector('i').classList.toggle('fa-chevron-down');
                expandBtn.querySelector('i').classList.toggle('fa-chevron-up');
                personDetails.classList.toggle('hidden');
            };
            
            // Add click event to the header
            personHeader.addEventListener('click', (e) => {
                // Only toggle if the click wasn't on the expand button itself
                // (to avoid double-toggling)
                if (!e.target.closest('.expand-btn')) {
                    toggleExpansion();
                }
            });
            
            // Add click event to the expand button
            expandBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent the header click from also firing
                toggleExpansion();
            });
            
            // Populate projects list
            const projectsList = personCard.querySelector('.projects-list');
            
            // Group appearances by project
            const projectAppearances = new Map();
            
            // Process cast appearances
            person.cast_appearances.forEach(appearance => {
                const projectKey = `${appearance.media_type}-${appearance.project_id}`;
                
                if (!projectAppearances.has(projectKey)) {
                    const project = selectedProjects.find(p => 
                        p.id === appearance.project_id && p.media_type === appearance.media_type
                    );
                    
                    projectAppearances.set(projectKey, {
                        project: project,
                        castRoles: [],
                        crewRoles: []
                    });
                }
                
                projectAppearances.get(projectKey).castRoles.push(appearance);
            });
            
            // Process crew appearances
            person.crew_appearances.forEach(appearance => {
                const projectKey = `${appearance.media_type}-${appearance.project_id}`;
                
                if (!projectAppearances.has(projectKey)) {
                    const project = selectedProjects.find(p => 
                        p.id === appearance.project_id && p.media_type === appearance.media_type
                    );
                    
                    projectAppearances.set(projectKey, {
                        project: project,
                        castRoles: [],
                        crewRoles: []
                    });
                }
                
                projectAppearances.get(projectKey).crewRoles.push(appearance);
            });
            
            // Create project cards for each project
            projectAppearances.forEach(projectData => {
                const { project, castRoles, crewRoles } = projectData;
                
                const projectRoleCard = document.createElement('div');
                projectRoleCard.className = 'project-role-card';
                
                // Create project header
                const projectHeader = document.createElement('div');
                projectHeader.className = 'project-role-header';
                projectHeader.textContent = project ? (project.title || project.name) : 'Unknown Project';
                projectRoleCard.appendChild(projectHeader);
                
                // Create project details container
                const projectDetails = document.createElement('div');
                projectDetails.className = 'project-role-details';
                projectRoleCard.appendChild(projectDetails);
                
                // Add cast roles
                if (castRoles.length > 0) {
                    castRoles.forEach(role => {
                        const roleItem = document.createElement('div');
                        roleItem.className = 'role-item cast-role';
                        
                        roleItem.innerHTML = `
                            <div class="role-title">Cast: ${role.character || 'Unknown Role'}</div>
                            <div class="role-description">
                                ${role.character ? `Played ${role.character}` : 'Cast member'}
                            </div>
                        `;
                        
                        projectDetails.appendChild(roleItem);
                    });
                }
                
                // Add crew roles
                if (crewRoles.length > 0) {
                    crewRoles.forEach(role => {
                        const roleType = getRoleType(role.job, role.department);
                        
                        const roleItem = document.createElement('div');
                        roleItem.className = `role-item crew-role role-type-${roleType}`;
                        
                        roleItem.innerHTML = `
                            <div class="role-title">${role.department ? `${role.department}: ` : ''}${role.job || 'Unknown Role'}</div>
                            <div class="role-description">
                                ${role.job && role.job !== role.department ? role.job : ''}
                            </div>
                        `;
                        
                        projectDetails.appendChild(roleItem);
                    });
                }
                
                projectsList.appendChild(projectRoleCard);
            });
            
            // Add IMDb link if available
            if (person.imdb_id) {
                const imdbLink = document.createElement('a');
                imdbLink.href = `https://www.imdb.com/name/${person.imdb_id}/`;
                imdbLink.target = '_blank';
                imdbLink.rel = 'noopener noreferrer';
                imdbLink.className = 'imdb-link';
                imdbLink.innerHTML = `<i class="fas fa-external-link-alt"></i> View on IMDb`;
                
                const linkContainer = document.createElement('div');
                linkContainer.style.textAlign = 'right';
                linkContainer.style.marginTop = '10px';
                linkContainer.appendChild(imdbLink);
                
                projectsList.appendChild(linkContainer);
            }
            
            comparisonResults.appendChild(personCard);
        });
    }, 0);
}

function resetApplication() {
    // Reset form
    comparisonForm.reset();
    
    // Clear any extra project inputs (keep the first two)
    const projectInputs = document.querySelectorAll('.project-input');
    for (let i = 2; i < projectInputs.length; i++) {
        projectInputs[i].remove();
    }
    
    // Reset state
    projectsToConfirm = [];
    selectedProjects = [];
    comparisonData = null;
    
    // Reset UI
    resultsSection.classList.add('hidden');
    confirmationSection.classList.add('hidden');
    searchSection.classList.remove('hidden');
    
    // Reset filters to default
    roleFilter.value = 'all';
    roleTypeFilter.value = 'all';
    sortBy.value = 'billing'; // Set billing as default sort
    minAppearances.value = '2';
    
    // Clear data attributes from inputs
    document.querySelectorAll('.project-name').forEach(input => {
        delete input.dataset.tmdbId;
        delete input.dataset.mediaType;
    });
}
