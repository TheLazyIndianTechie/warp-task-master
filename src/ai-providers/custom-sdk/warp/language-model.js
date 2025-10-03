import { spawn } from 'node:child_process';

/**
 * @typedef {import('./types.js').WarpSettings} WarpSettings
 */

export class WarpLanguageModel {
	/**
	 * @param {WarpSettings} settings
	 */
	constructor(settings = {}) {
		this.settings = {
			pathToWarpExecutable: settings.pathToWarpExecutable || 'warp-preview',
			customSystemPrompt: settings.customSystemPrompt,
			cwd: settings.cwd || process.cwd(),
			profile: settings.profile,
			mcpServers: settings.mcpServers || [],
			outputFormat: settings.outputFormat || 'text',
			debug: settings.debug || false,
			...settings,
		};
	}

	get provider() {
		return 'warp';
	}

	get modelId() {
		return this.settings.profile || 'default';
	}

	get defaultObjectGenerationMode() {
		return 'json';
	}

	get specificationVersion() {
		return 'v1';
	}

	async doGenerate(options) {
		const { prompt, mode } = options;

		// Build command arguments
		const args = ['agent', 'run'];

		// Add prompt
		const promptText = this._formatPrompt(prompt);
		args.push('--prompt', promptText);

		// Add output format
		const outputFormat = mode?.type === 'object-json' ? 'json' : 'text';
		args.push('--output-format', outputFormat);

		// Add working directory
		if (this.settings.cwd) {
			args.push('-C', this.settings.cwd);
		}

		// Add profile
		if (this.settings.profile) {
			args.push('--profile', this.settings.profile);
		}

		// Add MCP servers
		for (const server of this.settings.mcpServers) {
			args.push('--mcp-server', server);
		}

		// Add debug flag
		if (this.settings.debug) {
			args.push('--debug');
		}

		const startTime = Date.now();

		try {
			const response = await this._executeCommand(args);
			const duration = Date.now() - startTime;

			// Parse response
			const { text, debugId } = this._parseResponse(response, outputFormat);

			// Extract JSON if needed
			let parsedText = text;
			if (mode?.type === 'object-json') {
				parsedText = this._extractJson(text);
			}

			return {
				text: parsedText,
				usage: {
					promptTokens: this._estimateTokens(promptText),
					completionTokens: this._estimateTokens(parsedText),
				},
				finishReason: 'stop',
				rawCall: {
					rawPrompt: promptText,
					rawSettings: this.settings,
				},
				warnings: [],
				request: {
					body: JSON.stringify({ prompt: promptText, ...this.settings }),
				},
				response: {
					id: debugId,
					timestamp: new Date(),
					modelId: this.modelId,
				},
				logprobs: undefined,
			};
		} catch (error) {
			throw this._handleError(error);
		}
	}

	async doStream(options) {
		// Warp CLI doesn't support true streaming yet
		// Fallback to doGenerate and simulate streaming
		const result = await this.doGenerate(options);

		// Simulate streaming by yielding the complete result
		return {
			stream: (async function* () {
				yield {
					type: 'text-delta',
					textDelta: result.text,
				};
				yield {
					type: 'finish',
					finishReason: result.finishReason,
					usage: result.usage,
					logprobs: result.logprobs,
				};
			})(),
			rawCall: result.rawCall,
			rawResponse: result.response,
			warnings: result.warnings,
			request: result.request,
		};
	}

	_formatPrompt(prompt) {
		// Handle both array and object with messages property
		const messages = Array.isArray(prompt) ? prompt : (prompt.messages || []);

		// Combine system prompt with user messages
		let systemPrompt = this.settings.customSystemPrompt || '';

		// Add system messages
		const systemMessages = messages
			.filter((m) => m.role === 'system')
			.map((m) => m.content)
			.join('\n\n');

		if (systemMessages) {
			systemPrompt = systemPrompt
				? `${systemPrompt}\n\n${systemMessages}`
				: systemMessages;
		}

		// Format user/assistant conversation
		const conversation = messages
			.filter((m) => m.role !== 'system')
			.map((m) => {
				const role = m.role === 'user' ? 'User' : 'Assistant';
				return `${role}: ${m.content}`;
			})
			.join('\n\n');

		// Combine
		const fullPrompt = systemPrompt
			? `${systemPrompt}\n\n---\n\n${conversation}`
			: conversation;

		return fullPrompt;
	}

	_executeCommand(args) {
		return new Promise((resolve, reject) => {
			const child = spawn(this.settings.pathToWarpExecutable, args, {
				cwd: this.settings.cwd,
				stdio: ['ignore', 'pipe', 'pipe'], // Use 'ignore' for stdin to prevent hanging
			});

			let stdout = '';
			let stderr = '';

			child.stdout.on('data', (data) => {
				stdout += data.toString();
			});

			child.stderr.on('data', (data) => {
				stderr += data.toString();
			});

			child.on('error', (error) => {
				reject(new Error(`Failed to execute Warp CLI: ${error.message}`));
			});

			child.on('close', (code) => {
				if (code !== 0) {
					reject(new Error(`Warp CLI exited with code ${code}: ${stderr}`));
				} else {
					resolve(stdout);
				}
			});

			// Add a timeout to detect if the process is hanging
			const timeout = setTimeout(() => {
				child.kill();
				reject(new Error('Warp CLI command timed out after 60 seconds'));
			}, 60000);

			child.on('close', () => {
				clearTimeout(timeout);
			});
		});
	}

	_parseResponse(response, outputFormat) {
		// Extract debug ID from first line
		const lines = response.split('\n');
		const debugIdLine = lines[0];
		const debugId = debugIdLine.match(/debug ID: ([a-f0-9-]+)/)?.[1];

		// Remove first two lines (debug ID and empty line)
		let text = lines.slice(2).join('\n').trim();

		if (outputFormat === 'json') {
			// Warp CLI wraps JSON responses in {"type":"agent","text":"..."}
			// We need to unwrap this and parse the inner text
			try {
				const jsonResponse = JSON.parse(text);
				if (jsonResponse.type === 'agent' && jsonResponse.text) {
					// The text property contains the actual response
					// It might be escaped JSON or plain text
					text = jsonResponse.text;
					
					// Try to parse it as JSON to unescape if needed
					try {
						// If it's a JSON string, parse it to get the actual content
						const parsed = JSON.parse(text);
						// If parsing succeeded, use the stringified version (unescaped)
						text = JSON.stringify(parsed);
					} catch {
						// Not JSON, use as-is
					}
					return { text, debugId };
				}
				// If it's not the expected wrapper format, use the original text
				return { text, debugId };
			} catch {
				// Fallback if JSON parsing fails
				return { text, debugId };
			}
		}

		return { text, debugId };
	}

	_extractJson(text) {
		// Extract JSON from markdown code blocks
		const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
		if (jsonMatch) {
			return jsonMatch[1].trim();
		}

		// Try to find raw JSON
		const jsonObjectMatch = text.match(/\{[\s\S]*\}/);
		if (jsonObjectMatch) {
			return jsonObjectMatch[0];
		}

		return text;
	}

	_estimateTokens(text) {
		// Rough estimation: ~4 characters per token
		return Math.ceil(text.length / 4);
	}

	_handleError(error) {
		if (
			error.message.includes('ENOENT') ||
			error.message.includes('not found')
		) {
			return new Error(
				'Warp CLI not found. Please install it via Homebrew: ' +
					'brew tap warpdotdev/warp && brew install --cask warp-cli',
			);
		}

		if (
			error.message.includes('authentication') ||
			error.message.includes('unauthorized')
		) {
			return new Error(
				'Warp authentication failed. Please ensure you have a valid Warp subscription ' +
					'and are logged in via: warp-preview login',
			);
		}

		return error;
	}
}
