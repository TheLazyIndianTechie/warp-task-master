# itch.io API Documentation

> Complete reference guide for itch.io Server-side and OAuth APIs

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
   - [API Keys](#api-keys)
   - [JWT Tokens](#jwt-tokens)
   - [OAuth Applications](#oauth-applications)
3. [API Endpoints](#api-endpoints)
4. [OAuth Flow](#oauth-flow)
5. [Best Practices](#best-practices)
6. [Error Handling](#error-handling)

---

## Overview

The itch.io server-side API allows you to query information about your games by making HTTP requests to API URLs. All endpoints require authentication and return JSON-encoded responses using `snake_case` naming convention.

### Base URL
```
https://itch.io/api/1/
```

### Response Format
- **Encoding**: JSON with `snake_case` keys
- **Error Format**: `{ "errors": ["error message 1", "error message 2"] }`
- **Date Format**: `YYYY-MM-DD HH:MM:ss` (e.g., `2017-10-19 13:35:06`)

---

## Authentication

### API Keys

API keys are long-lasting credentials that can be revoked by users. They provide access to whatever scope they have.

#### Generating API Keys

1. **Personal Keys**: Generate from [API keys page](https://itch.io/api-keys)
   - Requires an itch.io developer account
   - Unscoped - has access to all endpoints

2. **OAuth Keys**: For requests on behalf of other users
   - Register an [OAuth application](https://itch.io/user/settings/oauth-apps)
   - Users grant permissions to your app

#### Using API Keys

**Method 1: Authorization Header (Recommended)**
```http
GET /api/1/key/...
Authorization: Bearer YOUR_API_KEY
```

**Method 2: URL Parameter**
```http
GET /api/1/YOUR_API_KEY/...
```

### JWT Tokens

JWT tokens are short-lived, expiring credentials typically used within games.

#### Using JWT Tokens
```http
GET /api/1/jwt/...
Authorization: Bearer YOUR_JWT_TOKEN
```

JWT tokens can be passed to games when they specify a list of requested API scopes. See the [app manifest documentation](https://itch.io/docs/itch/integrating/api/) for more information.

### Scopes

Credentials have limited scope, giving access to specific endpoints:

- **Scope Hierarchy**: Having access to a scope gives access to all subscopes
  - Example: `profile` gives access to `profile:me`
  - Example: `game:view:purchases` does NOT give access to `game:view`

- **Unscoped Keys**: API keys from [user settings](https://itch.io/api-keys) have access to all endpoints

#### Available Scopes

| Scope | Description |
|-------|-------------|
| `profile:me` | Access to user's public profile data |
| `profile:games` | Access to user's game data |
| `game:view:purchases` | Access to view game purchases and download keys |

---

## API Endpoints

### 1. Credentials Info

**Endpoint**: `GET /api/1/KEY/credentials/info`

**Scope**: None (works with any credentials)

**Description**: Returns information about the credentials used for the API request, including scopes and expiration (for JWT tokens).

**Parameters**: None

**Response - JWT Token**:
```json
{
  "scopes": ["profile:me"],
  "expires_at": "2017-10-19 13:35:06"
}
```

**Response - API Key**:
```json
{
  "scopes": ["profile:me", "profile:games"]
}
```

---

### 2. User Profile

**Endpoint**: `GET /api/1/KEY/me`

**Scope**: `profile:me`

**Description**: Fetches public profile data for the authenticated user.

**Parameters**: None

**Response**:
```json
{
  "user": {
    "id": 29789,
    "username": "fasterthanlime",
    "display_name": "Amos",
    "url": "https://fasterthanlime.itch.io",
    "cover_url": "https://img.itch.zone/aW1hZ2UyL3VzZXIvMjk3ODkvNjkwOTAxLnBuZw==/100x100%23/JkrN%2Bv.png",
    "gamer": true,
    "developer": true,
    "press_user": true
  }
}
```

---

### 3. My Games

**Endpoint**: `GET /api/1/KEY/my-games`

**Scope**: `profile:games`

**Description**: Fetches data about all games you've uploaded or have edit access to.

**Parameters**: None

**Response**:
```json
{
  "games": [
    {
      "id": 3,
      "title": "X-Moon",
      "url": "http://leafo.itch.io/x-moon",
      "cover_url": "http://img.itch.io/aW1hZ2UvMy8xODM3LnBuZw==/315x250%23/y2uYQI.png",
      "short_text": "Humans have been colonizing planets. It's time to stop them!",
      "type": "default",
      "min_price": 0,
      "published": true,
      "published_at": "2013-03-03 23:02:14",
      "created_at": "2013-03-03 23:02:14",
      "views_count": 2682,
      "downloads_count": 109,
      "purchases_count": 4,
      "p_windows": true,
      "p_osx": true,
      "p_linux": true,
      "p_android": false,
      "earnings": [
        {
          "currency": "USD",
          "amount": 5047,
          "amount_formatted": "$50.47"
        }
      ]
    }
  ]
}
```

**Game Object Fields**:
- `id`: Unique game identifier
- `title`: Game title
- `url`: Game page URL
- `cover_url`: Cover image URL
- `type`: Game type (e.g., "default")
- `published`: Boolean indicating if game is published
- `min_price`: Minimum price in cents (0 for free)
- `views_count`: Total page views
- `downloads_count`: Total downloads
- `purchases_count`: Total purchases
- `p_*`: Platform support flags (windows, osx, linux, android)
- `earnings`: Array of earnings by currency

---

### 4. Download Keys

**Endpoint**: `GET /api/1/KEY/game/GAME_ID/download_keys`

**Scope**: `game:view:purchases`

**Description**: Checks if a download key exists for a game and returns it. Useful for verifying that someone has a valid download key to download the game.

**Parameters** (requires ONE of):
- `download_key`: The download key to look up
- `user_id`: The user identifier to look up download keys for
- `email`: The email address to look up download keys for

**URL Example**:
```
/api/1/KEY/game/3/download_keys?download_key=YWKse5jeAeuZ8w3a5qO2b2PId1sChw2B9b637w6z
```

**Success Response**:
```json
{
  "download_key": {
    "id": 124,
    "key": "YWKse5jeAeuZ8w3a5qO2b2PId1sChw2B9b637w6z",
    "game_id": 3,
    "created_at": "2014-02-28 00:25:09",
    "downloads": 74,
    "owner": {
      "id": 1994,
      "username": "fasterthanlime",
      "display_name": "Amos",
      "url": "https://fasterthanlime.itch.io",
      "cover_url": "https://img.itch.io/aW1hZ2UyL3VzZXIvMjk3ODkvMTk4MjkwLnBuZw==/100x100%23/qg3l0J.png",
      "gamer": true,
      "developer": true,
      "press_user": true
    }
  }
}
```

**Error Responses**:

Invalid/revoked key:
```json
{
  "errors": ["invalid download key"]
}
```

No key found for email/user_id:
```json
{
  "errors": ["no download key found"]
}
```

**Notes**:
- Download keys can be extracted from buyer's download URL
  - Example: `http://leafo.itch.io/x-moon/download/YWKse5jeAeuZ8w3a5qO2b2PId1sChw2B9b637w6z`
  - Key: `YWKse5jeAeuZ8w3a5qO2b2PId1sChw2B9b637w6z`
- Using `user_id` is safest with app manifest authentication
- When using `email`, verify the email address first to prevent spoofing

---

### 5. Purchases

**Endpoint**: `GET /api/1/KEY/game/GAME_ID/purchases`

**Scope**: `game:view:purchases`

**Description**: Returns the purchases an email address or user has created for a given game. Only successfully completed purchases are shown.

**Parameters** (requires ONE of):
- `email`: Email address to look up purchases for
- `user_id`: User identifier to look up purchases for

**Important Notes**:
- ⚠️ **Claimed keys do NOT have purchases** - use `/download_keys` endpoint instead
- System is aware of verified linked email addresses
  - If someone has `person@example.com` and linked `person2@example.com`
  - Either email will return their purchases
- You must verify the email address first to prevent fake ownership claims

**Response**:
```json
{
  "purchases": [
    {
      "id": 11561,
      "email": "leaf@example.com",
      "game_id": 3,
      "created_at": "2014-02-28 00:25:09",
      "source": "amazon",
      "currency": "USD",
      "price": "$1.00",
      "sale_rate": 0,
      "donation": false
    }
  ]
}
```

**Purchase Object Fields**:
- `id`: Unique purchase identifier
- `email`: Purchaser's email
- `game_id`: Game identifier
- `source`: Payment source (e.g., "amazon", "paypal")
- `currency`: Currency code
- `price`: Formatted price string
- `sale_rate`: Sale discount rate (0 = no sale)
- `donation`: `true` for purchases without download keys (web games)

---

## OAuth Flow

### Registering an OAuth Application

1. Go to [OAuth application settings](https://itch.io/user/settings/oauth-apps)
2. Create a new application
3. Note your `client_id` and configure your redirect URI

**Best Practices**:
- Create separate OAuth apps for different websites/games
- Keep things organized and tidy

### Authorization Step

Redirect users to:
```
https://itch.io/user/oauth?client_id=CLIENT_ID&scope=SCOPE&redirect_uri=REDIRECT_URI&state=STATE
```

**Required Parameters**:
- `client_id`: Your OAuth application Client ID
- `scope`: Space-separated list of scopes (e.g., `profile:me`)
- `redirect_uri`: Authorization callback URL (must match app settings)

**Optional Parameters**:
- `state`: Security nonce (recommended for CSRF protection)

**Example URL**:
```
https://itch.io/user/oauth?client_id=foobar&scope=profile:me&redirect_uri=https%3A%2F%2Fexample.org%2F
```

### Available OAuth Scopes

Currently only `profile:me` is supported, giving access to the `/me` endpoint. More scopes will be added as the API expands.

### Redirect URI Types

#### 1. Standard HTTPS Redirect
```
https://example.org/oauth/callback?a=b
```

User gets redirected to:
```
https://example.org/oauth/callback?a=b#access_token=YYY&state=ZZZ
```

#### 2. Loopback Address (Desktop Apps)
```
http://127.0.0.1:34567
```

Useful for local HTTP servers in desktop applications.

#### 3. Out-of-Band (Copy/Paste)
```
urn:ietf:wg:oauth:2.0:oob
```

Shows API key on page for user to copy/paste. Best practice for desktop apps:
1. Try to listen on loopback address
2. Fall back to OOB if port unavailable (firewall, port conflict)

### Retrieving Access Token in JavaScript

The access token is in the URL hash (not visible to servers/proxies for security).

```javascript
// Modern browsers / polyfill required
// Remove '#' from hash
var queryString = window.location.hash.slice(1);
var params = new URLSearchParams(queryString);
var accessToken = params.get("access_token");
var state = params.get("state"); // if using state parameter
```

**Browser Compatibility**:
- Recent browsers have native `URLSearchParams` support
- For older browsers, use [url-search-params polyfill](https://github.com/WebReflection/url-search-params)

### Using OAuth Access Tokens

OAuth-generated access tokens are API keys. Use them as described in the [API Keys](#api-keys) section:

```http
GET /api/1/key/me
Authorization: Bearer OAUTH_ACCESS_TOKEN
```

---

## Best Practices

### Security

1. **Request Minimum Scopes**
   - Only request scopes you actually need
   - Be specific: request `profile:me` not all of `profile`
   - You can always request additional scopes later

2. **HTTPS Required**
   - OAuth callback page MUST be served over HTTPS
   - Prevents man-in-the-middle attacks
   - Use [Let's Encrypt](https://letsencrypt.org/) for free SSL certificates

3. **No Third-Party JavaScript**
   - OAuth callback page should not include external JS (social widgets, analytics)
   - If necessary, ensure token extraction runs first
   - Clear `window.location.hash` immediately after extraction

4. **Use State Parameter**
   - Generate nonce on your server
   - Include in authorization URL
   - Verify returned value matches original
   - Prevents CSRF attacks

5. **Email Verification**
   - Always verify email addresses before using them for lookups
   - Prevents users from spoofing ownership

6. **Download Key Security**
   - Use `user_id` parameter with app manifest authentication when possible
   - More secure than email-based lookups
   - Prevents user ID spoofing

### Performance

1. **Parameter Format**
   - `GET` requests: Use query string
   - `POST` requests: Use form-encoded body OR query string

2. **Caching**
   - Cache game data locally when appropriate
   - Use conditional requests when possible

### Development

1. **Error Handling**
   - Always check for `errors` field in responses
   - Implement proper error messages for users
   - Log errors for debugging

2. **Testing**
   - Test with various user scenarios
   - Test error cases (invalid keys, expired tokens)
   - Test rate limiting behavior

---

## Error Handling

### Error Response Format

```json
{
  "errors": ["error message 1", "error message 2"]
}
```

### Common Errors

| Error Message | Cause | Solution |
|---------------|-------|----------|
| `"invalid download key"` | Key doesn't exist, is revoked, or for wrong game | Verify key format and game ID |
| `"no download key found"` | No key exists for given email/user_id | Check if user has purchased/claimed game |
| `401 Unauthorized` | Invalid or missing credentials | Check API key and Authorization header |
| `403 Forbidden` | Insufficient scope | Request appropriate OAuth scopes |
| `404 Not Found` | Invalid endpoint or game ID | Verify URL and parameters |

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (invalid parameters) |
| 401 | Unauthorized (invalid credentials) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## Rate Limiting

While not explicitly documented, implement these best practices:

1. **Exponential Backoff**
   - Retry failed requests with increasing delays
   - Start with 1 second, double on each retry

2. **Request Throttling**
   - Limit number of requests per second
   - Queue requests if necessary

3. **Cache Results**
   - Cache game data that doesn't change frequently
   - Respect cache headers if provided

---

## Code Examples

### Node.js - Fetch User Profile

```javascript
const fetch = require('node-fetch');

async function getUserProfile(apiKey) {
  const response = await fetch('https://itch.io/api/1/key/me', {
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });
  
  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`API Error: ${data.errors.join(', ')}`);
  }
  
  return data.user;
}
```

### Node.js - Check Download Key

```javascript
async function checkDownloadKey(apiKey, gameId, downloadKey) {
  const url = new URL(`https://itch.io/api/1/key/game/${gameId}/download_keys`);
  url.searchParams.append('download_key', downloadKey);
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });
  
  const data = await response.json();
  
  if (data.errors) {
    return { valid: false, error: data.errors[0] };
  }
  
  return { 
    valid: true, 
    key: data.download_key,
    owner: data.download_key.owner 
  };
}
```

### Node.js - Get My Games

```javascript
async function getMyGames(apiKey) {
  const response = await fetch('https://itch.io/api/1/key/my-games', {
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });
  
  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`API Error: ${data.errors.join(', ')}`);
  }
  
  return data.games;
}
```

---

## Additional Resources

- [itch.io API Overview](https://itch.io/docs/api/overview)
- [JavaScript API Reference](https://itch.io/docs/api/javascript)
- [Sub-products Reference](https://itch.io/docs/api/sub-products)
- [App Manifest Documentation](https://itch.io/docs/itch/integrating/api/)
- [itch.io Support](https://itch.io/support)

---

## Changelog

### 2025-01-03
- Initial documentation created
- Documented all server-side API endpoints
- Documented OAuth 2.0 flow
- Added code examples and best practices

---

## Contributing

If you find errors or have suggestions for improvements, please contact [itch.io support](https://itch.io/support).
