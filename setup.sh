#!/bin/bash

# Music Score Editor - Setup Script
# This script will help you set up the development environment

echo "🎼 Music Score Editor - Setup Script"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js (version 18+) from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version is too old (found v$NODE_VERSION, need v18+)"
    echo "Please update Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Check for package managers
if command -v pnpm &> /dev/null; then
    PACKAGE_MANAGER="pnpm"
    echo "✅ pnpm detected - using pnpm"
elif command -v yarn &> /dev/null; then
    PACKAGE_MANAGER="yarn"
    echo "✅ yarn detected - using yarn"
elif command -v npm &> /dev/null; then
    PACKAGE_MANAGER="npm"
    echo "✅ npm detected - using npm"
else
    echo "❌ No package manager found!"
    echo "Please install npm, yarn, or pnpm"
    exit 1
fi

echo ""
echo "📦 Installing dependencies..."
echo "This may take a few minutes..."
echo ""

# Install dependencies
if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
    pnpm install
elif [ "$PACKAGE_MANAGER" = "yarn" ]; then
    yarn install
else
    npm install
fi

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "To start the development server, run:"
    echo "  $PACKAGE_MANAGER dev"
    echo ""
    echo "Then open your browser to: http://localhost:5173"
    echo ""
    echo "📚 For more information, see README.md and SETUP.md"
else
    echo ""
    echo "❌ Installation failed!"
    echo "Please check the error messages above and try again."
    echo "You can also try manual installation:"
    echo "  $PACKAGE_MANAGER install"
    exit 1
fi

