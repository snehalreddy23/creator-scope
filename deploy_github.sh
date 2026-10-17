#!/usr/bin/env bash
set -e

echo "=========================================="
echo "Creating GitHub Repository for CreatorScope"
echo "=========================================="

# Check if authenticated
if ! gh auth status &>/dev/null; then
  echo "You are not logged into GitHub CLI yet."
  echo "Please log in by running:"
  echo "  gh auth login"
  echo ""
  read -p "Would you like to run 'gh auth login' now? [Y/n] " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
    gh auth login
  else
    echo "Aborted. Please log in first with 'gh auth login'."
    exit 1
  fi
fi

# Create repository on GitHub and push local commits
echo "Creating GitHub repository 'creator-scope' and pushing main branch..."
gh repo create creator-scope --public --source=. --remote=origin --push

echo ""
echo "=========================================="
echo "SUCCESS! Repository created and pushed."
echo "You can now go to Vercel and import 'creator-scope'!"
echo "=========================================="
