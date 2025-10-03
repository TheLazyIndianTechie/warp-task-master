/**
 * Warp Profile Mapper
 * Maps profile IDs to human-readable names and provides utilities for profile management
 */

import { execSync } from 'node:child_process';

/**
 * Static mapping of known Warp profile IDs to human-readable names
 * This serves as a fallback if dynamic fetching fails
 */
const STATIC_PROFILE_MAP = {
	'vjeK7FeKGX9tL48KvFrn4C': 'Default',
	'eOGia6hxKDujsDTKOn3qwh': 'GPT-5 + Sonnet 4.5',
	'4SM7QEB6PSpcMwUHEcl6V3': 'Sonnet 4.5',
	'xzKhoE2wvMQN8OEA8ElhKK': 'YOLO Code'
};

/**
 * Reverse mapping for looking up profile ID by name
 */
const STATIC_NAME_TO_ID_MAP = Object.entries(STATIC_PROFILE_MAP).reduce(
	(acc, [id, name]) => {
		// Store both original name and normalized version (lowercase, spaces removed)
		acc[name] = id;
		acc[name.toLowerCase()] = id;
		acc[name.toLowerCase().replace(/\s+/g, '')] = id;
		acc[name.toLowerCase().replace(/\s+/g, '-')] = id;
		return acc;
	},
	{}
);

/**
 * Cache for dynamically fetched profiles
 */
let profileCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch profiles from Warp CLI dynamically
 * @returns {Object|null} Profile map or null if fetching fails
 */
export function fetchWarpProfiles() {
	try {
		// Check cache first
		if (
			profileCache &&
			cacheTimestamp &&
			Date.now() - cacheTimestamp < CACHE_TTL
		) {
			return profileCache;
		}

		// Try to find warp-preview executable
		let warpPath = 'warp-preview'; // Default to PATH

		// Execute warp-preview agent profile list and parse output
		const output = execSync(`${warpPath} agent profile list`, {
			encoding: 'utf-8',
			stdio: ['ignore', 'pipe', 'ignore'] // Suppress stderr
		});

		// Parse the table output
		// Format:
		// +------------------------+-------------------+
		// | ID                     | Name              |
		// +============================================+
		// | vjeK7FeKGX9tL48KvFrn4C | Default           |
		// |------------------------+-------------------|
		// | eOGia6hxKDujsDTKOn3qwh | GPT 5 + Sonet 4.5 |
		// ...

		const profiles = {};
		const lines = output.split('\n');

		for (const line of lines) {
			// Skip separator lines and headers
			if (line.includes('+===') || line.includes('+---') || !line.includes('|'))
				continue;
			if (line.includes('| ID') && line.includes('| Name')) continue;

			// Extract ID and Name from table row
			const parts = line.split('|').map((p) => p.trim());
			if (parts.length >= 3 && parts[1] && parts[2]) {
				const id = parts[1];
				const name = parts[2];
				if (id && name && id.length === 22) {
					// Warp profile IDs are 22 characters
					profiles[id] = name;
				}
			}
		}

		if (Object.keys(profiles).length > 0) {
			profileCache = profiles;
			cacheTimestamp = Date.now();
			return profiles;
		}

		// Fallback to static map if parsing failed
		return null;
	} catch (error) {
		// Silently fail and return null to fallback to static map
		return null;
	}
}

/**
 * Get all available profiles (dynamically or from static map)
 * @returns {Object} Profile map {id: name}
 */
export function getProfileMap() {
	const dynamicProfiles = fetchWarpProfiles();
	return dynamicProfiles || STATIC_PROFILE_MAP;
}

/**
 * Convert a profile ID to human-readable name
 * @param {string} profileId - Profile ID to convert
 * @returns {string} Human-readable name or the original ID if not found
 */
export function profileIdToName(profileId) {
	if (!profileId) return 'Unknown';

	// Try dynamic profiles first
	const dynamicProfiles = fetchWarpProfiles();
	if (dynamicProfiles && dynamicProfiles[profileId]) {
		return dynamicProfiles[profileId];
	}

	// Fallback to static map
	return STATIC_PROFILE_MAP[profileId] || profileId;
}

/**
 * Convert a human-readable name to profile ID
 * Supports multiple name formats:
 * - "Default" -> vjeK7FeKGX9tL48KvFrn4C
 * - "default" -> vjeK7FeKGX9tL48KvFrn4C
 * - "GPT-5 + Sonnet 4.5" -> eOGia6hxKDujsDTKOn3qwh
 * - "gpt5sonnet45" -> eOGia6hxKDujsDTKOn3qwh
 * - "gpt-5-sonnet-4-5" -> eOGia6hxKDujsDTKOn3qwh
 *
 * @param {string} name - Human-readable name to convert
 * @returns {string|null} Profile ID or null if not found
 */
export function profileNameToId(name) {
	if (!name) return null;

	// Check if it's already a profile ID (22 characters alphanumeric)
	if (name.length === 22 && /^[a-zA-Z0-9]+$/.test(name)) {
		return name;
	}

	// Try to find in static map with various normalizations
	const normalizations = [
		name, // Original
		name.toLowerCase(), // Lowercase
		name.toLowerCase().replace(/\s+/g, ''), // No spaces
		name.toLowerCase().replace(/\s+/g, '-'), // Dashes instead of spaces
		name.toLowerCase().replace(/[^a-z0-9]/g, ''), // Only alphanumeric
		name.toLowerCase().replace(/[^a-z0-9]/g, '-') // Dashes for non-alphanumeric
	];

	for (const normalized of normalizations) {
		if (STATIC_NAME_TO_ID_MAP[normalized]) {
			return STATIC_NAME_TO_ID_MAP[normalized];
		}
	}

	// Try dynamic profiles with same normalizations
	const dynamicProfiles = fetchWarpProfiles();
	if (dynamicProfiles) {
		// Create reverse map for dynamic profiles
		const dynamicNameToId = {};
		for (const [id, profileName] of Object.entries(dynamicProfiles)) {
			for (const normalized of normalizations) {
				const profileNormalizations = [
					profileName,
					profileName.toLowerCase(),
					profileName.toLowerCase().replace(/\s+/g, ''),
					profileName.toLowerCase().replace(/\s+/g, '-'),
					profileName.toLowerCase().replace(/[^a-z0-9]/g, ''),
					profileName.toLowerCase().replace(/[^a-z0-9]/g, '-')
				];

				if (profileNormalizations.includes(normalized)) {
					return id;
				}
			}
		}
	}

	return null;
}

/**
 * Get a list of all available profiles with their IDs and names
 * @returns {Array<{id: string, name: string}>} Array of profile objects
 */
export function listProfiles() {
	const profileMap = getProfileMap();
	return Object.entries(profileMap).map(([id, name]) => ({ id, name }));
}

/**
 * Clear the profile cache (useful for testing or forcing refresh)
 */
export function clearProfileCache() {
	profileCache = null;
	cacheTimestamp = null;
}
