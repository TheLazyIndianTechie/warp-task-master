# Fork Maintenance Strategy

## Overview

This document outlines the maintenance strategy for the `warp-task-master` fork of the original [task-master-ai](https://github.com/eyaltoledano/claude-task-master) project.

## Fork Philosophy

- **Independent Development**: This fork is maintained independently with a focus on Warp terminal integration
- **Selective Upstream Integration**: We selectively merge valuable upstream changes that don't conflict with our enhancements
- **Warp-First Features**: New features prioritize seamless Warp AI integration and user experience

## Maintenance Approach

### 1. Upstream Monitoring

- **Weekly Check**: Review upstream changes from `eyaltoledano/claude-task-master`
- **Security Updates**: Always merge critical security fixes
- **Feature Evaluation**: Assess new features for compatibility with Warp enhancements

### 2. Update Strategy

#### Automatic Merges
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

- **Major Versions**: Independent of upstream (current: 1.x.x)
- **Minor Versions**: New Warp features or significant upstream merges
- **Patch Versions**: Bug fixes and small improvements

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
```

## Release Process

1. **Update Version**: Bump version in `package.json`
2. **Update CHANGELOG**: Document changes in `CHANGELOG.md`
3. **Test Build**: Ensure `npm run build` succeeds
4. **Test Warp Features**: Verify all Warp profiles work
5. **Commit & Tag**: Create release commit and git tag
6. **Push**: Push changes and tags to GitHub

## Contact

For fork-specific issues or contributions:
- **GitHub**: [@TheLazyIndianTechie](https://github.com/TheLazyIndianTechie)
- **Issues**: [GitHub Issues](https://github.com/TheLazyIndianTechie/warp-task-master/issues)

For upstream issues:
- **Original Project**: [task-master-ai](https://github.com/eyaltoledano/claude-task-master)