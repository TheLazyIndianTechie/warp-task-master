import { WarpLanguageModel } from './language-model.js';

/**
 * @typedef {import('./types.js').WarpSettings} WarpSettings
 */

/**
 * Create a Warp language model instance
 * @param {WarpSettings} settings - Configuration settings for Warp
 * @returns {WarpLanguageModel} Configured Warp language model
 */
export function createWarp(settings = {}) {
	return new WarpLanguageModel(settings);
}
