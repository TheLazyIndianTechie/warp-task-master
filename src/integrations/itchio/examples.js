/**
 * Itch.io Authentication Module - Usage Examples
 * 
 * This file demonstrates common usage patterns for the itch.io authentication module.
 * These examples can be copied and adapted for your own use cases.
 */

import { ItchioAuth, ItchioOAuthHelper, AuthType, OAuthScopes, createAuthFromEnv } from './auth.js';
import crypto from 'node:crypto';

// =============================================================================
// EXAMPLE 1: Simple API Key Authentication
// =============================================================================

export async function example1_simpleApiKey() {
	console.log('\n=== Example 1: Simple API Key Authentication ===\n');

	// Create auth instance with API key
	const auth = new ItchioAuth({
		apiKey: process.env.ITCHIO_API_KEY,
		type: AuthType.API_KEY,
	});

	// Initialize and validate
	await auth.initialize();

	// Check authentication state
	const state = auth.getAuthState();
	console.log('Authentication State:', state);

	// Make an API request
	const url = auth.getAuthenticatedUrl('me');
	const headers = auth.getAuthHeaders();
	
	const response = await fetch(url, { headers });
	const data = await response.json();
	
	console.log('User Profile:', data.user);
}

// =============================================================================
// EXAMPLE 2: Using Environment Variables
// =============================================================================

export async function example2_environmentVariables() {
	console.log('\n=== Example 2: Using Environment Variables ===\n');

	// Automatically detects ITCHIO_API_KEY, ITCHIO_OAUTH_TOKEN, or ITCHIO_JWT_TOKEN
	const auth = createAuthFromEnv();
	await auth.initialize();

	console.log('Auth Type:', auth.type);
	console.log('Is Authenticated:', auth.getAuthState().isAuthenticated);
}

// =============================================================================
// EXAMPLE 3: Token Persistence
// =============================================================================

export async function example3_tokenPersistence() {
	console.log('\n=== Example 3: Token Persistence ===\n');

	// Create auth instance
	const auth = new ItchioAuth({
		apiKey: process.env.ITCHIO_API_KEY,
		type: AuthType.API_KEY,
	});

	await auth.initialize();

	// Save tokens to disk for next session
	await auth.saveTokens();
	console.log('Tokens saved to ~/.itchio-auth/tokens.json');

	// In a new session, load saved tokens
	const authFromSaved = new ItchioAuth();
	await authFromSaved.initialize();
	console.log('Tokens loaded from disk');

	// Clear tokens if needed
	// await authFromSaved.clearTokens();
}

// =============================================================================
// EXAMPLE 4: Scope Validation
// =============================================================================

export async function example4_scopeValidation() {
	console.log('\n=== Example 4: Scope Validation ===\n');

	const auth = createAuthFromEnv();
	await auth.initialize();

	// Check single scope
	if (auth.hasScope('profile:me')) {
		console.log('✓ Can access user profile');
	}

	// Check multiple scopes
	const requiredScopes = ['profile:me', 'profile:games'];
	if (auth.hasAllScopes(requiredScopes)) {
		console.log('✓ Can access profile and games');
	} else {
		console.log('✗ Missing required scopes');
	}

	// Get credentials info from API
	const info = await auth.getCredentialsInfo();
	console.log('Available scopes:', info.scopes);
}

// =============================================================================
// EXAMPLE 5: Fetching User's Games
// =============================================================================

export async function example5_fetchUserGames() {
	console.log('\n=== Example 5: Fetching User Games ===\n');

	const auth = createAuthFromEnv();
	await auth.initialize();

	// Check scope before making request
	if (!auth.hasScope('profile:games')) {
		throw new Error('Missing profile:games scope');
	}

	const url = auth.getAuthenticatedUrl('my-games');
	const headers = auth.getAuthHeaders();

	const response = await fetch(url, { headers });
	const data = await response.json();

	if (data.errors) {
		throw new Error(`API Error: ${data.errors.join(', ')}`);
	}

	console.log(`Found ${data.games.length} games:`);
	for (const game of data.games) {
		console.log(`  - ${game.title} (ID: ${game.id})`);
	}

	return data.games;
}

// =============================================================================
// EXAMPLE 6: Error Handling
// =============================================================================

export async function example6_errorHandling() {
	console.log('\n=== Example 6: Error Handling ===\n');

	try {
		// Try to create auth with invalid credentials
		const auth = new ItchioAuth({
			apiKey: 'invalid_key',
			type: AuthType.API_KEY,
		});

		await auth.initialize();
	} catch (error) {
		if (error.message.includes('Failed to validate credentials')) {
			console.error('❌ Invalid API key');
		} else if (error.message.includes('No valid credentials')) {
			console.error('❌ Missing credentials');
		} else {
			console.error('❌ Unknown error:', error.message);
		}
	}

	// Graceful error handling with recovery
	try {
		const auth = createAuthFromEnv();
		await auth.initialize();
	} catch (error) {
		console.error('Failed to load auth:', error.message);
		
		// Fallback: try to create new auth
		console.log('Attempting to create new authentication...');
		const newAuth = new ItchioAuth({
			apiKey: process.env.ITCHIO_API_KEY,
			type: AuthType.API_KEY,
		});
		await newAuth.initialize();
		await newAuth.saveTokens();
		console.log('✓ New authentication created and saved');
	}
}

// =============================================================================
// EXAMPLE 7: API Key Rotation
// =============================================================================

export async function example7_apiKeyRotation() {
	console.log('\n=== Example 7: API Key Rotation ===\n');

	const auth = createAuthFromEnv();
	await auth.initialize();

	// Generate a new API key on itch.io website
	const newApiKey = process.env.ITCHIO_NEW_API_KEY;

	if (newApiKey) {
		console.log('Rotating API key...');
		await auth.rotateApiKey(newApiKey);
		await auth.saveTokens();
		console.log('✓ API key rotated and saved');
	} else {
		console.log('ℹ Set ITCHIO_NEW_API_KEY to test rotation');
	}
}

// =============================================================================
// EXAMPLE 8: OAuth Flow Setup (Server-side)
// =============================================================================

export function example8_oauthSetup() {
	console.log('\n=== Example 8: OAuth Flow Setup ===\n');

	// Initialize OAuth helper
	const oauthHelper = new ItchioOAuthHelper({
		clientId: process.env.ITCHIO_CLIENT_ID,
		redirectUri: 'https://your-app.com/oauth/callback',
		scopes: [OAuthScopes.PROFILE_ME, OAuthScopes.PROFILE_GAMES],
	});

	// Generate state for CSRF protection
	const state = crypto.randomBytes(32).toString('hex');

	// Get authorization URL
	const authUrl = oauthHelper.getAuthorizationUrl(state);

	console.log('OAuth Configuration:');
	console.log('  Client ID:', process.env.ITCHIO_CLIENT_ID || '(not set)');
	console.log('  Redirect URI: https://your-app.com/oauth/callback');
	console.log('  Scopes:', [OAuthScopes.PROFILE_ME, OAuthScopes.PROFILE_GAMES]);
	console.log('\nAuthorization URL:', authUrl);
	console.log('\nState (save this):', state);

	return { oauthHelper, state };
}

// =============================================================================
// EXAMPLE 9: OAuth Callback Handler
// =============================================================================

export async function example9_oauthCallback(callbackHash, expectedState) {
	console.log('\n=== Example 9: OAuth Callback Handler ===\n');

	const oauthHelper = new ItchioOAuthHelper({
		clientId: process.env.ITCHIO_CLIENT_ID,
		redirectUri: 'https://your-app.com/oauth/callback',
	});

	// Validate state parameter (CSRF protection)
	const { state: receivedState } = oauthHelper.parseCallbackHash(callbackHash);
	if (!oauthHelper.validateState(receivedState, expectedState)) {
		throw new Error('Invalid state parameter - possible CSRF attack');
	}

	// Extract access token
	const { accessToken } = oauthHelper.parseCallbackHash(callbackHash);

	// Create auth instance
	const auth = oauthHelper.createAuthFromToken(accessToken);
	await auth.initialize();

	// Save for future sessions
	await auth.saveTokens();

	console.log('✓ OAuth authentication successful');
	console.log('User scopes:', auth.scopes);

	return auth;
}

// =============================================================================
// EXAMPLE 10: Complete OAuth Flow (Express.js)
// =============================================================================

export function example10_expressOAuthFlow() {
	console.log('\n=== Example 10: Complete OAuth Flow (Express.js) ===\n');

	const code = `
import express from 'express';
import { ItchioOAuthHelper, OAuthScopes } from './auth.js';

const app = express();
const states = new Map();

// Step 1: Initiate OAuth flow
app.get('/auth/itchio', (req, res) => {
  const oauthHelper = new ItchioOAuthHelper({
    clientId: process.env.ITCHIO_CLIENT_ID,
    redirectUri: 'http://localhost:3000/auth/itchio/callback',
    scopes: [OAuthScopes.PROFILE_ME, OAuthScopes.PROFILE_GAMES],
  });

  const state = crypto.randomBytes(32).toString('hex');
  states.set(state, Date.now());

  const authUrl = oauthHelper.getAuthorizationUrl(state);
  res.redirect(authUrl);
});

// Step 2: Handle callback
app.get('/auth/itchio/callback', async (req, res) => {
  const { state } = req.query;
  const hash = req.url.split('#')[1];

  // Validate state
  if (!states.has(state)) {
    return res.status(400).send('Invalid state');
  }
  states.delete(state);

  const oauthHelper = new ItchioOAuthHelper({
    clientId: process.env.ITCHIO_CLIENT_ID,
    redirectUri: 'http://localhost:3000/auth/itchio/callback',
  });

  try {
    const { accessToken } = oauthHelper.parseCallbackHash(hash);
    const auth = oauthHelper.createAuthFromToken(accessToken);
    await auth.initialize();
    await auth.saveTokens();

    // Store auth in session
    req.session.auth = auth;

    res.send('Authentication successful!');
  } catch (error) {
    res.status(500).send(\`Error: \${error.message}\`);
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
  console.log('Visit http://localhost:3000/auth/itchio to start OAuth flow');
});
`;

	console.log(code);
}

// =============================================================================
// EXAMPLE 11: JWT Token Authentication
// =============================================================================

export async function example11_jwtAuthentication() {
	console.log('\n=== Example 11: JWT Token Authentication ===\n');

	// JWT tokens are typically provided by the itch.io app via app manifest
	const jwtToken = process.env.ITCHIO_JWT_TOKEN;

	if (!jwtToken) {
		console.log('ℹ Set ITCHIO_JWT_TOKEN to test JWT authentication');
		return;
	}

	const auth = new ItchioAuth({
		jwtToken,
		type: AuthType.JWT,
	});

	await auth.initialize();

	// Check expiry
	if (auth.isTokenExpired()) {
		console.warn('⚠ JWT token has expired');
	} else {
		console.log('✓ JWT token is valid');
		console.log('Expires:', auth.tokenExpiry);
	}
}

// =============================================================================
// EXAMPLE 12: Game Purchase Verification
// =============================================================================

export async function example12_verifyPurchase(gameId, downloadKey) {
	console.log('\n=== Example 12: Verify Game Purchase ===\n');

	const auth = createAuthFromEnv();
	await auth.initialize();

	// Check scope
	if (!auth.hasScope('game:view:purchases')) {
		throw new Error('Missing game:view:purchases scope');
	}

	// Verify download key
	const url = auth.getAuthenticatedUrl(`game/${gameId}/download_keys/${downloadKey}`);
	const headers = auth.getAuthHeaders();

	const response = await fetch(url, { headers });
	const data = await response.json();

	if (data.errors) {
		console.log('❌ Invalid download key');
		return false;
	}

	console.log('✓ Valid download key');
	console.log('Owner:', data.download_key.owner);
	console.log('Created:', data.download_key.created_at);
	return true;
}

// =============================================================================
// EXAMPLE 13: Batch Operations
// =============================================================================

export async function example13_batchOperations() {
	console.log('\n=== Example 13: Batch Operations ===\n');

	const auth = createAuthFromEnv();
	await auth.initialize();

	// Fetch multiple resources in parallel
	const [profile, games, credentials] = await Promise.all([
		fetch(auth.getAuthenticatedUrl('me'), { headers: auth.getAuthHeaders() }).then(r => r.json()),
		fetch(auth.getAuthenticatedUrl('my-games'), { headers: auth.getAuthHeaders() }).then(r => r.json()),
		auth.getCredentialsInfo(),
	]);

	console.log('User:', profile.user.username);
	console.log('Games:', games.games.length);
	console.log('Scopes:', credentials.scopes);
}

// =============================================================================
// EXAMPLE 14: Configuration-based Setup
// =============================================================================

export async function example14_configurationBased() {
	console.log('\n=== Example 14: Configuration-based Setup ===\n');

	const configPath = './auth.config.json';

	try {
		const auth = await createAuthFromConfig(configPath);
		await auth.initialize();
		console.log('✓ Loaded auth from configuration file');
		console.log('Type:', auth.type);
	} catch (error) {
		console.log('ℹ No configuration file found. Use auth.config.example.json as template.');
	}
}

// =============================================================================
// EXAMPLE 15: Retry Logic with Backoff
// =============================================================================

export async function example15_retryLogic() {
	console.log('\n=== Example 15: Retry Logic with Backoff ===\n');

	const auth = createAuthFromEnv();
	await auth.initialize();

	async function fetchWithRetry(url, options, maxRetries = 3) {
		for (let i = 0; i < maxRetries; i++) {
			try {
				const response = await fetch(url, options);
				
				if (response.status === 429) {
					// Rate limited - wait and retry
					const waitTime = Math.pow(2, i) * 1000; // Exponential backoff
					console.log(`Rate limited. Waiting ${waitTime}ms before retry ${i + 1}/${maxRetries}`);
					await new Promise(resolve => setTimeout(resolve, waitTime));
					continue;
				}

				if (!response.ok) {
					throw new Error(`HTTP ${response.status}`);
				}

				return await response.json();
			} catch (error) {
				if (i === maxRetries - 1) throw error;
				console.log(`Request failed. Retrying ${i + 1}/${maxRetries}...`);
			}
		}
	}

	const url = auth.getAuthenticatedUrl('me');
	const headers = auth.getAuthHeaders();
	const data = await fetchWithRetry(url, { headers });
	
	console.log('✓ Request successful:', data.user.username);
}

// =============================================================================
// Run Examples
// =============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
	console.log('='.repeat(70));
	console.log('Itch.io Authentication Module - Usage Examples');
	console.log('='.repeat(70));

	// Run all examples (comment out ones you don't want to run)
	try {
		// await example1_simpleApiKey();
		// await example2_environmentVariables();
		// await example3_tokenPersistence();
		// await example4_scopeValidation();
		// await example5_fetchUserGames();
		// await example6_errorHandling();
		// await example7_apiKeyRotation();
		// example8_oauthSetup();
		// example10_expressOAuthFlow();
		// await example11_jwtAuthentication();
		// await example13_batchOperations();
		// await example14_configurationBased();
		// await example15_retryLogic();

		console.log('\n' + '='.repeat(70));
		console.log('Examples completed! Uncomment the ones you want to run.');
		console.log('='.repeat(70));
	} catch (error) {
		console.error('\nError running examples:', error.message);
		process.exit(1);
	}
}
