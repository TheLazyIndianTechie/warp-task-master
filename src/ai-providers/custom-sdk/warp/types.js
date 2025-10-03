/**
 * @typedef {Object} WarpSettings
 * @property {string} [pathToWarpExecutable='warp-preview'] - Path to Warp CLI executable
 * @property {string} [customSystemPrompt] - Custom system prompt to prepend
 * @property {string} [cwd] - Working directory for agent (defaults to process.cwd())
 * @property {string} [profile] - Agent profile ID (e.g., 'vjeK7FeKGX9tL48KvFrn4C')
 * @property {string[]} [mcpServers=[]] - Array of MCP server UUIDs to enable
 * @property {boolean} [debug=false] - Enable debug logging
 * @property {'text'|'json'} [outputFormat='text'] - Output format preference
 */

/**
 * @typedef {Object} WarpProfile
 * @property {string} id - Profile ID
 * @property {string} name - Profile display name
 */

export {};
