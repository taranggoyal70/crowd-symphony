#!/bin/bash

echo "🚀 Crowd Symphony - GitHub Push Helper"
echo "======================================"
echo ""

# Check if repository name is provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide your GitHub username"
    echo ""
    echo "Usage: ./push-to-github.sh YOUR_GITHUB_USERNAME"
    echo ""
    echo "Example: ./push-to-github.sh tarang123"
    exit 1
fi

GITHUB_USERNAME=$1
REPO_NAME="crowd-symphony"

echo "📝 GitHub Username: $GITHUB_USERNAME"
echo "📦 Repository Name: $REPO_NAME"
echo ""

# Check if remote already exists
if git remote | grep -q "origin"; then
    echo "⚠️  Remote 'origin' already exists. Removing it..."
    git remote remove origin
fi

# Add GitHub remote
echo "🔗 Adding GitHub remote..."
git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"

# Ensure we're on main branch
echo "🌿 Ensuring main branch..."
git branch -M main

# Show what will be pushed
echo ""
echo "📊 Files ready to push:"
git log --oneline -5
echo ""

# Push to GitHub
echo "🚀 Pushing to GitHub..."
echo ""
echo "⚠️  You will be asked for credentials:"
echo "   Username: $GITHUB_USERNAME"
echo "   Password: Use a Personal Access Token (not your password!)"
echo ""
echo "   Get token here: https://github.com/settings/tokens"
echo ""

git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Your code is now on GitHub!"
    echo ""
    echo "🌐 View your repository:"
    echo "   https://github.com/$GITHUB_USERNAME/$REPO_NAME"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Visit your repository"
    echo "   2. Add topics: nextjs, typescript, hand-tracking, socket-io"
    echo "   3. Share with the world! 🎉"
else
    echo ""
    echo "❌ Push failed. Common issues:"
    echo "   1. Repository doesn't exist - create it at https://github.com/new"
    echo "   2. Wrong credentials - use Personal Access Token"
    echo "   3. No internet connection"
fi
