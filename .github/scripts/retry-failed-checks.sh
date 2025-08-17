#!/bin/bash

# CI Check Retry Automation Script
# Monitors and retries failed CI checks automatically

set -e

echo "🔄 CI Check Retry Automation Starting..."

PR_NUMBER=$(gh pr view --json number --jq '.number' 2>/dev/null || echo "")

if [ -z "$PR_NUMBER" ]; then
    echo "❌ No active PR found in current context"
    exit 1
fi

echo "📋 Monitoring PR #$PR_NUMBER"

# Function to get failing check status
get_failing_checks() {
    gh pr checks "$PR_NUMBER" --json name,status,conclusion | jq -r '.[] | select(.conclusion == "failure" or .status == "in_progress") | .name'
}

# Function to retry failed workflows
retry_failed_workflows() {
    echo "🔍 Checking for failed workflows to retry..."
    
    # Get recent workflow runs that failed
    FAILED_RUNS=$(gh run list --branch temp-merge-branch --status failure --limit 5 --json databaseId,name,conclusion | jq -r '.[] | select(.conclusion == "failure") | .databaseId')
    
    if [ -n "$FAILED_RUNS" ]; then
        echo "🚨 Found failed workflow runs, attempting to rerun..."
        for run_id in $FAILED_RUNS; do
            echo "🔄 Retrying workflow run: $run_id"
            gh run rerun "$run_id" --failed-jobs || echo "⚠️ Could not retry run $run_id"
            sleep 2
        done
    else
        echo "✅ No failed workflows found to retry"
    fi
}

# Function to wait for checks to complete
wait_for_checks() {
    echo "⏳ Waiting for CI checks to complete..."
    local max_wait=1800  # 30 minutes
    local wait_time=0
    local check_interval=30
    
    while [ $wait_time -lt $max_wait ]; do
        local failing_checks=$(get_failing_checks)
        local in_progress=$(gh pr checks "$PR_NUMBER" --json status | jq -r '.[] | select(.status == "in_progress") | .name' | wc -l)
        
        if [ "$in_progress" -eq 0 ]; then
            if [ -z "$failing_checks" ]; then
                echo "✅ All checks passed!"
                return 0
            else
                echo "❌ Some checks failed:"
                echo "$failing_checks"
                return 1
            fi
        fi
        
        echo "⏳ Checks still in progress... ($wait_time/$max_wait seconds elapsed)"
        sleep $check_interval
        wait_time=$((wait_time + check_interval))
    done
    
    echo "⏰ Timeout reached waiting for checks"
    return 1
}

# Main execution
echo "📊 Current check status:"
gh pr checks "$PR_NUMBER" || echo "Could not fetch check status"

echo ""
echo "🔄 Starting retry process..."

# Retry failed workflows
retry_failed_workflows

# Wait for completion
wait_for_checks

echo "🏁 Retry automation completed"
