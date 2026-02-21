# GitHub Rulesets Import Instructions

## Problem Identified

The branch protection rules for the `develop` branch were configured with incorrect status check names. GitHub was waiting for status checks that would never complete because:

1. **Incorrect format**: The ruleset used workflow names (e.g., "Frontend Quality Checks") instead of job names (e.g., "frontend-quality-checks")
2. **Missing check**: The `backend-quality-checks` job was not included in the required checks

## Current Rulesets

All ruleset files are configured with the required job names for the current workflow setup:

### Develop Branch Ruleset (`develop-branch-ruleset.json`)

Required status checks:

- ✅ `backend-quality-checks`
- ✅ `security-audit`

### Main Branch Ruleset (`main-branch-ruleset.json`)

Required status checks:

- ✅ `backend-quality-checks`
- ✅ `security-audit`

### Feature Branch Ruleset (`feature-branch-ruleset.json`)

Required status checks:

- ✅ `security-audit`

### Release/Hotfix Branch Ruleset (`release-hotfix-ruleset.json`)

Required status checks:

- ✅ `backend-quality-checks`
- ✅ `security-audit`

## How to Apply These Changes

### Option 1: Re-import Rulesets (Recommended)

1. Go to https://github.com/Wootehfook/BoxdBuddies/settings/rules
2. Click "New ruleset" → "Import a ruleset"
3. Upload each updated JSON file:
   - `develop-branch-ruleset.json`
   - `main-branch-ruleset.json`
   - `feature-branch-ruleset.json`
   - `release-hotfix-ruleset.json`
4. For each imported ruleset, review the settings (especially the required status checks) and click "Create"
5. After confirming the new rulesets are active and enforce the intended checks, delete or disable the corresponding old rulesets

**Important**: Import the new rulesets first before deleting old ones to avoid creating an unprotected window where branch protections are temporarily disabled.

### Option 2: Manual Update

If you prefer to manually edit existing rulesets:

1. Go to https://github.com/Wootehfook/BoxdBuddies/settings/rules
2. Click on each ruleset
3. Under "Required status checks", replace the status check names with the job names shown above
4. Save changes

## Verification

After applying these changes:

1. Open a new PR targeting the `develop` branch
2. Wait for CI workflows to complete
3. Check that all required status checks are marked as passing (not stuck in "pending")
4. You should be able to merge without seeing "Waiting for status to be reported" messages

## Important Notes

- **Status check context**: GitHub uses the job's `name:` field if present, otherwise uses the `jobs.<job_id>` value from workflow files as the status check context
- **Not the workflow name**: The `name:` at the top of the workflow file is NOT used for status checks
- **Exact match required**: Status check names must exactly match either the job `name:` field or job ID from the workflow file
- **Case sensitive**: Job names are case-sensitive (e.g., `backend-quality-checks` not `Backend Quality Checks`)

## Workflow File References

For reference, here are the actual status check contexts from the current active workflows:

- `.github/workflows/backend-quality-checks-resolver.yml` → `backend-quality-checks`
- `.github/workflows/security-audit.yml` → `security-audit`
