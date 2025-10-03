/**
 * Itch.io API Client with Rate Limiting
 * 
 * A robust HTTP client for interacting with the itch.io API, featuring:
 * - Token bucket rate limiting
 * - Exponential backoff retry logic
 * - Comprehensive error handling
 * - Request/response logging
 * - Request cancellation
 * - Configurable timeouts and retry policies
 * 
 * @module itchio/client
 */

import { ItchioAuth } from './auth.js';
import { RateLimiter } from './rate-limiter.js';
import { ItchioApiError, ItchioNetworkError, ItchioRateLimitError, ItchioTimeoutError } from './errors.js';

/**
 * HTTP methods supported by the API client
 * @enum {string}
 */
export const HttpMethod = {
	GET: 'GET',
	POST: 'POST',
	PUT: 'PUT',
	DELETE: 'DELETE',
	PATCH: 'PATCH',
};

/**
 * Default configuration for the API client
 * @type {Object}
 */
const DEFAULT_CONFIG = {
	baseUrl: 'https://itch.io/api/1',
	timeout: 30000, // 30 seconds
	maxRetries: 3,
	retryDelay: 1000, // 1 second base delay
	retryMultiplier: 2, // Exponential backoff multiplier
	maxRetryDelay: 32000, // 32 seconds max delay
	rateLimit: {
		maxRequests: 60, // 60 requests
		windowMs: 60000, // per minute (1 minute window)
	},
	logging: {
		enabled: false,
		logRequests: true,
		logResponses: true,
		logErrors: true,
	},
};

/**
 * Main API client for itch.io
 * 
 * @class ItchioClient
 * @example
 * const client = new ItchioClient(auth);
 * const user = await client.get('me');
 */
export class ItchioClient {
	/**
	 * Create a new ItchioClient
	 * 
	 * @param {ItchioAuth} auth - Initialized authentication instance
	 * @param {Object} [config] - Client configuration options
	 * @param {string} [config.baseUrl] - API base URL
	 * @param {number} [config.timeout] - Request timeout in milliseconds
	 * @param {number} [config.maxRetries] - Maximum retry attempts
	 * @param {number} [config.retryDelay] - Base retry delay in milliseconds
	 * @param {number} [config.retryMultiplier] - Exponential backoff multiplier
	 * @param {number} [config.maxRetryDelay] - Maximum retry delay in milliseconds
	 * @param {Object} [config.rateLimit] - Rate limiting configuration
	 * @param {Object} [config.logging] - Logging configuration
	 */
	constructor(auth, config = {}) {
		if (!auth || !(auth instanceof ItchioAuth)) {
			throw new Error('Valid ItchioAuth instance required');
		}

		this.auth = auth;
		this.config = { ...DEFAULT_CONFIG, ...config };
		
		// Initialize rate limiter
		this.rateLimiter = new RateLimiter(
			this.config.rateLimit.maxRequests,
			this.config.rateLimit.windowMs
		);

		// Track active requests for cancellation
		this.activeRequests = new Map();
		
		// Request counter for logging
		this.requestCounter = 0;
	}

	/**
	 * Execute a GET request
	 * 
	 * @param {string} endpoint - API endpoint (without base URL)
	 * @param {Object} [options] - Request options
	 * @param {Object} [options.params] - Query parameters
	 * @param {Object} [options.headers] - Additional headers
	 * @param {AbortSignal} [options.signal] - Abort signal for cancellation
	 * @returns {Promise<Object>} Response data
	 * 
	 * @example
	 * const games = await client.get('my-games', { params: { page: 1 } });
	 */
	async get(endpoint, options = {}) {
		return this.request(HttpMethod.GET, endpoint, options);
	}

	/**
	 * Execute a POST request
	 * 
	 * @param {string} endpoint - API endpoint
	 * @param {Object} [data] - Request body data
	 * @param {Object} [options] - Request options
	 * @returns {Promise<Object>} Response data
	 * 
	 * @example
	 * const result = await client.post('games', { title: 'My Game' });
	 */
	async post(endpoint, data = null, options = {}) {
		return this.request(HttpMethod.POST, endpoint, { ...options, body: data });
	}

	/**
	 * Execute a PUT request
	 * 
	 * @param {string} endpoint - API endpoint
	 * @param {Object} [data] - Request body data
	 * @param {Object} [options] - Request options
	 * @returns {Promise<Object>} Response data
	 */
	async put(endpoint, data = null, options = {}) {
		return this.request(HttpMethod.PUT, endpoint, { ...options, body: data });
	}

	/**
	 * Execute a PATCH request
	 * 
	 * @param {string} endpoint - API endpoint
	 * @param {Object} [data] - Request body data
	 * @param {Object} [options] - Request options
	 * @returns {Promise<Object>} Response data
	 */
	async patch(endpoint, data = null, options = {}) {
		return this.request(HttpMethod.PATCH, endpoint, { ...options, body: data });
	}

	/**
	 * Execute a DELETE request
	 * 
	 * @param {string} endpoint - API endpoint
	 * @param {Object} [options] - Request options
	 * @returns {Promise<Object>} Response data
	 */
	async delete(endpoint, options = {}) {
		return this.request(HttpMethod.DELETE, endpoint, options);
	}

	/**
	 * Execute an HTTP request with rate limiting and retry logic
	 * 
	 * @private
	 * @param {string} method - HTTP method
	 * @param {string} endpoint - API endpoint
	 * @param {Object} [options] - Request options
	 * @returns {Promise<Object>} Response data
	 */
	async request(method, endpoint, options = {}) {
		const requestId = ++this.requestCounter;

		// Wait for rate limiter
		await this.rateLimiter.acquire();

		// Build request
		const url = this._buildUrl(endpoint, options.params);
		const requestOptions = this._buildRequestOptions(method, options);

		this._log('request', { requestId, method, url, options: requestOptions });

		// Execute with retry logic
		return this._executeWithRetry(requestId, url, requestOptions);
	}

	/**
	 * Execute request with exponential backoff retry logic
	 * 
	 * @private
	 * @param {number} requestId - Request identifier
	 * @param {string} url - Request URL
	 * @param {Object} options - Fetch options
	 * @returns {Promise<Object>} Response data
	 */
	async _executeWithRetry(requestId, url, options) {
		let lastError = null;
		let retryDelay = this.config.retryDelay;

		for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
			try {
				// Create abort controller for timeout
				const controller = new AbortController();
				const timeoutId = setTimeout(
					() => controller.abort(),
					this.config.timeout
				);

				// Merge signals if user provided one
				const signal = options.signal
					? this._mergeSignals(options.signal, controller.signal)
					: controller.signal;

				// Store controller for potential cancellation
				this.activeRequests.set(requestId, controller);

				try {
					// Execute request
					const response = await fetch(url, { ...options, signal });
					clearTimeout(timeoutId);

					// Handle rate limiting (429)
					if (response.status === 429) {
						const retryAfter = this._getRetryAfter(response);
						
						if (attempt < this.config.maxRetries) {
							this._log('rateLimited', { 
								requestId, 
								attempt: attempt + 1,
								retryAfter,
							});
							
							await this._sleep(retryAfter);
							continue;
						}
						
						throw new ItchioRateLimitError(
							'Rate limit exceeded',
							response,
							retryAfter
						);
					}

					// Parse and validate response
					const data = await this._parseResponse(response);
					
					this._log('response', { 
						requestId, 
						status: response.status,
						data,
					});

					return data;

				} finally {
					clearTimeout(timeoutId);
					this.activeRequests.delete(requestId);
				}

			} catch (error) {
				lastError = error;

				// Don't retry for certain errors
				if (this._shouldNotRetry(error, attempt)) {
					throw this._wrapError(error);
				}

				// Log retry attempt
				if (attempt < this.config.maxRetries) {
					this._log('retry', {
						requestId,
						attempt: attempt + 1,
						maxRetries: this.config.maxRetries,
						delay: retryDelay,
						error: error.message,
					});

					await this._sleep(retryDelay);
					
					// Exponential backoff
					retryDelay = Math.min(
						retryDelay * this.config.retryMultiplier,
						this.config.maxRetryDelay
					);
				}
			}
		}

		// All retries exhausted
		throw this._wrapError(lastError);
	}

	/**
	 * Build full URL with query parameters
	 * 
	 * @private
	 * @param {string} endpoint - API endpoint
	 * @param {Object} [params] - Query parameters
	 * @returns {string} Full URL
	 */
	_buildUrl(endpoint, params) {
		// Use authenticated URL from auth module
		const url = this.auth.getAuthenticatedUrl(endpoint);

		if (params && Object.keys(params).length > 0) {
			const searchParams = new URLSearchParams(params);
			return `${url}?${searchParams.toString()}`;
		}

		return url;
	}

	/**
	 * Build fetch options
	 * 
	 * @private
	 * @param {string} method - HTTP method
	 * @param {Object} options - Request options
	 * @returns {Object} Fetch options
	 */
	_buildRequestOptions(method, options = {}) {
		const headers = {
			...this.auth.getAuthHeaders(),
			...options.headers,
		};

		const requestOptions = {
			method,
			headers,
		};

		// Add body for non-GET requests
		if (options.body && method !== HttpMethod.GET) {
			requestOptions.body = JSON.stringify(options.body);
		}

		return requestOptions;
	}

	/**
	 * Parse and validate response
	 * 
	 * @private
	 * @param {Response} response - Fetch response
	 * @returns {Promise<Object>} Parsed data
	 * @throws {ItchioApiError} On API errors
	 */
	async _parseResponse(response) {
		const contentType = response.headers.get('content-type');
		
		// Parse JSON response
		let data;
		if (contentType && contentType.includes('application/json')) {
			data = await response.json();
		} else {
			data = await response.text();
		}

		// Check for API errors
		if (!response.ok) {
			throw new ItchioApiError(
				data.errors ? data.errors.join(', ') : `HTTP ${response.status}`,
				response.status,
				data
			);
		}

		// Check for errors in response body
		if (data && data.errors && data.errors.length > 0) {
			throw new ItchioApiError(
				data.errors.join(', '),
				response.status,
				data
			);
		}

		return data;
	}

	/**
	 * Get retry-after delay from response headers
	 * 
	 * @private
	 * @param {Response} response - Fetch response
	 * @returns {number} Delay in milliseconds
	 */
	_getRetryAfter(response) {
		const retryAfter = response.headers.get('retry-after');
		
		if (retryAfter) {
			// If it's a number of seconds
			if (/^\d+$/.test(retryAfter)) {
				return parseInt(retryAfter, 10) * 1000;
			}
			
			// If it's a date
			const retryDate = new Date(retryAfter);
			if (!isNaN(retryDate.getTime())) {
				return Math.max(0, retryDate.getTime() - Date.now());
			}
		}

		// Default to exponential backoff delay
		return this.config.retryDelay;
	}

	/**
	 * Determine if error should not be retried
	 * 
	 * @private
	 * @param {Error} error - Error object
	 * @param {number} attempt - Current attempt number
	 * @returns {boolean} True if should not retry
	 */
	_shouldNotRetry(error, attempt) {
		// No more retries left
		if (attempt >= this.config.maxRetries) {
			return true;
		}

		// User cancelled request
		if (error.name === 'AbortError') {
			return true;
		}

		// API errors that shouldn't be retried
		if (error instanceof ItchioApiError) {
			const status = error.statusCode;
			// Don't retry client errors (except 429 rate limit)
			if (status >= 400 && status < 500 && status !== 429) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Wrap error in appropriate error type
	 * 
	 * @private
	 * @param {Error} error - Original error
	 * @returns {Error} Wrapped error
	 */
	_wrapError(error) {
		if (error instanceof ItchioApiError || 
		    error instanceof ItchioRateLimitError) {
			return error;
		}

		if (error.name === 'AbortError') {
			return new ItchioTimeoutError('Request timeout', error);
		}

		return new ItchioNetworkError(error.message, error);
	}

	/**
	 * Merge multiple abort signals
	 * 
	 * @private
	 * @param {...AbortSignal} signals - Signals to merge
	 * @returns {AbortSignal} Combined signal
	 */
	_mergeSignals(...signals) {
		const controller = new AbortController();
		
		for (const signal of signals) {
			if (signal.aborted) {
				controller.abort();
				return controller.signal;
			}
			
			signal.addEventListener('abort', () => controller.abort(), { once: true });
		}
		
		return controller.signal;
	}

	/**
	 * Sleep for specified milliseconds
	 * 
	 * @private
	 * @param {number} ms - Milliseconds to sleep
	 * @returns {Promise<void>}
	 */
	_sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * Log message if logging is enabled
	 * 
	 * @private
	 * @param {string} type - Log type
	 * @param {Object} data - Log data
	 */
	_log(type, data) {
		if (!this.config.logging.enabled) return;

		const logTypes = {
			request: this.config.logging.logRequests,
			response: this.config.logging.logResponses,
			error: this.config.logging.logErrors,
			retry: this.config.logging.logErrors,
			rateLimited: this.config.logging.logErrors,
		};

		if (logTypes[type]) {
			console.log(`[ItchioClient:${type}]`, data);
		}
	}

	/**
	 * Cancel a specific request
	 * 
	 * @param {number} requestId - Request identifier
	 * @returns {boolean} True if request was cancelled
	 */
	cancelRequest(requestId) {
		const controller = this.activeRequests.get(requestId);
		if (controller) {
			controller.abort();
			this.activeRequests.delete(requestId);
			return true;
		}
		return false;
	}

	/**
	 * Cancel all active requests
	 * 
	 * @returns {number} Number of requests cancelled
	 */
	cancelAllRequests() {
		const count = this.activeRequests.size;
		for (const controller of this.activeRequests.values()) {
			controller.abort();
		}
		this.activeRequests.clear();
		return count;
	}

	/**
	 * Get current rate limiter stats
	 * 
	 * @returns {Object} Rate limiter statistics
	 */
	getRateLimiterStats() {
		return this.rateLimiter.getStats();
	}

	/**
	 * Reset rate limiter
	 */
	resetRateLimiter() {
		this.rateLimiter.reset();
	}
}

/**
 * Create a client instance from environment variables
 * 
 * @param {Object} [config] - Client configuration
 * @returns {Promise<ItchioClient>} Initialized client
 * 
 * @example
 * const client = await createClientFromEnv({ logging: { enabled: true } });
 */
export async function createClientFromEnv(config = {}) {
	const { createAuthFromEnv } = await import('./auth.js');
	const auth = createAuthFromEnv();
	await auth.initialize();
	return new ItchioClient(auth, config);
}

/**
 * Create a client instance from configuration file
 * 
 * @param {string} configPath - Path to configuration file
 * @returns {Promise<ItchioClient>} Initialized client
 */
export async function createClientFromConfig(configPath) {
	const { createAuthFromConfig } = await import('./auth.js');
	const auth = await createAuthFromConfig(configPath);
	await auth.initialize();
	return new ItchioClient(auth);
}
