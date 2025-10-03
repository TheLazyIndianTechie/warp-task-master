/**
 * src/ai-providers/warp.js
 *
 * Implementation for interacting with Warp's AI agents via Warp CLI
 * using a custom SDK implementation.
 */

import { createWarp } from './custom-sdk/warp/index.js';
import { BaseAIProvider } from './base-provider.js';
import { profileNameToId, profileIdToName } from './custom-sdk/warp/profile-mapper.js';

export class WarpProvider extends BaseAIProvider {
	constructor() {
		super();
		this.name = 'Warp';
	}

	getRequiredApiKeyName() {
		return 'WARP_API_KEY';
	}

	isRequiredApiKey() {
		return false; // Subscription-based authentication
	}

	/**
	 * Override validateAuth to skip API key validation for Warp
	 * @param {object} params - Parameters to validate
	 */
	validateAuth(params) {
		// Warp uses subscription-based authentication
		// No API key validation needed
	}

	/**
	 * Creates and returns a Warp client instance.
	 * @param {object} params - Parameters for client initialization
	 * @param {string} [params.modelId] - Model ID (profile ID or human-readable name for Warp)
	 * @param {string} [params.cwd] - Working directory
	 * @param {string[]} [params.mcpServers] - MCP server UUIDs
	 * @param {boolean} [params.debug] - Enable debug logging
	 * @returns {Function} Warp client function
	 * @throws {Error} If initialization fails
	 */
	getClient(params) {
		try {
			// Extract profile identifier from modelId if it contains a colon
			// Format: "warp:profileId" or "warp:Default" or just "profileId" or "Default"
			let profileIdentifier = params.modelId?.includes(':')
				? params.modelId.split(':')[1]
				: params.modelId;

			// Try to convert human-readable name to profile ID
			// This supports names like "Default", "Sonnet 4.5", "GPT-5 + Sonnet 4.5", etc.
			let profile = profileNameToId(profileIdentifier);
			
			// If profileNameToId returns null, assume it's already a profile ID
			if (!profile) {
				profile = profileIdentifier;
			}

			// Map "default" to actual default profile ID as final fallback
			if (profile === 'default' || !profile) {
				profile = 'vjeK7FeKGX9tL48KvFrn4C'; // Use actual default profile ID
			}

			// Create the Warp language model instance
			const warpModel = createWarp({
				profile,
				cwd: params.cwd,
				mcpServers: params.mcpServers || [],
				debug: params.debug || false,
			});

			// Return a function that accepts a modelId and returns the Warp model instance
			// This matches the AI SDK's expected provider interface
			return () => warpModel;
		} catch (error) {
			this.handleError('client initialization', error);
		}
	}
}
