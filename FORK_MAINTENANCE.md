# Fork Maintenance Strategy (BETA)

## Overview

> ⚠️ **BETA STATUS**: This fork is currently in beta with experimental features. For production use, consider the stable [task-master-ai](https://github.com/eyaltoledano/claude-task-master).

This document outlines the maintenance strategy for the `warp-task-master` BETA fork of the original [task-master-ai](https://github.com/eyaltoledano/claude-task-master) project.

## Fork Philosophy

- **Independent Development**: This fork is maintained independently with a focus on Warp terminal integration
- **Selective Upstream Integration**: We selectively merge valuable upstream changes that don't conflict with our enhancements
- **Warp-First Features**: New features prioritize seamless Warp AI integration and user experience

## Maintenance Approach

### 1. Upstream Monitoring

- **Regular Check**: Periodically review upstream changes from `eyaltoledano/claude-task-master`
- **Security Updates**: Always merge critical security fixes
- **Feature Evaluation**: Assess new features for compatibility with Warp enhancements

### 2. Update Strategy

#### Priority Merges (Fast-Track)
These changes receive expedited review and testing, but still require validation before merging:
- Security patches
- Bug fixes that don't affect Warp functionality
- Documentation improvements (with fork-specific adjustments)

#### Manual Review Required
- New AI provider integrations
- Changes to model configuration system
- Core architecture modifications
- Breaking changes

#### Fork-Specific Rejections
- Changes that conflict with human-readable profile names
- Modifications that break Warp profile resolution
- Features that don't align with our Warp-first philosophy

### 3. Version Strategy

- **Beta Versions**: Current phase - experimental features (current: 1.0.0-beta.x)
- **Stable Releases**: Will begin after beta testing completes (future: 1.0.0+)
- **Major Versions**: Independent of upstream for stable releases
- **Minor/Patch**: New Warp features, upstream merges, and bug fixes

## Contribution Guidelines

### For Fork-Specific Features

1. **Warp Integration**: Features should enhance Warp AI experience
2. **Backward Compatibility**: Maintain compatibility with existing Warp profiles
3. **Documentation**: Update README.md and CHANGELOG.md
4. **Testing**: Verify all Warp profiles work correctly

### For Upstream Compatibility

1. **Cherry-Pick**: Use `git cherry-pick` for selective upstream integration
2. **Conflict Resolution**: Prioritize Warp-specific functionality in conflicts
3. **Testing**: Ensure upstream changes don't break Warp features

## Upstream Sync Commands

```bash
# Add upstream remote (if not already added)
git remote add upstream https://github.com/eyaltoledano/claude-task-master.git

# Fetch upstream changes
git fetch upstream

# Check for new upstream commits
git log HEAD..upstream/main --oneline

# Cherry-pick specific commits
git cherry-pick <commit-hash>

# Or merge upstream changes (use with caution)
git merge upstream/main

# Check if merge would create conflicts (without actually merging)
git merge --no-commit --no-ff upstream/main
git merge --abort  # if you just want to check

# Abort a merge if conflicts arise
git merge --abort
```

## Release Process

1. **Update Version**: Bump version in `package.json`
2. **Update CHANGELOG**: Document changes in `CHANGELOG.md`
3. **Test Build**: Ensure `npm run build` succeeds
4. **Test Warp Features**: Verify all Warp profiles work
5. **Commit & Tag**: Create release commit and git tag
6. **Push**: Push changes and tags to GitHub
7. **Publish (if applicable)**: Run `npm publish --access public` to publish to npm registry
8. **Verify**: Confirm package installation works: `npm install warp-task-master@latest`

### Rollback Procedure

If a release has critical issues:

1. **Unpublish (within 72 hours)**: `npm unpublish warp-task-master@<version>`
2. **Delete Tag**: `git tag -d <version> && git push origin :refs/tags/<version>`
3. **Deprecate (after 72 hours)**: `npm deprecate warp-task-master@<version> "Critical bug, use <previous-version> instead"`

## Contact

For fork-specific issues or contributions:
- **GitHub**: [@TheLazyIndianTechie](https://github.com/TheLazyIndianTechie)
- **Issues**: [GitHub Issues](https://github.com/TheLazyIndianTechie/warp-task-master/issues)

For upstream issues:
- **Original Project**: [task-master-ai](https://github.com/eyaltoledano/claude-task-master)