<a name="readme-top"></a>

> ⚠️ **BETA WARNING**: This is `warp-task-master`, a **BETA** custom fork with experimental Warp AI integration. **Use at your own risk!**

<div align='center'>
<a href="https://github.com/TheLazyIndianTechie/warp-task-master" target="_blank"><img src="https://img.shields.io/badge/Enhanced-Warp%20Fork-blue?style=for-the-badge&logo=warp&logoColor=white" alt="Warp Enhanced Fork" /></a>
</div>

<p align="center">
  <a href="https://task-master.dev"><img src="./images/logo.png?raw=true" alt="Taskmaster logo"></a>
</p>

<p align="center">
<b>Warp Task Master (BETA)</b>: AI-powered task management with Warp AI integration and human-readable profile names.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/warp-task-master"><img src="https://img.shields.io/npm/v/warp-task-master.svg?style=flat" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/warp-task-master"><img src="https://img.shields.io/npm/dm/warp-task-master?style=flat" alt="NPM Downloads"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT%20with%20Commons%20Clause-blue.svg" alt="License"></a>
</p>

---

## 🌟 About This Fork

This is an **enhanced fork** of [task-master-ai](https://github.com/eyaltoledano/claude-task-master) by [@eyaltoledano](https://github.com/eyaltoledano) with specialized Warp terminal integration.

**🔗 For the original stable version** → [task-master-ai](https://github.com/eyaltoledano/claude-task-master)

### Why This Fork?

The original task-master-ai is an excellent AI-powered task management system. This fork adds **Warp-specific enhancements** that make it even better for Warp users:

1. **Human-Readable Profile Names** - No more cryptic IDs in configs
2. **Team-Friendly Configuration** - Share configs with readable names
3. **Dynamic Profile Resolution** - Automatic ID mapping per user
4. **Warp CLI Integration** - Direct integration with Warp AI agents

For everything else, this fork maintains 100% compatibility with the original.

---

## ✨ Warp AI Enhancements

### 🎯 Human-Readable Profile Names

**The Problem:**
```json
{
  "models": {
    "main": {
      "provider": "warp",
      "modelId": "4SM7QEB6PSpcMwUHEcl6V3"  // ❌ What is this?
    }
  }
}
```

**The Solution:**
```json
{
  "models": {
    "main": {
      "provider": "warp",
      "modelId": "Sonnet 4.5"  // ✅ Clear and team-friendly!
    }
  }
}
```

### 🛠️ Warp Profile Management

```bash
# List all your Warp profiles with readable names
warp-task-master warp-profiles

# Output:
# 🌀 Available Warp AI Profiles:
# 
# Name: Sonnet 4.5
# ID:   4SM7QEB6PSpcMwUHEcl6V3
# ──────────────────────────────────────────────────
# Name: GPT 5 + Sonet 4.5
# ID:   eOGia6hxKDujsDTKOn3qwh
# ...

# Set models using human-readable names
warp-task-master models --set-main "Sonnet 4.5" --warp
warp-task-master models --set-research "GPT 5 + Sonet 4.5" --warp
```

### 🌍 Perfect for Teams

- **Before**: Team members couldn't share configs (profile IDs are user-specific)
- **After**: Share configs safely using human-readable profile names
- **Smart**: Each user's system resolves names to their own local profile IDs

---

## 📦 Installation

### Requirements

- **Warp subscription** with access to Warp AI agents
- **Warp CLI** (`warp-preview`) installed and accessible

### Option 1: Install from npm (Recommended)

```bash
npm install -g warp-task-master
```

### Option 2: Install from GitHub

```bash
npm install -g https://github.com/TheLazyIndianTechie/warp-task-master.git
```

### Option 3: Local Development

```bash
git clone https://github.com/TheLazyIndianTechie/warp-task-master.git
cd warp-task-master
npm install
npm run build
npm link  # Makes 'warp-task-master' available globally
```

### Verify Installation

```bash
# Check version
warp-task-master --version

# List available Warp profiles
warp-task-master warp-profiles

# Set a model with human-readable name
warp-task-master models --set-main "Sonnet 4.5" --warp
```

---

## 🚀 Quick Start

### 1. Initialize Your Project

```bash
warp-task-master init
```

This creates a `.taskmaster/` directory with:
- `config.json` - Your model configuration
- `tasks/tasks.json` - Task storage
- `docs/` - Documentation and PRD templates
- `state.json` - Current project state

### 2. Configure Warp AI

```bash
# Interactive setup
warp-task-master models --setup

# Or set directly
warp-task-master models --set-main "Sonnet 4.5" --warp
warp-task-master models --set-research "GPT 5 + Sonet 4.5" --warp
```

### 3. Create Your PRD

Create `.taskmaster/docs/prd.txt` with your project requirements. The more detailed, the better!

Example PRD template:
```markdown
# Project: My Awesome App

## Overview
A brief description of what you're building...

## Features
1. User authentication
2. Dashboard with analytics
3. Data export functionality

## Technical Requirements
- Node.js backend
- React frontend
- PostgreSQL database
```

### 4. Parse Your PRD

```bash
warp-task-master parse-prd .taskmaster/docs/prd.txt
```

This generates structured tasks with:
- Dependencies
- Priorities
- Implementation details
- Test strategies

### 5. Work on Tasks

```bash
# Show next recommended task
warp-task-master next

# List all tasks
warp-task-master list

# Show specific tasks
warp-task-master show 1,3,5

# Update task status
warp-task-master set-status --id=1 --status=in-progress
warp-task-master set-status --id=1 --status=done
```

---

## 🎯 Warp-Specific Commands

### Profile Management

```bash
# List all Warp profiles
warp-task-master warp-profiles

# Refresh profile cache
warp-task-master warp-profiles --refresh
```

### Model Configuration

```bash
# Interactive setup with Warp profiles
warp-task-master models --setup

# Set main model
warp-task-master models --set-main "Sonnet 4.5" --warp

# Set research model
warp-task-master models --set-research "GPT 5 + Sonet 4.5" --warp

# Set fallback model
warp-task-master models --set-fallback "Sonnet 4.5" --warp

# View current configuration
warp-task-master models
```

### PRD Parsing with Warp

```bash
# Parse PRD using your configured Warp profile
warp-task-master parse-prd .taskmaster/docs/prd.txt

# The Warp AI agent will:
# 1. Analyze your requirements
# 2. Break them into actionable tasks
# 3. Identify dependencies
# 4. Assign priorities
# 5. Generate implementation guidance
```

---

## 📖 Full Documentation

For complete documentation on all features (shared with original task-master-ai):

- **[Original Project Documentation](https://docs.task-master.dev)** - Complete guides and API reference
- **[Command Reference](docs/command-reference.md)** - All available commands
- **[Configuration Guide](docs/configuration.md)** - Detailed configuration options
- **[Task Structure](docs/task-structure.md)** - Understanding task format

---

## 🔑 Supported AI Providers

While this fork focuses on Warp AI, it maintains full compatibility with all providers from the original:

- ✅ **Warp AI** (subscription-based, no API key required) - **Enhanced in this fork**
- ✅ Claude (Anthropic)
- ✅ Claude Code (no API key required)
- ✅ GPT-4/GPT-3.5 (OpenAI)
- ✅ Gemini (Google)
- ✅ Perplexity (research model)
- ✅ xAI (Grok)
- ✅ OpenRouter
- ✅ Groq
- ✅ Azure OpenAI
- ✅ Ollama (local models)

[See full model configuration guide](docs/models.md)

---

## 💡 Tips for Warp Users

### 1. Profile Name Flexibility

The profile name matcher is fuzzy and supports multiple formats:

```bash
# All of these work:
warp-task-master models --set-main "Sonnet 4.5" --warp
warp-task-master models --set-main "sonnet45" --warp
warp-task-master models --set-main "sonnet-4-5" --warp
```

### 2. Config Portability

Your `.taskmaster/config.json` is now portable across your team:

```json
{
  "models": {
    "main": {
      "provider": "warp",
      "modelId": "Sonnet 4.5"  // ✅ Everyone can understand this
    }
  }
}
```

Each team member's Warp installation will resolve "Sonnet 4.5" to their local profile ID.

### 3. Verify Your Setup

```bash
# Check what profiles you have
warp-task-master warp-profiles

# Verify your config
cat .taskmaster/config.json | jq '.models'
```

---

## 🐛 Known Issues & Beta Status

This is **beta software** with potential bugs:

- ⚠️ Warp profile fetching requires `warp-preview` CLI
- ⚠️ Profile name resolution depends on your active Warp subscription
- ⚠️ Some edge cases in profile name matching may need refinement

**For production use**, consider the [original stable task-master-ai](https://github.com/eyaltoledano/claude-task-master).

**Report issues**: [GitHub Issues](https://github.com/TheLazyIndianTechie/warp-task-master/issues)

---

## 🤝 Contributing

Contributions are welcome! This fork maintains compatibility with the original task-master-ai while adding Warp-specific features.

**Key areas for contribution:**
- Warp CLI integration improvements
- Profile name mapping enhancements
- Bug fixes and stability improvements
- Documentation improvements

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📜 License

MIT License with Commons Clause - Same as the original task-master-ai

See [LICENSE](LICENSE) for details.

---

## 🙏 Credits

### Original Project

**Task Master AI** by:
- [@eyaltoledano](https://x.com/eyaltoledano) - Original creator
- [@RalphEcom](https://x.com/RalphEcom) - Core contributor

### This Fork

**Warp Task Master** maintained by:
- [@TheLazyIndianTechie](https://github.com/TheLazyIndianTechie) - Warp enhancements

**Special thanks** to the Warp team for building an amazing terminal with AI integration!

---

## 🔗 Links

- **Original Project**: [task-master-ai](https://github.com/eyaltoledano/claude-task-master)
- **Documentation**: [docs.task-master.dev](https://docs.task-master.dev)
- **Warp**: [warp.dev](https://warp.dev)
- **npm Package**: [warp-task-master](https://www.npmjs.com/package/warp-task-master)

---

<p align="center">
Made with ❤️ for the Warp community
</p>
