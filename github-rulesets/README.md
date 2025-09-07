# GitHub Repository Rulesets for BoxdBuddies

This directory contains JSON configuration files for comprehensive GitHub repository rulesets that provide enterprise-grade protection across all branch types used in the BoxdBuddies development workflow.

## 📁 Available Rulesets

### 🔒 `main-branch-ruleset.json` - Production Protection

- **Target**: `main` branch
- **Protection Level**: Maximum
- **Required Reviews**: 2 reviewers + code owner approval
- **Status Checks**: All 6 CI/CD jobs must pass
- **Security**: Signed commits, linear history, no force pushes
- **Use Case**: Production releases and critical fixes

### 🔄 `develop-branch-ruleset.json` - Integration Gateway

- **Target**: `develop` branch
- **Protection Level**: High
- **Required Reviews**: 1 reviewer
- **Status Checks**: 4 core quality jobs (excludes build and license for faster integration)
- **Security**: No force pushes, conversation resolution required
- **Use Case**: Development integration and testing

### 🌟 `feature-branch-ruleset.json` - Development Flexibility

- **Target**: `feature/*` branches
- **Protection Level**: Moderate
- **Required Reviews**: 1 reviewer
- **Status Checks**: 3 essential jobs (frontend, backend, security)
- **Flexibility**: Allows force pushes for iterative development
- **Use Case**: Active feature development

### 🚀 `release-hotfix-ruleset.json` - Release Quality

- **Target**: `release/*` and `hotfix/*` branches
- **Protection Level**: Maximum
- **Required Reviews**: 2 reviewers + code owner approval
- **Status Checks**: All 6 CI/CD jobs must pass
- **Security**: Same as main branch (signed commits, linear history)
- **Use Case**: Release preparation and emergency fixes

## 🎯 Status Check Integration

All rulesets are configured with your exact CI/CD workflow job names:

1. **Frontend Quality Checks** - TypeScript compilation, linting, formatting
2. **Backend Quality Checks** - (legacy) Rust formatting and testing
3. **Security Audit** - NPM and Cargo security vulnerability scanning
4. **Code Quality Analysis** - Codacy CLI analysis and pre-commit hook verification
5. **Build Application** - Cross-platform Tauri builds (Windows, macOS, Linux)
6. **License Compliance Check** - AGPL license header verification

## 📋 Import Instructions

1. **Navigate to Repository Settings**:
   - Go to https://github.com/Wootehfook/BoxdBuddies/settings
   - Click on "Rules" in the left sidebar
   - Click on "Rulesets"

2. **Import Each Ruleset**:
   - Click "New ruleset" → "Import a ruleset"
   - Upload each JSON file one at a time
   - Review the configuration
   - Click "Create" to activate

3. **Recommended Import Order**:
   1. `main-branch-ruleset.json` (most critical)
   2. `develop-branch-ruleset.json` (integration protection)
   3. `feature-branch-ruleset.json` (development workflow)
   4. `release-hotfix-ruleset.json` (release management)

## 🔧 Configuration Features

### **Progressive Protection Model**

- **Feature branches**: Flexible for development iteration
- **Develop branch**: Quality gate for integration
- **Main/Release branches**: Maximum production protection

### **Enterprise Security Features**

- File size restrictions (100MB limit)
- Signed commit requirements for production branches
- Linear history enforcement for stable branches
- Conversation resolution requirements
- Stale review dismissal on new commits

### **CI/CD Integration**

- Exact job name matching with your workflow
- Flexible status check requirements per branch type
- Supports workflow_dispatch for manual triggers

## 🚀 Benefits

✅ **Comprehensive Protection**: Covers all branch patterns in your workflow  
✅ **Development Velocity**: Balanced protection without blocking productivity  
✅ **Enterprise Grade**: Professional security and compliance features  
✅ **CI/CD Integration**: Perfect alignment with existing automation  
✅ **Scalable**: Supports team growth and complex release workflows

## 📝 Notes

- These rulesets replace individual branch protection rules
- They provide more granular control and better GitHub integration
- All configurations align with your documented development process
- Status checks reference your exact CI/CD workflow job names

After importing these rulesets, your repository will have enterprise-grade protection that scales with your development workflow while maintaining the flexibility needed for productive development.
