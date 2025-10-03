# Warp AI Integration - Quick Reference Card

## 🎯 Quick Start

```bash
# 1. Install Warp CLI
brew tap warpdotdev/warp && brew install --cask warp-cli

# 2. Login to Warp
warp-preview login

# 3. Configure Task Master
task-master models --set main warp:default --warp

# 4. Use it!
task-master create "Your task description"
```

## 📁 File Locations

```
src/ai-providers/
├── warp.js                          # Main provider class
└── custom-sdk/warp/
    ├── index.js                     # Factory function
    ├── language-model.js            # CLI execution logic
    └── types.js                     # Type definitions

scripts/modules/
├── supported-models.json            # Model configuration
└── ai-services-unified.js           # Provider registration

src/
├── constants/providers.js           # Provider constants
└── ai-providers/index.js            # Provider exports
```

## 🎨 Available Profiles

| Short Name | Profile ID | Score | Tokens |
|-----------|------------|-------|--------|
| Default | `default` | 0.70 | 100K |
| Standard | `vjeK7FeKGX9tL48KvFrn4C` | 0.70 | 100K |
| YOLO Code | `xzKhoE2wvMQN8OEA8ElhKK` | 0.72 | 100K |
| Sonnet 4.5 | `4SM7QEB6PSpcMwUHEcl6V3` | 0.75 | 100K |
| GPT 5 + Sonnet | `eOGia6hxKDujsDTKOn3qwh` | 0.78 | 200K |

## 🔧 CLI Commands

```bash
# Basic usage
warp-preview agent run --prompt "Hello"

# With profile
warp-preview agent run --prompt "..." --profile PROFILE_ID

# JSON output
warp-preview agent run --prompt "..." --output-format json

# Custom directory
warp-preview agent run --prompt "..." -C /path/to/dir

# With MCP server
warp-preview agent run --prompt "..." --mcp-server UUID

# Debug mode
warp-preview agent run --prompt "..." --debug

# List profiles
warp-preview agent profile list

# List MCP servers
warp-preview mcp list
```

## 💻 Task Master Commands

```bash
# Configure Warp provider
task-master models --set main warp:default --warp
task-master models --set main warp:xzKhoE2wvMQN8OEA8ElhKK --warp

# Interactive configuration
task-master models

# Check configuration
task-master models --show

# Use in tasks
task-master create "Task description"
task-master work TM-001
```

## 🔍 Testing

```bash
# Test CLI directly
warp-preview agent run --prompt "Say hello" --output-format text

# Format check
npm run format-check

# Run integration tests (once created)
npm run test:integration

# Test end-to-end
task-master models --set main warp:default --warp
task-master create "Test task"
```

## 🐛 Common Issues

| Error | Solution |
|-------|----------|
| CLI not found | `brew install --cask warp-cli` |
| Auth failed | `warp-preview login` |
| Profile not found | `warp-preview agent profile list` |
| Permission denied | Check Warp subscription is active |

## 📚 Documentation Links

- **Complete Guide**: [WARP_INTEGRATION.md](WARP_INTEGRATION.md)
- **Implementation**: [WARP_IMPLEMENTATION_SUMMARY.md](WARP_IMPLEMENTATION_SUMMARY.md)
- **Warp Docs**: https://docs.warp.dev/
- **Warp CLI Docs**: https://docs.warp.dev/developers/cli

## 🏗️ Architecture

```
Task Master Command
    ↓
WarpProvider
    ↓
WarpLanguageModel
    ↓
child_process.spawn()
    ↓
warp-preview CLI
    ↓
Warp AI Agent
    ↓
Response
```

## ⚡ Key Features

- ✅ Subscription-based (no API keys)
- ✅ 5 agent profiles
- ✅ Text & JSON output
- ✅ MCP server support
- ✅ Custom working directories
- ⚠️ Simulated streaming (returns complete response)

## 🔐 Authentication

**No API keys required!** Authentication is handled by:
1. Warp subscription
2. `warp-preview login` command
3. Warp CLI manages auth tokens

## 📝 Usage Examples

```javascript
// In code (internal)
const warp = createWarp({
  pathToWarpExecutable: 'warp-preview',
  profile: 'xzKhoE2wvMQN8OEA8ElhKK',
  outputFormat: 'text'
});

const result = await warp.doGenerate({
  prompt: [
    { role: 'system', content: 'You are a helpful assistant' },
    { role: 'user', content: 'Write a hello world function' }
  ]
});
```

## 🚀 Quick Commands

```bash
# Check if Warp CLI is installed
which warp-preview

# Test Warp CLI
warp-preview agent run --prompt "Test" --output-format text

# View current Task Master config
task-master models --show

# Switch to Warp
task-master models --set main warp:default --warp

# Create task with Warp
task-master create "Implement feature X"
```

## 📊 Model Comparison

| Model | Best For | Speed | Quality |
|-------|----------|-------|---------|
| Default | General use | ⚡⚡ | ⭐⭐⭐ |
| YOLO Code | Fast coding | ⚡⚡⚡ | ⭐⭐ |
| Sonnet 4.5 | Quality | ⚡⚡ | ⭐⭐⭐⭐ |
| GPT 5 + Sonnet | Complex tasks | ⚡ | ⭐⭐⭐⭐⭐ |

## 🔄 Development Workflow

```bash
# 1. Make changes to Warp integration files
# 2. Format code
npm run format

# 3. Run tests
npm run test

# 4. Build
npm run build

# 5. Test locally
task-master models --set main warp:default --warp
```

## 💡 Tips

1. **Use appropriate profiles**: YOLO Code for speed, Sonnet for quality
2. **Check Warp subscription**: Ensure active before using
3. **Profile IDs**: Use `warp-preview agent profile list` to get current IDs
4. **Debug mode**: Add `--debug` flag to CLI commands for troubleshooting
5. **Working directory**: Use `-C` flag to run in specific project directory

## 🎓 Learning Resources

1. Read [WARP_INTEGRATION.md](WARP_INTEGRATION.md) for complete guide
2. Check [WARP_IMPLEMENTATION_SUMMARY.md](WARP_IMPLEMENTATION_SUMMARY.md) for architecture
3. Review Warp CLI docs: https://docs.warp.dev/developers/cli
4. Test with `warp-preview agent run` commands
5. Examine Claude Code implementation for patterns

---

**Need Help?**
- 📖 Read the full documentation
- 🔍 Check troubleshooting section in WARP_INTEGRATION.md
- 💬 Ask in Task Master AI Discord
- 🐛 Create GitHub issue if you find a bug
