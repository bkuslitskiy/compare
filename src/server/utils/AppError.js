/**
 * Custom error class for application errors
 * Allows setting status code and error type
 */
class AppError extends Error {
    /**
     * Create a new AppError
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code
     */
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        this.isOperational = true; // Indicates this is an expected operational error
        
        // Capture stack trace
        Error.captureStackTrace(this, this.constructor);
    }
    
    /**
     * Create a 400 Bad Request error
     * @param {string} message - Error message
     * @returns {AppError} - AppError instance
     */
    static badRequest(message = 'Bad Request') {
        return new AppError(message, 400);
    }
    
    /**
     * Create a 401 Unauthorized error
     * @param {string} message - Error message
     * @returns {AppError} - AppError instance
     */
    static unauthorized(message = 'Unauthorized') {
        return new AppError(message, 401);
    }
    
    /**
     * Create a 403 Forbidden error
     * @param {string} message - Error message
     * @returns {AppError} - AppError instance
     */
    static forbidden(message = 'Forbidden') {
        return new AppError(message, 403);
    }
    
    /**
     * Create a 404 Not Found error
     * @param {string} message - Error message
     * @returns {AppError} - AppError instance
     */
    static notFound(message = 'Not Found') {
        return new AppError(message, 404);
    }
    
    /**
     * Create a 429 Too Many Requests error
     * @param {string} message - Error message
     * @returns {AppError} - AppError instance
     */
    static tooManyRequests(message = 'Too Many Requests') {
        return new AppError(message, 429);
    }
    
    /**
     * Create a 500 Internal Server Error
     * @param {string} message - Error message
     * @returns {AppError} - AppError instance
     */
    static internal(message = 'Internal Server Error') {
        return new AppError(message, 500);
    }
}

module.exports = AppError;
