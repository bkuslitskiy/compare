/**
 * Interactive Background Animation
 * Creates a grid of dots that connect and disconnect from the cursor as it moves around,
 * drawing closer and forming bonds upon approach, then dissolving those bonds and returning
 * to their grid locations when the cursor moves away.
 * 
 * Supports both light and dark modes by detecting the user's color scheme preference.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Create the canvas element
    const canvas = document.createElement('canvas');
    canvas.id = 'background-canvas';
    document.body.appendChild(canvas);
    
    // Set canvas styles
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '-1';
    canvas.style.pointerEvents = 'none'; // Allow clicks to pass through
    
    // Get the canvas context
    const ctx = canvas.getContext('2d');
    
    // Color schemes for light and dark modes
    const colorSchemes = {
        light: {
            dotColor: 'rgba(150, 150, 150, 0.8)', // Grey dots for light mode
            gridColor: 'rgba(150, 150, 150, {opacity})', // Grey grid for light mode
            cursorColor: 'rgba(100, 150, 255, {opacity})' // Blue cursor connections for light mode
        },
        dark: {
            dotColor: 'rgba(180, 180, 180, 0.8)', // Lighter grey dots for dark mode
            gridColor: 'rgba(180, 180, 180, {opacity})', // Lighter grey grid for dark mode
            cursorColor: 'rgba(120, 170, 255, {opacity})' // Brighter blue cursor connections for dark mode
        }
    };
    
    // Detect color scheme preference
    let isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    let currentColorScheme = isDarkMode ? colorSchemes.dark : colorSchemes.light;
    
    // Listen for changes in color scheme preference
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        if (localStorage.getItem('theme') === 'system') {
            isDarkMode = event.matches;
            currentColorScheme = isDarkMode ? colorSchemes.dark : colorSchemes.light;
            
            // Update colors of existing dots
            dots.forEach(dot => {
                dot.color = currentColorScheme.dotColor;
            });
        }
    });
    
    // Listen for theme change events from the app
    document.addEventListener('themeChange', event => {
        const theme = event.detail.theme;
        
        if (theme === 'dark') {
            currentColorScheme = colorSchemes.dark;
        } else if (theme === 'light') {
            currentColorScheme = colorSchemes.light;
        } else if (theme === 'system') {
            // Use system preference
            isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            currentColorScheme = isDarkMode ? colorSchemes.dark : colorSchemes.light;
        }
        
        // Update colors of existing dots
        dots.forEach(dot => {
            dot.color = currentColorScheme.dotColor;
        });
    });
    
    // Check for saved theme preference on load
    const savedTheme = localStorage.getItem('theme') || 'system';
    if (savedTheme === 'dark') {
        currentColorScheme = colorSchemes.dark;
    } else if (savedTheme === 'light') {
        currentColorScheme = colorSchemes.light;
    } else {
        // Use system preference
        isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        currentColorScheme = isDarkMode ? colorSchemes.dark : colorSchemes.light;
    }
    
    // Set canvas dimensions
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        createDots(); // Recreate dots when canvas is resized
    }
    
    // Initialize mouse position
    let mouse = {
        x: undefined,
        y: undefined,
        radius: 150 // Interaction radius
    };
    
    // Track mouse position
    window.addEventListener('mousemove', function(event) {
        mouse.x = event.x;
        mouse.y = event.y;
    });
    
    // Handle touch events for mobile
    window.addEventListener('touchmove', function(event) {
        if (event.touches.length > 0) {
            mouse.x = event.touches[0].clientX;
            mouse.y = event.touches[0].clientY;
        }
    });
    
    // Reset mouse position when mouse leaves window
    window.addEventListener('mouseout', function() {
        mouse.x = undefined;
        mouse.y = undefined;
    });
    
    // Handle window resize
    window.addEventListener('resize', resizeCanvas);
    
    // Dot class
    class Dot {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.originalX = x; // Original grid position
            this.originalY = y; // Original grid position
            this.size = 2; // Dot size
            this.color = currentColorScheme.dotColor; // Use current color scheme
            this.velocity = {
                x: 0,
                y: 0
            };
            this.friction = 0.85; // Reduced friction to make movement smoother but less jittery
            this.springFactor = 0.1; // Moderate spring factor
        }
        
        // Draw the dot
        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Update dot position based on mouse interaction
        update() {
            // Calculate distance from original position
            const dx = this.originalX - this.x;
            const dy = this.originalY - this.y;
            
            // Check if mouse is not defined (cursor left the window)
            if (mouse.x === undefined && mouse.y === undefined) {
                // Direct return to original position when mouse leaves window
                this.x = this.x + dx * 0.1; // Move 10% of the way back each frame
                this.y = this.y + dy * 0.1;
                
                // If very close to original position, snap back
                if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
                    this.x = this.originalX;
                    this.y = this.originalY;
                    this.velocity.x = 0;
                    this.velocity.y = 0;
                }
            } else {
                // Apply spring force to return to original position
                this.velocity.x += dx * this.springFactor;
                this.velocity.y += dy * this.springFactor;
                
                // Apply friction
                this.velocity.x *= this.friction;
                this.velocity.y *= this.friction;
                
                // Move dot based on velocity
                this.x += this.velocity.x;
                this.y += this.velocity.y;
            }
            
            // If mouse is defined, interact with it
            if (mouse.x !== undefined && mouse.y !== undefined) {
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // If dot is within mouse radius, move it
                if (distance < mouse.radius) {
                    // Calculate force direction
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    
                    // Calculate force strength (stronger when closer)
                    const force = (mouse.radius - distance) / mouse.radius;
                    
                    // Apply force to velocity (attraction)
                    this.velocity.x += forceDirectionX * force * 0.6; // Increased attraction force
                    this.velocity.y += forceDirectionY * force * 0.6;
                }
            }
            
            // Draw the dot
            this.draw();
        }
    }
    
    // Array to store dots
    let dots = [];
    
    // Create dots in a grid pattern
    function createDots() {
        dots = [];
        const spacing = 40; // Space between dots
        
        // Calculate number of dots based on canvas size
        const numCols = Math.floor(canvas.width / spacing) + 1;
        const numRows = Math.floor(canvas.height / spacing) + 1;
        
        // Create dots in a grid
        for (let y = 0; y < numRows; y++) {
            for (let x = 0; x < numCols; x++) {
                const dotX = x * spacing;
                const dotY = y * spacing;
                dots.push(new Dot(dotX, dotY));
            }
        }
    }
    
    // Draw connections between dots
    function drawConnections() {
        // Draw fainter grid connections between dots
        for (let i = 0; i < dots.length; i++) {
            for (let j = i + 1; j < dots.length; j++) {
                const dot1 = dots[i];
                const dot2 = dots[j];
                
                // Calculate distance between dots
                const dx = dot1.x - dot2.x;
                const dy = dot1.y - dot2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Only draw connections if dots are close enough
                if (distance < 60) {
                    // Calculate opacity based on distance (fainter)
                    const opacity = (1 - (distance / 60)) * 0.2; // Reduced opacity for grid
                    
                    // Draw line between dots using current color scheme
                    ctx.strokeStyle = currentColorScheme.gridColor.replace('{opacity}', opacity);
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(dot1.x, dot1.y);
                    ctx.lineTo(dot2.x, dot2.y);
                    ctx.stroke();
                }
            }
        }
        
        // Draw stronger connections to cursor
        if (mouse.x !== undefined && mouse.y !== undefined) {
            for (let i = 0; i < dots.length; i++) {
                const dot = dots[i];
                const dx = mouse.x - dot.x;
                const dy = mouse.y - dot.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < mouse.radius) {
                    // Calculate opacity based on distance (stronger)
                    const opacity = (1 - (distance / mouse.radius)) * 0.8; // Increased opacity for cursor connections
                    
                    // Draw line between dot and cursor using current color scheme
                    ctx.strokeStyle = currentColorScheme.cursorColor.replace('{opacity}', opacity);
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(dot.x, dot.y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                }
            }
        }
    }
    
    // Animation loop
    function animate() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw connections between dots
        drawConnections();
        
        // Update and draw dots
        for (let i = 0; i < dots.length; i++) {
            dots[i].update();
        }
        
        // Request next frame
        requestAnimationFrame(animate);
    }
    
    // Initialize
    resizeCanvas();
    animate();
});
