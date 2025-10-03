/**
 * Rate Limiter using Token Bucket Algorithm
 * 
 * Implements a token bucket rate limiting strategy to prevent exceeding API rate limits.
 * Tokens are added to the bucket at a constant rate, and requests consume tokens.
 * If no tokens are available, requests wait until tokens become available.
 * 
 * @module itchio/rate-limiter
 */

/**
 * Token bucket rate limiter
 * 
 * @class RateLimiter
 * @example
 * const limiter = new RateLimiter(60, 60000); // 60 requests per minute
 * await limiter.acquire(); // Wait for a token
 */
export class RateLimiter {
	/**
	 * Create a new rate limiter
	 * 
	 * @param {number} maxRequests - Maximum number of requests allowed
	 * @param {number} windowMs - Time window in milliseconds
	 * 
	 * @example
	 * // Allow 60 requests per minute
	 * const limiter = new RateLimiter(60, 60000);
	 */
	constructor(maxRequests, windowMs) {
		this.maxTokens = maxRequests;
		this.windowMs = windowMs;
		this.tokens = maxRequests;
		this.lastRefill = Date.now();
		
		// Calculate token refill rate (tokens per millisecond)
		this.refillRate = maxRequests / windowMs;
		
		// Queue for waiting requests
		this.queue = [];
		
		// Statistics
		this.stats = {
			totalRequests: 0,
			totalWaitTime: 0,
			maxWaitTime: 0,
			rejectedRequests: 0,
		};
	}

	/**
	 * Acquire a token from the bucket (wait if necessary)
	 * 
	 * @returns {Promise<void>} Resolves when token is acquired
	 * 
	 * @example
	 * await limiter.acquire();
	 * // Make API request here
	 */
	async acquire() {
		const startTime = Date.now();
		
		// Refill tokens based on time elapsed
		this._refillTokens();
		
		// If tokens available, consume one immediately
		if (this.tokens >= 1) {
			this.tokens -= 1;
			this._updateStats(0);
			return;
		}
		
		// No tokens available - wait in queue
		const waitTime = await this._waitForToken();
		this._updateStats(waitTime);
	}

	/**
	 * Try to acquire a token without waiting
	 * 
	 * @returns {boolean} True if token was acquired, false otherwise
	 * 
	 * @example
	 * if (limiter.tryAcquire()) {
	 *   // Make API request
	 * } else {
	 *   console.log('Rate limit would be exceeded');
	 * }
	 */
	tryAcquire() {
		this._refillTokens();
		
		if (this.tokens >= 1) {
			this.tokens -= 1;
			this._updateStats(0);
			return true;
		}
		
		this.stats.rejectedRequests++;
		return false;
	}

	/**
	 * Wait for a token to become available
	 * 
	 * @private
	 * @returns {Promise<number>} Wait time in milliseconds
	 */
	_waitForToken() {
		return new Promise((resolve) => {
			const startTime = Date.now();
			
			// Calculate time until next token available
			const timeUntilToken = this._getTimeUntilNextToken();
			
			// Set timeout to acquire token when available
			const timeoutId = setTimeout(() => {
				this._refillTokens();
				
				// Remove from queue
				const index = this.queue.indexOf(timeoutId);
				if (index > -1) {
					this.queue.splice(index, 1);
				}
				
				// Consume token
				this.tokens -= 1;
				
				const waitTime = Date.now() - startTime;
				resolve(waitTime);
			}, timeUntilToken);
			
			// Track in queue
			this.queue.push(timeoutId);
		});
	}

	/**
	 * Refill tokens based on elapsed time
	 * 
	 * @private
	 */
	_refillTokens() {
		const now = Date.now();
		const timePassed = now - this.lastRefill;
		
		// Calculate tokens to add
		const tokensToAdd = timePassed * this.refillRate;
		
		// Add tokens up to max capacity
		this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
		this.lastRefill = now;
	}

	/**
	 * Calculate time until next token is available
	 * 
	 * @private
	 * @returns {number} Time in milliseconds
	 */
	_getTimeUntilNextToken() {
		// If we have tokens, no wait needed
		if (this.tokens >= 1) {
			return 0;
		}
		
		// Calculate how long until we have 1 token
		const tokensNeeded = 1 - this.tokens;
		const timeNeeded = tokensNeeded / this.refillRate;
		
		return Math.ceil(timeNeeded);
	}

	/**
	 * Update statistics
	 * 
	 * @private
	 * @param {number} waitTime - Time waited in milliseconds
	 */
	_updateStats(waitTime) {
		this.stats.totalRequests++;
		this.stats.totalWaitTime += waitTime;
		this.stats.maxWaitTime = Math.max(this.stats.maxWaitTime, waitTime);
	}

	/**
	 * Get current rate limiter statistics
	 * 
	 * @returns {Object} Statistics object
	 * 
	 * @example
	 * const stats = limiter.getStats();
	 * console.log(`Avg wait time: ${stats.avgWaitTime}ms`);
	 */
	getStats() {
		return {
			availableTokens: Math.floor(this.tokens),
			maxTokens: this.maxTokens,
			queueLength: this.queue.length,
			totalRequests: this.stats.totalRequests,
			avgWaitTime: this.stats.totalRequests > 0
				? this.stats.totalWaitTime / this.stats.totalRequests
				: 0,
			maxWaitTime: this.stats.maxWaitTime,
			rejectedRequests: this.stats.rejectedRequests,
			utilizationRate: this.stats.totalRequests > 0
				? ((this.maxTokens - this.tokens) / this.maxTokens) * 100
				: 0,
		};
	}

	/**
	 * Reset the rate limiter to initial state
	 * 
	 * @example
	 * limiter.reset();
	 */
	reset() {
		// Cancel all pending timeouts
		for (const timeoutId of this.queue) {
			clearTimeout(timeoutId);
		}
		
		this.tokens = this.maxTokens;
		this.lastRefill = Date.now();
		this.queue = [];
		this.stats = {
			totalRequests: 0,
			totalWaitTime: 0,
			maxWaitTime: 0,
			rejectedRequests: 0,
		};
	}

	/**
	 * Get time remaining in current window
	 * 
	 * @returns {number} Time in milliseconds
	 */
	getTimeUntilRefill() {
		const timeSinceRefill = Date.now() - this.lastRefill;
		return Math.max(0, this.windowMs - timeSinceRefill);
	}

	/**
	 * Check if rate limiter is currently throttling requests
	 * 
	 * @returns {boolean} True if throttling
	 */
	isThrottling() {
		this._refillTokens();
		return this.tokens < 1 || this.queue.length > 0;
	}
}

/**
 * Create a rate limiter with preset configurations
 * 
 * @param {string} preset - Preset name ('strict', 'moderate', 'relaxed')
 * @returns {RateLimiter} Configured rate limiter
 * 
 * @example
 * const limiter = createRateLimiter('moderate');
 */
export function createRateLimiter(preset = 'moderate') {
	const presets = {
		strict: { maxRequests: 30, windowMs: 60000 },    // 30 req/min
		moderate: { maxRequests: 60, windowMs: 60000 },  // 60 req/min
		relaxed: { maxRequests: 120, windowMs: 60000 },  // 120 req/min
	};

	const config = presets[preset];
	if (!config) {
		throw new Error(`Unknown preset: ${preset}. Available: ${Object.keys(presets).join(', ')}`);
	}

	return new RateLimiter(config.maxRequests, config.windowMs);
}
