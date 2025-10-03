# Warp AI Integration

This document provides details about the Warp AI integration in Task Master AI.

## Overview

Warp AI has been integrated as a provider, allowing Task Master AI to use Warp's AI agents directly through the Warp CLI (`warp-preview`). This integration follows the same pattern as Claude Code, providing subscription-based access without requiring API keys.

## Features

- ✅ **Subscription-based authentication** - No API keys required
- ✅ **Multiple agent profiles** - Use different Warp profiles for different models
- ✅ **MCP server support** - Enable MCP servers when running agents
- ✅ **Custom working directories** - Run agents in specific directories
- ✅ **JSON and text output formats** - Structured or plain text responses
- ⚠️ **Streaming support** - Falls back to complete response (CLI doesn't support true streaming yet)

## Installation

### 1. Install Warp CLI

**Option 1: Via Homebrew (Recommended)**
```bash
brew tap warpdotdev/warp
brew install --cask warp-cli
```

**Option 2: Via Warp App**
1. Open Warp app
2. Go to Settings
3. Click "Install Warp CLI Command"

### 2. Verify Installation

```bash
# Check if Warp CLI is installed
which warp-preview

# Check version
warp-preview --help

# List available profiles
warp-preview agent profile list
```

### 3. Ensure Warp Subscription

The Warp CLI requires an active Warp subscription to function. Make sure you're logged in:

```bash
warp-preview login
```

## Available Models (Agent Profiles)

Task Master AI supports all Warp agent profiles:

| Profile ID | Name | SWE Score | Context Window |
|------------|------|-----------|----------------|
| `default` | Warp Default | 0.70 | 100K tokens |
| `vjeK7FeKGX9tL48KvFrn4C` | Warp Default Profile | 0.70 | 100K tokens |
| `xzKhoE2wvMQN8OEA8ElhKK` | Warp YOLO Code | 0.72 | 100K tokens |
| `4SM7QEB6PSpcMwUHEcl6V3` | Warp Sonnet 4.5 | 0.75 | 100K tokens |
| `eOGia6hxKDujsDTKOn3qwh` | Warp GPT 5 + Sonnet 4.5 | 0.78 | 200K tokens |

**Note:** All Warp models are subscription-based with zero API costs.

## Usage

### Configure Warp as Main Model

```bash
# Use default Warp profile
task-master models --set main warp:default --warp

# Use specific Warp profile (YOLO Code)
task-master models --set main warp:xzKhoE2wvMQN8OEA8ElhKK --warp

# Use Sonnet 4.5 profile
task-master models --set main warp:4SM7QEB6PSpcMwUHEcl6V3 --warp
```

### Interactive Model Selection

```bash
task-master models
# Then select Warp from the provider list
```

### Using Warp in Tasks

Once configured, Warp will be used automatically by Task Master AI:

```bash
task-master create "Add error handling to auth module"
task-master list
task-master work TM-001
```

## Architecture

### Provider Implementation

The Warp integration consists of:

1. **Custom SDK** (`src/ai-providers/custom-sdk/warp/`)
   - `language-model.js` - Core Warp CLI execution logic
   - `index.js` - Factory function for creating Warp instances
   - `types.js` - TypeScript/JSDoc type definitions

2. **Provider Class** (`src/ai-providers/warp.js`)
   - Extends `BaseAIProvider`
   - Implements text generation, streaming, and object generation
   - Manages profile selection and CLI interaction

3. **Model Configuration** (`scripts/modules/supported-models.json`)
   - Defines available Warp profiles
   - Specifies costs, roles, and capabilities

### CLI Execution Flow

```
Task Master AI
    ↓
WarpProvider.generateText()
    ↓
WarpLanguageModel.doGenerate()
    ↓
_executeCommand() spawns:
    warp-preview agent run \
      --prompt "..." \
      --output-format text \
      --profile <profileId>
    ↓
Warp CLI executes agent
    ↓
Response parsed and returned
```

### Settings

The Warp provider supports the following settings:

```javascript
{
  pathToWarpExecutable: 'warp-preview',  // CLI command name
  customSystemPrompt: '...',              // Optional system prompt
  cwd: '/path/to/working/dir',           // Working directory
  profile: 'profileId',                   // Agent profile ID
  mcpServers: ['uuid1', 'uuid2'],        // MCP server UUIDs
  debug: false,                          // Enable debug logging
  outputFormat: 'text'                   // 'text' or 'json'
}
```

## CLI Command Reference

### Basic Usage

```bash
# Run agent with default profile
warp-preview agent run --prompt "Your prompt here"

# Run with specific profile
warp-preview agent run --prompt "..." --profile xzKhoE2wvMQN8OEA8ElhKK

# JSON output format
warp-preview agent run --prompt "..." --output-format json

# Custom working directory
warp-preview agent run --prompt "..." -C /path/to/project

# Enable MCP server
warp-preview agent run --prompt "..." --mcp-server <uuid>

# Debug mode
warp-preview agent run --prompt "..." --debug
```

### Profile Management

```bash
# List available profiles
warp-preview agent profile list

# Output:
# +------------------------+-------------------+
# | ID                     | Name              |
# +============================================+
# | vjeK7FeKGX9tL48KvFrn4C | Default           |
# | xzKhoE2wvMQN8OEA8ElhKK | YOLO Code         |
# | 4SM7QEB6PSpcMwUHEcl6V3 | Sonnet 4.5        |
# | eOGia6hxKDujsDTKOn3qwh | GPT 5 + Sonet 4.5 |
# +------------------------+-------------------+
```

### MCP Server Management

```bash
# List MCP servers
warp-preview mcp list
```

## Troubleshooting

### CLI Not Found

**Error:** `Warp CLI not found`

**Solution:**
```bash
# Install via Homebrew
brew tap warpdotdev/warp
brew install --cask warp-cli

# Verify installation
which warp-preview
```

### Authentication Failed

**Error:** `Warp authentication failed`

**Solution:**
```bash
# Log in to Warp
warp-preview login

# Verify you have an active subscription
```

### Profile Not Found

**Error:** Profile ID not recognized

**Solution:**
```bash
# List available profiles
warp-preview agent profile list

# Use exact profile ID from the list
task-master models --set main warp:vjeK7FeKGX9tL48KvFrn4C --warp
```

### CLI Version Issues

**Error:** Command not recognized

**Solution:**
```bash
# Update Warp CLI
brew upgrade warp-cli

# Or reinstall
brew reinstall warp-cli
```

## Limitations

1. **No True Streaming** - The Warp CLI doesn't support streaming responses yet. The provider simulates streaming by returning the complete response at once.

2. **Subscription Required** - Unlike API-based providers, Warp requires an active subscription to the Warp service.

3. **CLI Dependency** - Requires `warp-preview` CLI to be installed and accessible in PATH.

4. **Profile IDs** - Profile IDs are specific to your Warp account and may differ from the examples shown.

## Implementation Files

### New Files Created

```
src/ai-providers/warp.js
src/ai-providers/custom-sdk/warp/
├── index.js
├── language-model.js
└── types.js
```

### Modified Files

```
src/constants/providers.js (added WARP constant)
src/ai-providers/index.js (added WarpProvider export)
scripts/modules/ai-services-unified.js (registered Warp provider)
scripts/modules/supported-models.json (added Warp models)
```

## Testing

To test the Warp integration:

```bash
# Test CLI directly
warp-preview agent run --prompt "Say hello" --output-format text

# Test through Task Master
task-master models --set main warp:default --warp
task-master create "Test task with Warp"
```

## Future Enhancements

- [ ] True streaming support (when Warp CLI adds it)
- [ ] Profile auto-detection and sync
- [ ] MCP server configuration management
- [ ] Agent task list integration
- [ ] Voice mode support

## Support

For Warp-specific issues:
- Warp Documentation: https://docs.warp.dev/
- Warp CLI Documentation: https://docs.warp.dev/developers/cli

For Task Master AI integration issues:
- Create an issue in the Task Master AI repository
