#!/bin/bash
# GPG signing helper script for BoxdBuddies
# Usage: source this file to set up GPG environment

# Check if GPG_PASSPHRASE is set
if [ -z "$GPG_PASSPHRASE" ]; then
    echo "⚠️  GPG_PASSPHRASE environment variable not set"
    echo "To set it securely:"
    echo "export GPG_PASSPHRASE='your-passphrase-here'"
    echo ""
    echo "Or use GPG agent for automatic caching (recommended)"
    exit 1
fi

# Export GPG environment for automated signing
export GPG_TTY=$(tty)
export GNUPGHOME=${GNUPGHOME:-~/.gnupg}

# Test GPG signing
echo "Testing GPG signing..."
echo "test" | gpg --batch --passphrase "$GPG_PASSPHRASE" --pinentry-mode loopback --clearsign --local-user wootehfook@gmail.com > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ GPG signing configured successfully"
    echo "🔐 Passphrase cached for this session"
else
    echo "❌ GPG signing failed - check your passphrase"
    exit 1
fi
