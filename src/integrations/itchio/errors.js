/**
 * Custom Error Classes for Itch.io API Client
 * 
 * Provides specific error types for different failure scenarios,
 * making error handling more precise and informative.
 * 
 * @module itchio/errors
 */

/**
 * Base error class for all itch.io API errors
 * 
 * @class ItchioError
 * @extends Error
 */
export class ItchioError extends Error {
	/**
	 * Create a new ItchioError
	 * 
	 * @param {string} message - Error message
	 * @param {Error} [cause] - Original error that caused this error
	 */
	constructor(message, cause = null) {
		super(message);
		this.name = 'ItchioError';
		this.cause = cause;
		
		// Maintains proper stack trace for where error was thrown
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}

	/**
	 * Get error details as JSON
	 * 
	 * @returns {Object} Error details
	 */
	toJSON() {
		return {
			name: this.name,
			message: this.message,
			cause: this.cause ? this.cause.message : null,
		};
	}
}

/**
 * Error thrown when API returns an error response
 * 
 * @class ItchioApiError
 * @extends ItchioError
 * 
 * @example
 * try {
 *   await client.get('invalid-endpoint');
 * } catch (error) {
 *   if (error instanceof ItchioApiError) {
 *     console.log(`API Error: ${error.statusCode} - ${error.message}`);
 *     console.log('Response:', error.responseData);
 *   }
 * }
 */
export class ItchioApiError extends ItchioError {
	/**
	 * Create a new ItchioApiError
	 * 
	 * @param {string} message - Error message
	 * @param {number} statusCode - HTTP status code
	 * @param {Object} [responseData] - Response data from API
	 */
	constructor(message, statusCode, responseData = null) {
		super(message);
		this.name = 'ItchioApiError';
		this.statusCode = statusCode;
		this.responseData = responseData;
	}

	/**
	 * Check if error is a client error (4xx)
	 * 
	 * @returns {boolean}
	 */
	isClientError() {
		return this.statusCode >= 400 && this.statusCode < 500;
	}

	/**
	 * Check if error is a server error (5xx)
	 * 
	 * @returns {boolean}
	 */
	isServerError() {
		return this.statusCode >= 500 && this.statusCode < 600;
	}

	/**
	 * Get error details as JSON
	 * 
	 * @returns {Object} Error details
	 */
	toJSON() {
		return {
			...super.toJSON(),
			statusCode: this.statusCode,
			responseData: this.responseData,
		};
	}
}

/**
 * Error thrown when rate limit is exceeded
 * 
 * @class ItchioRateLimitError
 * @extends ItchioApiError
 * 
 * @example
 * try {
 *   await client.get('me');
 * } catch (error) {
 *   if (error instanceof ItchioRateLimitError) {
 *     console.log(`Rate limited. Retry after ${error.retryAfter}ms`);
 *   }
 * }
 */
export class ItchioRateLimitError extends ItchioApiError {
	/**
	 * Create a new ItchioRateLimitError
	 * 
	 * @param {string} message - Error message
	 * @param {Response} response - Fetch response object
	 * @param {number} [retryAfter] - Time to wait before retrying (ms)
	 */
	constructor(message, response, retryAfter = null) {
		super(message, 429, null);
		this.name = 'ItchioRateLimitError';
		this.retryAfter = retryAfter;
		this.response = response;
	}

	/**
	 * Get error details as JSON
	 * 
	 * @returns {Object} Error details
	 */
	toJSON() {
		return {
			...super.toJSON(),
			retryAfter: this.retryAfter,
		};
	}
}

/**
 * Error thrown when a network error occurs
 * 
 * @class ItchioNetworkError
 * @extends ItchioError
 * 
 * @example
 * try {
 *   await client.get('me');
 * } catch (error) {
 *   if (error instanceof ItchioNetworkError) {
 *     console.log('Network issue:', error.message);
 *   }
 * }
 */
export class ItchioNetworkError extends ItchioError {
	/**
	 * Create a new ItchioNetworkError
	 * 
	 * @param {string} message - Error message
	 * @param {Error} [cause] - Original network error
	 */
	constructor(message, cause = null) {
		super(message, cause);
		this.name = 'ItchioNetworkError';
	}
}

/**
 * Error thrown when a request times out
 * 
 * @class ItchioTimeoutError
 * @extends ItchioError
 * 
 * @example
 * try {
 *   await client.get('me', { timeout: 5000 });
 * } catch (error) {
 *   if (error instanceof ItchioTimeoutError) {
 *     console.log('Request timed out');
 *   }
 * }
 */
export class ItchioTimeoutError extends ItchioError {
	/**
	 * Create a new ItchioTimeoutError
	 * 
	 * @param {string} message - Error message
	 * @param {Error} [cause] - Original timeout error
	 */
	constructor(message, cause = null) {
		super(message, cause);
		this.name = 'ItchioTimeoutError';
	}
}

/**
 * Error thrown when authentication fails
 * 
 * @class ItchioAuthError
 * @extends ItchioApiError
 * 
 * @example
 * try {
 *   await client.get('me');
 * } catch (error) {
 *   if (error instanceof ItchioAuthError) {
 *     console.log('Authentication failed:', error.message);
 *   }
 * }
 */
export class ItchioAuthError extends ItchioApiError {
	/**
	 * Create a new ItchioAuthError
	 * 
	 * @param {string} message - Error message
	 * @param {number} [statusCode=401] - HTTP status code
	 * @param {Object} [responseData] - Response data from API
	 */
	constructor(message, statusCode = 401, responseData = null) {
		super(message, statusCode, responseData);
		this.name = 'ItchioAuthError';
	}
}

/**
 * Error thrown when required scope is missing
 * 
 * @class ItchioScopeError
 * @extends ItchioError
 * 
 * @example
 * try {
 *   if (!auth.hasScope('profile:games')) {
 *     throw new ItchioScopeError('profile:games');
 *   }
 * } catch (error) {
 *   if (error instanceof ItchioScopeError) {
 *     console.log(`Missing scope: ${error.requiredScope}`);
 *   }
 * }
 */
export class ItchioScopeError extends ItchioError {
	/**
	 * Create a new ItchioScopeError
	 * 
	 * @param {string|string[]} requiredScope - Required scope(s)
	 * @param {string[]} [availableScopes] - Currently available scopes
	 */
	constructor(requiredScope, availableScopes = []) {
		const scopes = Array.isArray(requiredScope) ? requiredScope : [requiredScope];
		const message = `Missing required scope(s): ${scopes.join(', ')}`;
		super(message);
		this.name = 'ItchioScopeError';
		this.requiredScope = scopes;
		this.availableScopes = availableScopes;
	}

	/**
	 * Get error details as JSON
	 * 
	 * @returns {Object} Error details
	 */
	toJSON() {
		return {
			...super.toJSON(),
			requiredScope: this.requiredScope,
			availableScopes: this.availableScopes,
		};
	}
}

/**
 * Error thrown when validation fails
 * 
 * @class ItchioValidationError
 * @extends ItchioError
 * 
 * @example
 * if (!gameId) {
 *   throw new ItchioValidationError('gameId is required');
 * }
 */
export class ItchioValidationError extends ItchioError {
	/**
	 * Create a new ItchioValidationError
	 * 
	 * @param {string} message - Error message
	 * @param {Object} [errors] - Validation errors by field
	 */
	constructor(message, errors = {}) {
		super(message);
		this.name = 'ItchioValidationError';
		this.errors = errors;
	}

	/**
	 * Get error details as JSON
	 * 
	 * @returns {Object} Error details
	 */
	toJSON() {
		return {
			...super.toJSON(),
			errors: this.errors,
		};
	}
}

/**
 * Check if error is retryable
 * 
 * @param {Error} error - Error to check
 * @returns {boolean} True if error is retryable
 * 
 * @example
 * if (isRetryableError(error)) {
 *   await retry(request);
 * }
 */
export function isRetryableError(error) {
	// Network errors are retryable
	if (error instanceof ItchioNetworkError) {
		return true;
	}

	// Timeout errors are retryable
	if (error instanceof ItchioTimeoutError) {
		return true;
	}

	// Rate limit errors are retryable
	if (error instanceof ItchioRateLimitError) {
		return true;
	}

	// Server errors (5xx) are retryable
	if (error instanceof ItchioApiError && error.isServerError()) {
		return true;
	}

	// Specific client errors that are retryable
	if (error instanceof ItchioApiError) {
		// 408 Request Timeout
		// 429 Too Many Requests (rate limit)
		const retryableStatusCodes = [408, 429];
		return retryableStatusCodes.includes(error.statusCode);
	}

	return false;
}

/**
 * Get user-friendly error message
 * 
 * @param {Error} error - Error object
 * @returns {string} User-friendly message
 * 
 * @example
 * console.log(getUserFriendlyMessage(error));
 */
export function getUserFriendlyMessage(error) {
	if (error instanceof ItchioRateLimitError) {
		const retrySeconds = Math.ceil(error.retryAfter / 1000);
		return `Too many requests. Please wait ${retrySeconds} seconds before trying again.`;
	}

	if (error instanceof ItchioAuthError) {
		return 'Authentication failed. Please check your API key or OAuth token.';
	}

	if (error instanceof ItchioScopeError) {
		return `Missing required permissions: ${error.requiredScope.join(', ')}`;
	}

	if (error instanceof ItchioTimeoutError) {
		return 'Request timed out. Please check your internet connection and try again.';
	}

	if (error instanceof ItchioNetworkError) {
		return 'Network error occurred. Please check your internet connection.';
	}

	if (error instanceof ItchioApiError) {
		if (error.statusCode === 404) {
			return 'The requested resource was not found.';
		}
		if (error.statusCode === 403) {
			return 'You do not have permission to access this resource.';
		}
		if (error.isServerError()) {
			return 'Server error occurred. Please try again later.';
		}
		return error.message;
	}

	return error.message || 'An unexpected error occurred.';
}
