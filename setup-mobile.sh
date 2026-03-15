#!/bin/bash

# Setup script for converting Online Housie to mobile apps
# Run this script to automate the initial Capacitor setup

echo "🚀 Setting up Online Housie for mobile deployment..."
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js first."
    exit 1
fi

echo "📦 Installing Capacitor core packages..."
npm install @capacitor/core @capacitor/cli

echo ""
echo "✅ Capacitor core packages installed!"
echo ""
echo "📱 Next steps:"
echo ""
echo "1. Initialize Capacitor:"
echo "   npx cap init"
echo ""
echo "   When prompted:"
echo "   - App name: Online Housie"
echo "   - App ID: com.yourcompany.onlinehousie (use your own domain)"
echo "   - Web directory: dist"
echo ""
echo "2. Build your web app:"
echo "   npm run build"
echo ""
echo "3. Add platforms:"
echo "   npm install @capacitor/ios"
echo "   npx cap add ios"
echo ""
echo "   npm install @capacitor/android"
echo "   npx cap add android"
echo ""
echo "4. Sync and open:"
echo "   npx cap sync"
echo "   npx cap open ios      # For iOS (Mac only)"
echo "   npx cap open android  # For Android"
echo ""
echo "📖 See MOBILE_APP_GUIDE.md for detailed instructions!"
echo ""
