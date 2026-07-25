#!/bin/bash
# GPG signing helper script for BoxdBuddies
# Usage: source this file to set up GPG environment

# This script is intended to be sourced, so stop with `return` (which leaves
# the caller's shell alive) and fall back to `exit` when run directly. The
# pattern must be inline at the top level — a helper function's `return`
# would only return from the function, not halt the sourced script. `return`
# outside a sourced/function context errors harmlessly to /dev/null, so the
# `|| exit` branch handles direct execution.

# Check if GPG_PASSPHRASE is set
if [[ -z "$GPG_PASSPHRASE" ]]; then
    echo "⚠️  GPG_PASSPHRASE environment variable not set"
    echo "To set it securely:"
    echo "export GPG_PASSPHRASE='your-passphrase-here'"
    echo ""
    echo "Or use GPG agent for automatic caching (recommended)"
    return 1 2>/dev/null || exit 1
fi

# Export GPG environment for automated signing
GPG_TTY=$(tty)
export GPG_TTY
export GNUPGHOME=${GNUPGHOME:-~/.gnupg}

# Test GPG signing
echo "Testing GPG signing..."
if echo "test" | gpg --batch --passphrase "$GPG_PASSPHRASE" --pinentry-mode loopback --clearsign --local-user wootehfook@gmail.com > /dev/null 2>&1; then
    echo "✅ GPG signing configured successfully"
    echo "🔐 Passphrase cached for this session"
else
    echo "❌ GPG signing failed - check your passphrase"
    return 1 2>/dev/null || exit 1
fi
