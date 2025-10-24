# Warp Task Master

**AI-powered task management with Warp AI integration and human-readable profile names.**

> ⚠️ **BETA**: Experimental Warp AI integration. Use at your own risk.

## ✨ What is This?

Warp Task Master is an enhanced fork of [task-master-ai](https://github.com/eyaltoledano/claude-task-master) that adds **Warp-specific features**:

- 🎯 **Human-Readable Profile Names** - Share configs with "Sonnet 4.5" instead of cryptic IDs
- 👥 **Team-Friendly** - Each user's Warp installation automatically resolves names to their profile IDs
- 🚀 **Warp AI Integration** - Direct access to all Warp AI agent profiles
- 🔄 **100% Compatible** - Works with all original task-master-ai features

## 📦 Installation

```bash
npm install -g warp-task-master
```

### Requirements

- Active Warp subscription with AI agents enabled
- Warp CLI (`warp-preview`) installed

## 🚀 Quick Start

```bash
# Initialize your project
warp-task-master init

# List available Warp profiles
warp-task-master warp-profiles

# Configure Warp AI
warp-task-master models --set-main "Sonnet 4.5" --warp

# Parse your requirements
warp-task-master parse-prd your-prd.txt

# See tasks and get started
warp-task-master next
```

## 🎯 Key Commands

```bash
# List Warp profiles with human-readable names
warp-task-master warp-profiles

# Set models using readable names
warp-task-master models --set-main "Sonnet 4.5" --warp
warp-task-master models --set-research "GPT 5 + Sonet 4.5" --warp

# Parse requirements and generate tasks
warp-task-master parse-prd docs/prd.txt

# View tasks and project status
warp-task-master list
warp-task-master next
warp-task-master show 1,3,5

# Update task status
warp-task-master set-status --id=1 --status=done
```

## 🌍 Team Configuration

Share `.taskmaster/config.json` across your team:

```json
{
  "models": {
    "main": {
      "provider": "warp",
      "modelId": "Sonnet 4.5"  // ✅ Readable name
    }
  }
}
```

Each team member's Warp CLI automatically resolves "Sonnet 4.5" to their local profile ID.

## 📖 Full Documentation

For complete documentation and guides:

- **[Project GitHub](https://github.com/TheLazyIndianTechie/warp-task-master)**
- **[Original Project Documentation](https://docs.task-master.dev)**

## 🔑 Supported AI Providers

This package supports all providers from the original task-master-ai:

- Warp AI (no API key required) ✨ **Enhanced in this package**
- Claude (Anthropic)
- GPT-4 (OpenAI)
- Gemini (Google)
- And 10+ more providers

## 🐛 Known Issues

- Requires `warp-preview` CLI to be installed
- Profile resolution depends on active Warp subscription
- Beta software - may have bugs

For production use, consider the [original stable task-master-ai](https://github.com/eyaltoledano/claude-task-master).

## 🙏 Credits

**Based on** [task-master-ai](https://github.com/eyaltoledano/claude-task-master) by [@eyaltoledano](https://github.com/eyaltoledano)

**This package** maintained by [@TheLazyIndianTechie](https://github.com/TheLazyIndianTechie)

## 📜 License

MIT License with Commons Clause

---

**Ready to get started?** Run `npm install -g warp-task-master` and then `warp-task-master init`
