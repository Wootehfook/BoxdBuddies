#!/bin/bash

# BoxdBuddies - GPG Commit Signing Setup
# Automates the setup of GPG commit signing for secure development
# Required for main branch protection rules and enterprise security standards

set -e

echo "🔐 BoxdBuddies GPG Commit Signing Setup"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_step() {
    echo -e "${BLUE}🔧 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [[ ! -f "package.json" ]] || [[ ! -d "src-tauri" ]]; then
    print_error "Please run this script from the BoxdBuddies root directory"
    exit 1
fi

print_step "Checking GPG installation..."

# Check if GPG is installed
if ! command -v gpg &> /dev/null; then
    print_warning "GPG is not installed. Installing..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y gnupg
    elif command -v brew &> /dev/null; then
        brew install gnupg
    elif command -v pacman &> /dev/null; then
        sudo pacman -S gnupg
    elif command -v dnf &> /dev/null; then
        sudo dnf install gnupg2
    else
        print_error "Could not install GPG automatically. Please install GPG manually:"
        echo "  - Ubuntu/Debian: sudo apt-get install gnupg"
        echo "  - macOS: brew install gnupg"
        echo "  - Arch: sudo pacman -S gnupg"
        echo "  - Fedora: sudo dnf install gnupg2"
        exit 1
    fi
fi

print_success "GPG is installed: $(gpg --version | head -1)"

# Get Git user info
GIT_NAME=$(git config user.name || echo "")
GIT_EMAIL=$(git config user.email || echo "")

if [[ -z "$GIT_NAME" ]] || [[ -z "$GIT_EMAIL" ]]; then
    print_error "Git user name and email must be configured first:"
    echo "  git config --global user.name 'Your Name'"
    echo "  git config --global user.email 'your.email@example.com'"
    exit 1
fi

print_success "Git user configured: $GIT_NAME <$GIT_EMAIL>"

# Check for existing GPG keys
print_step "Checking for existing GPG keys..."

if gpg --list-secret-keys --keyid-format LONG | grep -q "sec"; then
    print_success "Found existing GPG keys:"
    echo ""
    gpg --list-secret-keys --keyid-format LONG
    echo ""
    
    # Extract available key IDs
    KEY_IDS=($(gpg --list-secret-keys --keyid-format LONG | grep "sec" | sed 's/.*rsa[0-9]*\///g' | sed 's/ .*//g'))
    
    if [[ ${#KEY_IDS[@]} -eq 1 ]]; then
        GPG_KEY_ID="${KEY_IDS[0]}"
        print_success "Using existing key: $GPG_KEY_ID"
    else
        echo "Multiple keys found. Please select one:"
        for i in "${!KEY_IDS[@]}"; do
            echo "  $((i+1)). ${KEY_IDS[$i]}"
        done
        
        while true; do
            read -p "Enter key number (1-${#KEY_IDS[@]}): " selection
            if [[ "$selection" =~ ^[0-9]+$ ]] && [[ "$selection" -ge 1 ]] && [[ "$selection" -le ${#KEY_IDS[@]} ]]; then
                GPG_KEY_ID="${KEY_IDS[$((selection-1))]}"
                break
            else
                print_error "Invalid selection. Please enter a number between 1 and ${#KEY_IDS[@]}"
            fi
        done
        
        print_success "Selected key: $GPG_KEY_ID"
    fi
else
    print_step "No GPG keys found. Creating a new key..."
    
    echo ""
    echo "This will create a 4096-bit RSA key that expires in 2 years."
    echo "You'll be prompted to enter a secure passphrase."
    echo ""
    read -p "Press Enter to continue..."
    
    # Create GPG key configuration
    cat > /tmp/gpg_key_config <<EOF
%echo Generating GPG key for BoxdBuddies development
Key-Type: RSA
Key-Length: 4096
Subkey-Type: RSA
Subkey-Length: 4096
Name-Real: $GIT_NAME
Name-Email: $GIT_EMAIL
Expire-Date: 2y
%ask-passphrase
%commit
%echo GPG key generation complete
EOF

    # Generate the key
    print_step "Generating GPG key (this may take a few minutes)..."
    gpg --batch --generate-key /tmp/gpg_key_config
    rm /tmp/gpg_key_config
    
    # Get the newly generated key ID
    GPG_KEY_ID=$(gpg --list-secret-keys --keyid-format LONG | grep "sec" | tail -1 | sed 's/.*rsa[0-9]*\///g' | sed 's/ .*//g')
    
    if [[ -z "$GPG_KEY_ID" ]]; then
        print_error "Failed to generate or find GPG key"
        exit 1
    fi
    
    print_success "Generated new GPG key: $GPG_KEY_ID"
fi

# Configure Git for commit signing
print_step "Configuring Git for automatic commit signing..."

git config user.signingkey "$GPG_KEY_ID"
git config commit.gpgsign true
git config tag.gpgsign true

# Set GPG program if needed
if command -v gpg2 &> /dev/null; then
    git config gpg.program gpg2
else
    git config gpg.program gpg
fi

print_success "Git configured for automatic commit signing"

# Test GPG signing
print_step "Testing GPG signing..."

if git commit --allow-empty -S -m "test: verify GPG signing setup" 2>/dev/null; then
    print_success "GPG signing test successful!"
    git reset HEAD~1 --quiet  # Remove test commit
else
    print_error "GPG signing test failed. Please check your GPG setup and passphrase."
    exit 1
fi

# Export public key for GitHub
print_step "Exporting public GPG key for GitHub..."

echo ""
echo "==================== PUBLIC GPG KEY ===================="
echo "Copy the entire key block below (including BEGIN/END lines)"
echo "and add it to GitHub: https://github.com/settings/gpg/new"
echo ""
gpg --armor --export "$GPG_KEY_ID"
echo "=========================================================="
echo ""

# Provide instructions for signing existing commits
echo ""
print_success "🎉 GPG commit signing setup completed successfully!"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. 📋 Copy the public key above"
echo "2. 🌐 Go to: https://github.com/settings/gpg/new"
echo "3. ➕ Add the public key to your GitHub account"
echo "4. ✅ All future commits will be automatically signed"
echo ""
echo "🔄 To sign existing commits in your current PR:"
echo "   git rebase --exec 'git commit --amend --no-edit -S' main"
echo "   git push --force-with-lease"
echo ""
echo "🔑 Your GPG Key ID: $GPG_KEY_ID"
echo "📧 Associated Email: $GIT_EMAIL"
echo ""
echo "💡 Tips:"
echo "  - Your GPG key will expire in 2 years"
echo "  - Keep your passphrase secure and memorable"
echo "  - Consider using gpg-agent for passphrase caching"
echo ""

# Check if we're on the PR branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" == "temp-merge-branch" ]]; then
    echo "🚀 You're on the PR branch. Ready to sign existing commits?"
    echo ""
    read -p "Sign all commits in this PR now? (y/n): " sign_commits
    
    if [[ "$sign_commits" =~ ^[Yy]$ ]]; then
        print_step "Signing existing commits..."
        
        # Count commits to be signed
        COMMIT_COUNT=$(git rev-list --count main..HEAD)
        echo "📊 Found $COMMIT_COUNT commits to sign"
        
        if [[ "$COMMIT_COUNT" -gt 0 ]]; then
            # Rebase and sign commits
            if git rebase --exec 'git commit --amend --no-edit -S' main; then
                print_success "All commits signed successfully!"
                
                echo ""
                read -p "Push signed commits to GitHub? (y/n): " push_commits
                
                if [[ "$push_commits" =~ ^[Yy]$ ]]; then
                    print_step "Pushing signed commits..."
                    git push --force-with-lease
                    print_success "Signed commits pushed to GitHub!"
                else
                    echo "💡 Remember to push when ready: git push --force-with-lease"
                fi
            else
                print_error "Failed to sign commits. You may need to resolve conflicts."
                echo "💡 Run manually: git rebase --exec 'git commit --amend --no-edit -S' main"
            fi
        else
            print_warning "No commits found to sign"
        fi
    else
        echo "💡 Sign commits later with: git rebase --exec 'git commit --amend --no-edit -S' main"
    fi
fi

echo ""
print_success "BoxdBuddies GPG setup complete! 🎯"
