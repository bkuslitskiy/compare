const fs = require('fs');
const path = require('path');

/**
 * Error handling middleware
 * Renders error pages with appropriate status codes and messages
 */
const errorHandler = (err, req, res, next) => {
    // Log the error
    console.error('Server error:', err);
    
    // Default error values
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    let description = 'An unexpected error occurred on the server.';
    
    // Customize description based on status code
    if (statusCode === 400) {
        description = 'The request was malformed or contains invalid parameters.';
    } else if (statusCode === 401) {
        description = 'Authentication is required to access this resource.';
    } else if (statusCode === 403) {
        description = 'You do not have permission to access this resource.';
    } else if (statusCode === 404) {
        description = 'The requested resource could not be found.';
    } else if (statusCode === 429) {
        description = 'Too many requests. Please try again later.';
    }
    
    // For API requests, return JSON
    if (req.path.startsWith('/api')) {
        return res.status(statusCode).json({
            error: message,
            status: statusCode,
            description: process.env.NODE_ENV === 'development' ? err.stack : description
        });
    }
    
    // For regular requests, render the error page
    try {
        // Read the error template
        let errorTemplate = fs.readFileSync(
            path.join(__dirname, '../../..', 'public', 'error.html'),
            'utf8'
        );
        
        // Replace placeholders with actual values
        errorTemplate = errorTemplate
            .replace('{{statusCode}}', statusCode)
            .replace('{{message}}', message)
            .replace('{{description}}', description);
        
        // Send the response
        res.status(statusCode).send(errorTemplate);
    } catch (templateErr) {
        // If there's an error rendering the template, fall back to basic HTML
        console.error('Error rendering error template:', templateErr);
        
        res.status(statusCode).send(`
            <html>
                <head>
                    <title>Error ${statusCode}</title>
                    <style>
                        body { font-family: sans-serif; text-align: center; padding: 50px; }
                        h1 { font-size: 4em; color: #e74c3c; }
                    </style>
                </head>
                <body>
                    <h1>${statusCode}</h1>
                    <h2>${message}</h2>
                    <p>${description}</p>
                    <a href="/">Return to Home</a>
                </body>
            </html>
        `);
    }
};

module.exports = errorHandler;
