# GitHub Rulesets Import Instructions

## Problem Identified

The branch protection rules for the `develop` branch were configured with incorrect status check names. GitHub was waiting for status checks that would never complete because:

1. **Incorrect format**: The ruleset used workflow names (e.g., "Frontend Quality Checks") instead of job names (e.g., "frontend-quality-checks")
2. **Missing check**: The `backend-quality-checks` job was not included in the required checks

## Changes Made

All ruleset files have been updated with the correct job names:

### Develop Branch Ruleset (`develop-branch-ruleset.json`)
Required status checks:
- ✅ `backend-quality-checks` (added)
- ✅ `frontend-quality-checks` (corrected)
- ✅ `security-audit` (corrected)
- ✅ `code-quality-analysis` (corrected)
- ✅ `📊 Generate Report` (unchanged)

### Main Branch Ruleset (`main-branch-ruleset.json`)
Required status checks:
- ✅ `backend-quality-checks` (added)
- ✅ `frontend-quality-checks` (corrected)
- ✅ `security-audit` (corrected)
- ✅ `code-quality-analysis` (corrected)
- ✅ `license-compliance-check` (corrected)
- ✅ `📊 Generate Report` (unchanged)

### Feature Branch Ruleset (`feature-branch-ruleset.json`)
Required status checks:
- ✅ `frontend-quality-checks` (corrected)
- ✅ `security-audit` (corrected)

### Release/Hotfix Branch Ruleset (`release-hotfix-ruleset.json`)
Required status checks:
- ✅ `backend-quality-checks` (added)
- ✅ `frontend-quality-checks` (corrected)
- ✅ `security-audit` (corrected)
- ✅ `code-quality-analysis` (corrected)
- ✅ `license-compliance-check` (corrected)

## How to Apply These Changes

### Option 1: Re-import Rulesets (Recommended)

1. Go to https://github.com/Wootehfook/BoxdBuddies/settings/rules
2. For each existing ruleset, **delete** it (this will not affect protected branches immediately)
3. Click "New ruleset" → "Import a ruleset"
4. Upload each updated JSON file:
   - `develop-branch-ruleset.json`
   - `main-branch-ruleset.json`
   - `feature-branch-ruleset.json`
   - `release-hotfix-ruleset.json`
5. Review and click "Create" for each one

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

For reference, here are the actual status check contexts from the workflows:

- `.github/workflows/backend-quality-checks-resolver.yml` → `backend-quality-checks` (job ID: backend-quality-checks, name: backend-quality-checks)
- `.github/workflows/frontend-quality-checks.yml` → `frontend-quality-checks` (job ID: frontend-quality-checks, no explicit name)
- `.github/workflows/security-audit.yml` → `security-audit` (job ID: security-audit, no explicit name)
- `.github/workflows/code-quality-analysis.yml` → `code-quality-analysis` (job ID: code-quality-analysis, no explicit name)
- `.github/workflows/license-compliance-check.yml` → `license-compliance-check` (job ID: license-compliance-check, no explicit name)
- `.github/workflows/pr-conversation-handler.yml` → `📊 Generate Report` (job ID: report, name: "📊 Generate Report")
