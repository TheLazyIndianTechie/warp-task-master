# Itch.io Authentication Module

> Comprehensive authentication handling for itch.io API with support for API keys, OAuth2, and JWT tokens.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Authentication Methods](#authentication-methods)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Error Handling](#error-handling)
- [Security Best Practices](#security-best-practices)

---

## Features

- ✅ **Multiple Auth Methods**: API Keys, OAuth2, JWT tokens
- ✅ **Token Management**: Auto-saving, loading, and rotation
- ✅ **Scope Validation**: Check and validate API scopes
- ✅ **Token Expiry**: Automatic expiry checking for JWT tokens
- ✅ **OAuth2 Helper**: Complete OAuth flow implementation
- ✅ **Error Handling**: Comprehensive error messages and recovery
- ✅ **Persistent Storage**: Secure token storage in user home directory
- ✅ **Type Safety**: Full JSDoc annotations for IDE support

---

## Installation

The module is included in the main project. No additional installation required.

```javascript
import { ItchioAuth, ItchioOAuthHelper, AuthType } from './auth.js';
```

---

## Quick Start

### Using API Key (Recommended)

```javascript
import { ItchioAuth, AuthType } from './auth.js';

// Method 1: Using environment variable
process.env.ITCHIO_API_KEY = 'your_api_key_here';
const auth = new ItchioAuth({ type: AuthType.API_KEY });

// Method 2: Direct instantiation
const auth = new ItchioAuth({
	apiKey: 'your_api_key_here',
	type: AuthType.API_KEY,
});

// Initialize and validate
await auth.initialize();

// Get authentication headers for requests
const headers = auth.getAuthHeaders();

// Build authenticated URL
const url = auth.getAuthenticatedUrl('me');
```

### Using Factory Functions

```javascript
import { createAuthFromEnv } from './auth.js';

// Reads from environment variables (ITCHIO_API_KEY, ITCHIO_OAUTH_TOKEN, or ITCHIO_JWT_TOKEN)
const auth = createAuthFromEnv();
await auth.initialize();
```

---

## Authentication Methods

### 1. API Key Authentication

API keys are the simplest and most common authentication method.

**Getting an API Key:**
1. Go to [https://itch.io/api-keys](https://itch.io/api-keys)
2. Generate a new API key
3. Store it securely in environment variables

**Usage:**

```javascript
const auth = new ItchioAuth({
	apiKey: 'your_api_key',
	type: AuthType.API_KEY,
});

await auth.initialize();
```

**Environment Variable:**
```bash
export ITCHIO_API_KEY="your_api_key_here"
```

---

### 2. OAuth2 Authentication

For applications acting on behalf of users.

**Step 1: Register OAuth Application**
1. Go to [https://itch.io/user/settings/oauth-apps](https://itch.io/user/settings/oauth-apps)
2. Create a new OAuth application
3. Note your Client ID and Redirect URI

**Step 2: Generate Authorization URL**

```javascript
import { ItchioOAuthHelper, OAuthScopes } from './auth.js';

const oauthHelper = new ItchioOAuthHelper({
	clientId: 'your_client_id',
	redirectUri: 'https://your-app.com/oauth/callback',
	scopes: [OAuthScopes.PROFILE_ME],
});

// Generate state for CSRF protection
const state = crypto.randomBytes(32).toString('hex');

// Get authorization URL
const authUrl = oauthHelper.getAuthorizationUrl(state);

// Redirect user to authUrl
console.log('Authorize at:', authUrl);
```

**Step 3: Handle OAuth Callback**

```javascript
// In your OAuth callback handler
function handleOAuthCallback(req, res) {
	const { hash, state } = req.query;

	// Validate state
	if (!oauthHelper.validateState(state, expectedState)) {
		throw new Error('Invalid state parameter');
	}

	// Extract access token
	const { accessToken } = oauthHelper.parseCallbackHash(hash);

	// Create auth instance
	const auth = oauthHelper.createAuthFromToken(accessToken);
	await auth.initialize();
	await auth.saveTokens(); // Save for future use

	return auth;
}
```

**Available Scopes:**
- `profile:me` - Access to user's public profile
- `profile:games` - Access to user's game data
- `game:view:purchases` - Access to view game purchases

---

### 3. JWT Token Authentication

For games integrated with itch.io app via app manifest.

```javascript
const auth = new ItchioAuth({
	jwtToken: 'jwt_token_from_manifest',
	type: AuthType.JWT,
});

await auth.initialize();

// Check expiry
if (auth.isTokenExpired()) {
	console.warn('JWT token has expired');
}
```

---

## API Reference

### ItchioAuth Class

#### Constructor

```javascript
new ItchioAuth(options)
```

**Options:**
- `apiKey` (string): API key for authentication
- `oauthToken` (string): OAuth access token
- `jwtToken` (string): JWT token
- `type` (string): Authentication type (default: 'api_key')
- `autoRefresh` (boolean): Auto-refresh OAuth tokens (default: true)
- `baseUrl` (string): API base URL (default: 'https://itch.io/api/1')

#### Methods

##### `async initialize()`

Initialize and validate authentication credentials.

**Returns:** `Promise<boolean>` - True if authentication is valid

**Throws:** Error if credentials are invalid

```javascript
const auth = new ItchioAuth({ apiKey: 'key' });
await auth.initialize();
```

##### `getAuthHeaders()`

Get authentication headers for API requests.

**Returns:** `Object` - Headers with Authorization

```javascript
const headers = auth.getAuthHeaders();
// { 'Authorization': 'Bearer key', 'Content-Type': 'application/json', ... }
```

##### `getAuthenticatedUrl(endpoint)`

Build authenticated URL for API requests.

**Parameters:**
- `endpoint` (string): API endpoint without `/api/1/` prefix

**Returns:** `string` - Full authenticated URL

```javascript
const url = auth.getAuthenticatedUrl('me');
// https://itch.io/api/1/key/me
```

##### `async getCredentialsInfo()`

Fetch credentials information from API.

**Returns:** `Promise<Object>` - Credentials info including scopes and expiration

```javascript
const info = await auth.getCredentialsInfo();
console.log(info.scopes); // ['profile:me', 'profile:games']
```

##### `isTokenExpired()`

Check if current token is expired.

**Returns:** `boolean`

```javascript
if (auth.isTokenExpired()) {
	console.log('Token expired, need to refresh');
}
```

##### `hasScope(scope)`

Check if credentials have a specific scope.

**Parameters:**
- `scope` (string): Scope to check

**Returns:** `boolean`

```javascript
if (auth.hasScope('profile:me')) {
	console.log('Can access user profile');
}
```

##### `hasAllScopes(requiredScopes)`

Check if credentials have all required scopes.

**Parameters:**
- `requiredScopes` (string[]): Array of required scopes

**Returns:** `boolean`

```javascript
if (auth.hasAllScopes(['profile:me', 'profile:games'])) {
	console.log('Can access profile and games');
}
```

##### `async saveTokens()`

Save current tokens to disk for persistence.

**Returns:** `Promise<void>`

```javascript
await auth.saveTokens();
```

##### `async clearTokens()`

Clear all saved tokens.

**Returns:** `Promise<void>`

```javascript
await auth.clearTokens();
```

##### `async rotateApiKey(newApiKey)`

Rotate API key (requires generating a new key on itch.io).

**Parameters:**
- `newApiKey` (string): New API key

**Returns:** `Promise<boolean>` - True if rotation successful

```javascript
await auth.rotateApiKey('new_api_key_here');
```

##### `getAuthState()`

Get authentication state summary.

**Returns:** `Object` - Current authentication state

```javascript
const state = auth.getAuthState();
console.log(state);
// {
//   type: 'api_key',
//   isAuthenticated: true,
//   isExpired: false,
//   scopes: ['profile:me'],
//   tokenExpiry: null
// }
```

---

### ItchioOAuthHelper Class

#### Constructor

```javascript
new ItchioOAuthHelper(options)
```

**Options:**
- `clientId` (string, required): OAuth application client ID
- `redirectUri` (string, required): OAuth redirect URI
- `scopes` (string[]): Requested scopes (default: `['profile:me']`)
- `baseUrl` (string): itch.io base URL (default: 'https://itch.io')

#### Methods

##### `getAuthorizationUrl(state)`

Generate authorization URL for OAuth flow.

**Parameters:**
- `state` (string, optional): State parameter for CSRF protection (auto-generated if not provided)

**Returns:** `string` - Authorization URL

```javascript
const url = oauthHelper.getAuthorizationUrl();
// https://itch.io/user/oauth?client_id=...&scope=profile:me&...
```

##### `validateState(receivedState, expectedState)`

Validate OAuth state parameter.

**Parameters:**
- `receivedState` (string): State from OAuth callback
- `expectedState` (string): Expected state value

**Returns:** `boolean`

```javascript
const isValid = oauthHelper.validateState(callbackState, expectedState);
```

##### `parseCallbackHash(hash)`

Extract access token from OAuth callback URL hash.

**Parameters:**
- `hash` (string): URL hash from OAuth callback

**Returns:** `Object` - Parsed OAuth response

```javascript
const { accessToken, state } = oauthHelper.parseCallbackHash('#access_token=xxx&state=yyy');
```

##### `createAuthFromToken(accessToken)`

Create ItchioAuth instance from OAuth token.

**Parameters:**
- `accessToken` (string): OAuth access token

**Returns:** `ItchioAuth`

```javascript
const auth = oauthHelper.createAuthFromToken('access_token_here');
```

---

### Factory Functions

##### `createAuthFromEnv()`

Create auth instance from environment variables.

**Environment Variables:**
- `ITCHIO_API_KEY`
- `ITCHIO_OAUTH_TOKEN`
- `ITCHIO_JWT_TOKEN`

**Returns:** `ItchioAuth`

```javascript
const auth = createAuthFromEnv();
```

##### `async createAuthFromConfig(configPath)`

Create auth instance from configuration file.

**Parameters:**
- `configPath` (string): Path to configuration file

**Returns:** `Promise<ItchioAuth>`

```javascript
const auth = await createAuthFromConfig('./auth.config.json');
```

---

## Examples

### Complete API Request Example

```javascript
import { ItchioAuth, AuthType } from './auth.js';

async function getUserGames() {
	// Initialize auth
	const auth = new ItchioAuth({
		apiKey: process.env.ITCHIO_API_KEY,
		type: AuthType.API_KEY,
	});

	await auth.initialize();

	// Build URL and headers
	const url = auth.getAuthenticatedUrl('my-games');
	const headers = auth.getAuthHeaders();

	// Make API request
	const response = await fetch(url, { headers });
	const data = await response.json();

	if (data.errors) {
		throw new Error(`API Error: ${data.errors.join(', ')}`);
	}

	return data.games;
}

const games = await getUserGames();
console.log(`Found ${games.length} games`);
```

### OAuth Flow Example

```javascript
import express from 'express';
import { ItchioOAuthHelper, OAuthScopes } from './auth.js';

const app = express();
const states = new Map(); // Store states (use Redis in production)

// Step 1: Initiate OAuth
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

		res.send('Authentication successful!');
	} catch (error) {
		res.status(500).send(`Error: ${error.message}`);
	}
});

app.listen(3000);
```

### Token Persistence Example

```javascript
import { ItchioAuth, createAuthFromEnv } from './auth.js';

async function getOrCreateAuth() {
	let auth;

	try {
		// Try to create from environment
		auth = createAuthFromEnv();
		await auth.initialize();
		console.log('Loaded auth from environment');
	} catch (error) {
		// Try to load saved tokens
		auth = new ItchioAuth();
		await auth.initialize();
		console.log('Loaded auth from saved tokens');
	}

	// Save for next time
	await auth.saveTokens();

	return auth;
}

const auth = await getOrCreateAuth();
```

---

## Error Handling

The module throws descriptive errors that should be caught and handled:

```javascript
try {
	const auth = new ItchioAuth({ apiKey: 'invalid_key' });
	await auth.initialize();
} catch (error) {
	if (error.message.includes('Failed to validate credentials')) {
		console.error('Invalid API key');
	} else if (error.message.includes('No valid credentials')) {
		console.error('Missing credentials');
	} else {
		console.error('Unknown error:', error.message);
	}
}
```

**Common Errors:**
- `No valid credentials found` - No API key, OAuth token, or JWT provided
- `Failed to validate credentials` - Credentials are invalid or expired
- `HTTP 401` - Authentication failed
- `HTTP 403` - Insufficient permissions/scopes
- `API Error: invalid download key` - Invalid resource access

---

## Security Best Practices

### 1. Environment Variables

Store credentials in environment variables, not in code:

```bash
# .env file (add to .gitignore!)
ITCHIO_API_KEY=your_api_key_here
```

### 2. OAuth State Parameter

Always use the state parameter to prevent CSRF attacks:

```javascript
const state = crypto.randomBytes(32).toString('hex');
const authUrl = oauthHelper.getAuthorizationUrl(state);
// Store state and validate on callback
```

### 3. HTTPS Only

Use HTTPS for OAuth redirect URIs:

```javascript
// ❌ Bad
redirectUri: 'http://example.com/callback'

// ✅ Good
redirectUri: 'https://example.com/callback'
```

### 4. Scope Minimization

Only request scopes you actually need:

```javascript
// ❌ Bad - requesting all scopes
scopes: ['profile:me', 'profile:games', 'game:view:purchases']

// ✅ Good - only what's needed
scopes: ['profile:me']
```

### 5. Token Rotation

Regularly rotate API keys:

```javascript
// Generate new key on itch.io, then:
await auth.rotateApiKey(newApiKey);
```

### 6. Token Storage

Tokens are stored in `~/.itchio-auth/tokens.json` with restricted permissions. Never commit this file to version control.

---

## Configuration File

Create a configuration file for complex setups:

```json
{
  "auth": {
    "type": "api_key",
    "apiKey": "your_api_key_here",
    "baseUrl": "https://itch.io/api/1"
  }
}
```

Load it:

```javascript
const auth = await createAuthFromConfig('./auth.config.json');
```

See `auth.config.example.json` for a complete example.

---

## Testing

### Manual Testing

```javascript
// Test API key
const auth = new ItchioAuth({ apiKey: 'test_key' });
await auth.initialize();
console.log(auth.getAuthState());

// Test OAuth flow
const oauthHelper = new ItchioOAuthHelper({
	clientId: 'test_client',
	redirectUri: 'http://localhost:3000/callback',
});
console.log(oauthHelper.getAuthorizationUrl());
```

### Unit Tests

Unit tests should be added to verify:
- Token validation
- URL construction
- Scope checking
- Error handling
- Token persistence

---

## Troubleshooting

### Issue: "No valid credentials found"

**Solution:** Ensure you've set `ITCHIO_API_KEY` environment variable or passed credentials to constructor.

### Issue: "Failed to validate credentials: HTTP 401"

**Solution:** Your API key is invalid. Generate a new one at https://itch.io/api-keys

### Issue: OAuth callback not working

**Solution:** 
1. Verify redirect URI matches exactly in OAuth app settings
2. Ensure you're handling the hash portion of the callback URL
3. Check that state parameter is being validated correctly

### Issue: Token file not saving

**Solution:** Check file permissions for `~/.itchio-auth/` directory.

---

## Additional Resources

- [Itch.io API Documentation](../../ITCHIO_API_DOCUMENTATION.md)
- [Server-side API Reference](https://itch.io/docs/api/serverside)
- [OAuth Applications Guide](https://itch.io/docs/api/oauth)
- [API Keys Management](https://itch.io/api-keys)

---

## License

This module is part of the Task Master project. See the main project LICENSE file.

---

## Contributing

Improvements and bug fixes are welcome! Please ensure:
- Code follows existing patterns
- JSDoc comments are complete
- Security best practices are maintained
- Examples are updated as needed
