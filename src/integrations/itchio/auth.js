/**
 * @fileoverview Itch.io API Authentication Module
 * @description Handles authentication for itch.io API using API keys and OAuth2 flows
 * @see {@link https://itch.io/docs/api/serverside} for API documentation
 */

import crypto from 'node:crypto';
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

/**
 * Authentication types supported by the module
 */
export const AuthType = {
	API_KEY: 'api_key',
	OAUTH: 'oauth',
	JWT: 'jwt',
};

/**
 * OAuth scopes available for itch.io API
 */
export const OAuthScopes = {
	PROFILE_ME: 'profile:me',
	PROFILE_GAMES: 'profile:games',
	GAME_VIEW_PURCHASES: 'game:view:purchases',
};

/**
 * Configuration directory for storing auth tokens and settings
 */
const CONFIG_DIR = join(homedir(), '.itchio-auth');
const TOKEN_FILE = join(CONFIG_DIR, 'tokens.json');

/**
 * @class ItchioAuth
 * @description Main authentication class for itch.io API
 */
export class ItchioAuth {
	/**
	 * @param {Object} options - Authentication options
	 * @param {string} [options.apiKey] - API key for authentication
	 * @param {string} [options.oauthToken] - OAuth access token
	 * @param {string} [options.jwtToken] - JWT token
	 * @param {string} [options.type='api_key'] - Authentication type
	 * @param {boolean} [options.autoRefresh=true] - Auto-refresh OAuth tokens
	 * @param {string} [options.baseUrl='https://itch.io/api/1'] - API base URL
	 */
	constructor(options = {}) {
		this.apiKey = options.apiKey || process.env.ITCHIO_API_KEY;
		this.oauthToken = options.oauthToken;
		this.jwtToken = options.jwtToken;
		this.type = options.type || AuthType.API_KEY;
		this.autoRefresh = options.autoRefresh !== false;
		this.baseUrl = options.baseUrl || 'https://itch.io/api/1';
		this.tokenExpiry = null;
		this.scopes = [];
	}

	/**
	 * Initialize authentication and validate credentials
	 * @returns {Promise<boolean>} True if authentication is valid
	 * @throws {Error} If credentials are invalid or missing
	 */
	async initialize() {
		// Try to load saved tokens
		await this._loadTokens();

		// Validate credentials
		if (!this._hasValidCredentials()) {
			throw new Error(
				'No valid credentials found. Please provide an API key, OAuth token, or JWT token.'
			);
		}

		// Validate credentials with API
		try {
			const info = await this.getCredentialsInfo();
			this.scopes = info.scopes || [];
			if (info.expires_at) {
				this.tokenExpiry = new Date(info.expires_at);
			}
			return true;
		} catch (error) {
			throw new Error(`Failed to validate credentials: ${error.message}`);
		}
	}

	/**
	 * Check if we have valid credentials
	 * @private
	 * @returns {boolean}
	 */
	_hasValidCredentials() {
		switch (this.type) {
			case AuthType.API_KEY:
				return !!this.apiKey;
			case AuthType.OAUTH:
				return !!this.oauthToken;
			case AuthType.JWT:
				return !!this.jwtToken;
			default:
				return false;
		}
	}

	/**
	 * Get authentication headers for API requests
	 * @returns {Object} Headers object with authentication
	 */
	getAuthHeaders() {
		const headers = {
			'Content-Type': 'application/json',
			'User-Agent': 'itchio-auth-module/1.0.0',
		};

		switch (this.type) {
			case AuthType.API_KEY:
				if (this.apiKey) {
					headers['Authorization'] = `Bearer ${this.apiKey}`;
				}
				break;
			case AuthType.OAUTH:
				if (this.oauthToken) {
					headers['Authorization'] = `Bearer ${this.oauthToken}`;
				}
				break;
			case AuthType.JWT:
				if (this.jwtToken) {
					headers['Authorization'] = `Bearer ${this.jwtToken}`;
				}
				break;
		}

		return headers;
	}

	/**
	 * Build authenticated URL for API requests
	 * @param {string} endpoint - API endpoint (without /api/1/ prefix)
	 * @returns {string} Full authenticated URL
	 */
	getAuthenticatedUrl(endpoint) {
		// Remove leading slash if present
		endpoint = endpoint.replace(/^\//, '');

		const authSegment = this._getAuthSegment();
		return `${this.baseUrl}/${authSegment}/${endpoint}`;
	}

	/**
	 * Get the appropriate auth segment for URL construction
	 * @private
	 * @returns {string}
	 */
	_getAuthSegment() {
		switch (this.type) {
			case AuthType.API_KEY:
				return 'key';
			case AuthType.OAUTH:
				return 'key'; // OAuth tokens use the same endpoint as API keys
			case AuthType.JWT:
				return 'jwt';
			default:
				return 'key';
		}
	}

	/**
	 * Fetch credentials information from API
	 * @returns {Promise<Object>} Credentials info including scopes and expiration
	 */
	async getCredentialsInfo() {
		const url = this.getAuthenticatedUrl('credentials/info');
		const response = await fetch(url, {
			method: 'GET',
			headers: this.getAuthHeaders(),
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const data = await response.json();

		if (data.errors) {
			throw new Error(`API Error: ${data.errors.join(', ')}`);
		}

		return data;
	}

	/**
	 * Check if current token is expired
	 * @returns {boolean}
	 */
	isTokenExpired() {
		if (!this.tokenExpiry) {
			return false; // API keys don't expire
		}
		return new Date() >= this.tokenExpiry;
	}

	/**
	 * Check if credentials have a specific scope
	 * @param {string} scope - Scope to check (e.g., 'profile:me')
	 * @returns {boolean}
	 */
	hasScope(scope) {
		return this.scopes.includes(scope);
	}

	/**
	 * Check if credentials have all required scopes
	 * @param {string[]} requiredScopes - Array of required scopes
	 * @returns {boolean}
	 */
	hasAllScopes(requiredScopes) {
		return requiredScopes.every((scope) => this.hasScope(scope));
	}

	/**
	 * Save current tokens to disk for persistence
	 * @returns {Promise<void>}
	 */
	async saveTokens() {
		try {
			await mkdir(CONFIG_DIR, { recursive: true });

			const tokens = {
				type: this.type,
				apiKey: this.apiKey,
				oauthToken: this.oauthToken,
				jwtToken: this.jwtToken,
				tokenExpiry: this.tokenExpiry?.toISOString(),
				scopes: this.scopes,
				savedAt: new Date().toISOString(),
			};

			await writeFile(TOKEN_FILE, JSON.stringify(tokens, null, 2), 'utf8');
		} catch (error) {
			console.warn('Failed to save tokens:', error.message);
		}
	}

	/**
	 * Load saved tokens from disk
	 * @private
	 * @returns {Promise<void>}
	 */
	async _loadTokens() {
		try {
			const data = await readFile(TOKEN_FILE, 'utf8');
			const tokens = JSON.parse(data);

			// Only load if we don't have credentials set
			if (!this._hasValidCredentials()) {
				this.type = tokens.type || AuthType.API_KEY;
				this.apiKey = tokens.apiKey;
				this.oauthToken = tokens.oauthToken;
				this.jwtToken = tokens.jwtToken;
				this.scopes = tokens.scopes || [];
				if (tokens.tokenExpiry) {
					this.tokenExpiry = new Date(tokens.tokenExpiry);
				}
			}
		} catch (error) {
			// It's okay if tokens file doesn't exist
			if (error.code !== 'ENOENT') {
				console.warn('Failed to load tokens:', error.message);
			}
		}
	}

	/**
	 * Clear all saved tokens
	 * @returns {Promise<void>}
	 */
	async clearTokens() {
		this.apiKey = null;
		this.oauthToken = null;
		this.jwtToken = null;
		this.tokenExpiry = null;
		this.scopes = [];

		try {
			await writeFile(TOKEN_FILE, JSON.stringify({}, null, 2), 'utf8');
		} catch (error) {
			console.warn('Failed to clear tokens:', error.message);
		}
	}

	/**
	 * Rotate API key (requires generating a new key on itch.io)
	 * @param {string} newApiKey - New API key
	 * @returns {Promise<boolean>} True if rotation successful
	 */
	async rotateApiKey(newApiKey) {
		const oldKey = this.apiKey;

		try {
			this.apiKey = newApiKey;
			this.type = AuthType.API_KEY;

			// Validate new key
			await this.initialize();
			await this.saveTokens();

			return true;
		} catch (error) {
			// Restore old key if validation fails
			this.apiKey = oldKey;
			throw new Error(`Failed to rotate API key: ${error.message}`);
		}
	}

	/**
	 * Get authentication state summary
	 * @returns {Object} Current authentication state
	 */
	getAuthState() {
		return {
			type: this.type,
			isAuthenticated: this._hasValidCredentials(),
			isExpired: this.isTokenExpired(),
			scopes: this.scopes,
			tokenExpiry: this.tokenExpiry?.toISOString(),
		};
	}
}

/**
 * @class ItchioOAuthHelper
 * @description Helper class for OAuth2 authorization flow
 */
export class ItchioOAuthHelper {
	/**
	 * @param {Object} options - OAuth configuration
	 * @param {string} options.clientId - OAuth application client ID
	 * @param {string} options.redirectUri - OAuth redirect URI
	 * @param {string[]} [options.scopes=['profile:me']] - Requested scopes
	 * @param {string} [options.baseUrl='https://itch.io'] - itch.io base URL
	 */
	constructor(options) {
		if (!options.clientId) {
			throw new Error('clientId is required for OAuth');
		}
		if (!options.redirectUri) {
			throw new Error('redirectUri is required for OAuth');
		}

		this.clientId = options.clientId;
		this.redirectUri = options.redirectUri;
		this.scopes = options.scopes || [OAuthScopes.PROFILE_ME];
		this.baseUrl = options.baseUrl || 'https://itch.io';
	}

	/**
	 * Generate authorization URL for OAuth flow
	 * @param {string} [state] - Optional state parameter for CSRF protection
	 * @returns {string} Authorization URL
	 */
	getAuthorizationUrl(state) {
		const params = new URLSearchParams({
			client_id: this.clientId,
			scope: this.scopes.join(' '),
			redirect_uri: this.redirectUri,
		});

		// Generate state if not provided (for CSRF protection)
		if (!state) {
			state = crypto.randomBytes(32).toString('hex');
		}

		params.append('state', state);

		return `${this.baseUrl}/user/oauth?${params.toString()}`;
	}

	/**
	 * Validate OAuth state parameter
	 * @param {string} receivedState - State from OAuth callback
	 * @param {string} expectedState - Expected state value
	 * @returns {boolean}
	 */
	validateState(receivedState, expectedState) {
		return receivedState === expectedState;
	}

	/**
	 * Extract access token from OAuth callback URL hash
	 * @param {string} hash - URL hash from OAuth callback (e.g., '#access_token=...')
	 * @returns {Object} Parsed OAuth response
	 */
	parseCallbackHash(hash) {
		// Remove leading '#' if present
		const queryString = hash.startsWith('#') ? hash.slice(1) : hash;
		const params = new URLSearchParams(queryString);

		return {
			accessToken: params.get('access_token'),
			state: params.get('state'),
			tokenType: params.get('token_type') || 'bearer',
		};
	}

	/**
	 * Create ItchioAuth instance from OAuth token
	 * @param {string} accessToken - OAuth access token
	 * @returns {ItchioAuth}
	 */
	createAuthFromToken(accessToken) {
		return new ItchioAuth({
			oauthToken: accessToken,
			type: AuthType.OAUTH,
		});
	}
}

/**
 * Factory function to create auth instance from environment
 * @returns {ItchioAuth}
 */
export function createAuthFromEnv() {
	const apiKey = process.env.ITCHIO_API_KEY;
	const oauthToken = process.env.ITCHIO_OAUTH_TOKEN;
	const jwtToken = process.env.ITCHIO_JWT_TOKEN;

	if (apiKey) {
		return new ItchioAuth({ apiKey, type: AuthType.API_KEY });
	}
	if (oauthToken) {
		return new ItchioAuth({ oauthToken, type: AuthType.OAUTH });
	}
	if (jwtToken) {
		return new ItchioAuth({ jwtToken, type: AuthType.JWT });
	}

	throw new Error(
		'No authentication credentials found in environment variables. ' +
			'Please set ITCHIO_API_KEY, ITCHIO_OAUTH_TOKEN, or ITCHIO_JWT_TOKEN.'
	);
}

/**
 * Factory function to create auth instance from configuration file
 * @param {string} configPath - Path to configuration file
 * @returns {Promise<ItchioAuth>}
 */
export async function createAuthFromConfig(configPath) {
	try {
		const data = await readFile(configPath, 'utf8');
		const config = JSON.parse(data);

		return new ItchioAuth(config);
	} catch (error) {
		throw new Error(`Failed to load auth config from ${configPath}: ${error.message}`);
	}
}

export default {
	ItchioAuth,
	ItchioOAuthHelper,
	AuthType,
	OAuthScopes,
	createAuthFromEnv,
	createAuthFromConfig,
};
