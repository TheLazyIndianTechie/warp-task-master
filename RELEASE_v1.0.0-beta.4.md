# Release v1.0.0-beta.4 - Warp JSON Parsing & Timeout Fixes

**Release Date:** January 24, 2025  
**NPM Package:** `warp-task-master@1.0.0-beta.4`  
**Git Tag:** `v1.0.0-beta.4`

## 🎉 Release Status

✅ **Successfully Published to npm**
- Package: `warp-task-master@1.0.0-beta.4`
- Tagged as: `latest` and `beta`
- Size: 349.5 kB (unpacked: 1.4 MB)
- Files: 102
- Published by: thelazyindiantechie

✅ **Git Release**
- Commit: `3f7aab8f`
- Tag: `v1.0.0-beta.4`
- Branch: `main`
- Pushed to: https://github.com/TheLazyIndianTechie/warp-task-master

## 🐛 Critical Bug Fixes

### JSON Response Parsing (Critical)
**Problem:** Warp CLI was returning responses that couldn't be parsed, causing "No object generated: could not parse the response" errors during PRD parsing.

**Root Cause:** Warp CLI returns JSON-lines format with multiple events:
```json
{"type":"system","event_type":"conversation_started","conversation_id":"..."}
{"type":"agent","text":"```json{...}```"}
```

The old parser expected a single JSON object and couldn't handle:
1. Multiple JSON objects per response (streaming events)
2. Markdown code blocks wrapping JSON
3. Event stream format

**Solution:**
- Rewrote `_parseResponse()` to properly parse JSON-lines format
- Extracts agent response from event stream
- Handles markdown code block extraction
- Added JSON validation at each step
- Added debug logging for troubleshooting

### Timeout Configuration
**Problem:** Hardcoded 60-second timeout was insufficient for complex PRD parsing.

**Solution:**
- Added configurable `timeout` parameter to WarpSettings
- Default increased to 5 minutes (300000ms)
- Can be customized per provider configuration
- Improved error messages to show actual timeout duration

## 📝 Technical Changes

### Modified Files
1. **src/ai-providers/custom-sdk/warp/types.js**
   - Added `timeout` parameter to WarpSettings

2. **src/ai-providers/custom-sdk/warp/language-model.js**
   - Rewrote `_parseResponse()` for JSON-lines format
   - Enhanced `_extractJson()` with multiple strategies
   - Added debug logging for JSON extraction failures
   - Implemented configurable timeout

3. **src/ai-providers/warp.js**
   - Pass timeout parameter through to model

4. **package.json**
   - Version bumped to 1.0.0-beta.4

5. **CHANGELOG.md**
   - Documented all changes

## ✅ Testing Results

All tests passed successfully:

| Test Case | Result | Details |
|-----------|--------|---------|
| Simple PRD | ✅ Pass | 2 tasks generated |
| Complex GameSwap PRD | ✅ Pass | 10 tasks, 6925 tokens |
| Task Dependencies | ✅ Pass | Correct dependency chains |
| Task Priorities | ✅ Pass | High/Medium/Low correctly set |
| Timeout Handling | ✅ Pass | No more 60s timeouts |
| JSON Extraction | ✅ Pass | Markdown code blocks handled |

## 📦 Installation

```bash
# Install latest version (simplest)
npm install -g warp-task-master

# Or explicitly specify version
npm install -g warp-task-master@1.0.0-beta.4

# Or use beta tag
npm install -g warp-task-master@beta
```

## 🚀 Usage

PRD parsing with Warp AI now works seamlessly:

```bash
# Parse PRD (uses configured Warp profile)
warp-task-master parse-prd docs/my-prd.md

# Parse with specific number of tasks
warp-task-master parse-prd docs/my-prd.md --num-tasks 5

# Force overwrite existing tasks
warp-task-master parse-prd docs/my-prd.md --force
```

## 🔄 Migration Guide

**No action required!** All changes are backward compatible.

- Timeout automatically increased to 5 minutes
- JSON parsing improvements are automatic
- Existing configurations continue to work

### Optional: Custom Timeout

To customize timeout (in milliseconds):

```javascript
// In your configuration
{
  "models": {
    "main": {
      "provider": "warp",
      "modelId": "GPT 5 + Sonet 4.5",
      "timeout": 600000  // 10 minutes
    }
  }
}
```

## 🐛 Known Issues

None reported for this release.

## 📊 Package Stats

- **Version:** 1.0.0-beta.4
- **Size:** 349.5 kB
- **Unpacked Size:** 1.4 MB
- **Files:** 102
- **Node:** >=18.0.0
- **NPM:** >=8.0.0

## 🔗 Links

- **NPM Package:** https://www.npmjs.com/package/warp-task-master
- **GitHub Repo:** https://github.com/TheLazyIndianTechie/warp-task-master
- **Issues:** https://github.com/TheLazyIndianTechie/warp-task-master/issues
- **Changelog:** https://github.com/TheLazyIndianTechie/warp-task-master/blob/main/CHANGELOG.md

## 🙏 Acknowledgments

This is a fork of the excellent [task-master-ai](https://github.com/eyaltoledano/claude-task-master) by Eyal Toledano.

## 📄 License

MIT WITH Commons-Clause

---

**Questions or Issues?**  
Open an issue on GitHub: https://github.com/TheLazyIndianTechie/warp-task-master/issues
