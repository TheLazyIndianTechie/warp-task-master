# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Task Master AI - Development Commands

### Core Development Workflow

```bash
# Build & Development
npm run build                    # Build production bundle (runs tsdown with build-time env injection)
npm run dev                      # Watch mode development
npm run turbo:build             # Build all workspaces with turbo
npm run turbo:dev               # Development mode for all workspaces

# Testing
npm run test                     # Run all Jest tests
npm run test:unit               # Unit tests only
npm run test:integration        # Integration tests only  
npm run test:watch              # Watch mode testing
npm run test:coverage           # Generate coverage report
npm run test:e2e                # End-to-end tests via shell script

# Linting & Formatting
npm run format                  # Format code with Biome
npm run format-check           # Check formatting without changing files
biome check                    # Lint and format check
biome check --write           # Fix linting issues

# Workspace Management
npm run deps:check             # Check workspace dependency consistency
npm run deps:fix              # Fix workspace dependency issues

# MCP Server Development
npm run mcp-server             # Start MCP server locally
npm run inspector             # Debug MCP server with inspector

# Release Management  
npm run changeset              # Create changeset for release
npm run release               # Publish release
npm run publish-packages      # Full build, test, and publish pipeline
```

### Single Test Execution

```bash
# Run specific test file
node --experimental-vm-modules node_modules/.bin/jest path/to/test.js

# Run tests matching pattern
node --experimental-vm-modules node_modules/.bin/jest --testNamePattern="task parsing"

# Run single test suite in watch mode
node --experimental-vm-modules node_modules/.bin/jest --watch path/to/test.js
```

## Architecture Overview

### Monorepo Structure

This is a **monorepo** using npm workspaces with the following high-level architecture:

- **Root Package**: Main CLI binary and MCP server (`task-master-ai` npm package)
- **`packages/`**: Shared libraries
  - `packages/tm-core/`: Core TypeScript library with task management logic
  - `packages/build-config/`: Shared build configuration
- **`apps/`**: Applications built on the core
  - `apps/cli/`: Command-line interface  
  - `apps/extension/`: VS Code extension with Kanban board UI
  - `apps/docs/`: Documentation site

### Key Technologies

- **Build System**: `tsdown` (fast TypeScript bundler) with `turbo` for monorepo orchestration
- **Testing**: Jest with experimental VM modules for ESM support
- **Linting**: Biome for formatting and linting
- **MCP Integration**: Model Context Protocol server for AI editor integration
- **Package Management**: npm workspaces with `@manypkg/cli` for consistency

### Core Architecture Concepts

1. **Task Management Core**: The `@tm/core` package contains the fundamental task parsing, dependency management, and AI integration logic

2. **MCP Server**: Enables direct integration with AI editors (Claude, Cursor, VS Code) through the Model Context Protocol, providing task management capabilities directly in chat

3. **CLI Interface**: Traditional command-line interface for task management, built on Commander.js

4. **VS Code Extension**: Visual Kanban board interface that connects to the MCP server for task visualization and management

5. **Multi-AI Provider Support**: Supports multiple AI providers (Anthropic, OpenAI, Perplexity, etc.) with configurable main/research/fallback models

### Development Patterns

**Build-Time Environment Injection**: The build process uses `getBuildTimeEnvs()` to inject `TM_PUBLIC_*` environment variables at build time, particularly the package version from `package.json`.

**Workspace Dependencies**: Internal packages are referenced with `*` version in `package.json` (e.g., `"@tm/core": "*"`) and resolved through workspace linking.

**Test Configuration**: Uses Jest with experimental VM modules to support ESM imports in Node.js testing environment.

**MCP Development**: The MCP server can be debugged locally using `npm run inspector` and connects to editors through `.cursor/mcp.json` or `.mcp.json` configuration files.

### Integration Points

- **Claude Code Integration**: Auto-loaded context through `CLAUDE.md` and `.taskmaster/CLAUDE.md` files
- **Editor Integration**: MCP servers provide seamless task management within AI chat interfaces
- **Git Workflow**: Task IDs are designed to integrate with commit messages and PR titles
- **Multiple AI Models**: Configurable through `task-master models` command with fallback chains

The codebase is designed for **agentic development workflows** where AI assistants can directly manage tasks through MCP integration while providing traditional CLI and visual interfaces for human developers.
