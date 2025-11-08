#!/bin/bash
# Script to build standalone app

cd "$(dirname "$0")"

echo "🚀 Building standalone app for offline use..."
echo ""
echo "This will create a REAL app that works without laptop!"
echo ""

# Check if logged in
if ! eas whoami &>/dev/null; then
    echo "❌ Not logged in. Please run: eas login"
    exit 1
fi

echo "✅ Logged in as: $(eas whoami)"
echo ""

# Ask which platform
echo "Which platform do you want to build?"
echo "1) iOS (iPhone)"
echo "2) Android"
echo "3) Both"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo "📱 Building for iOS..."
        eas build --platform ios --profile preview
        ;;
    2)
        echo "🤖 Building for Android..."
        eas build --platform android --profile preview
        ;;
    3)
        echo "📱🤖 Building for both platforms..."
        eas build --platform all --profile preview
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Build started! Check your email or expo.dev dashboard for progress."
echo "   This will take 10-20 minutes."

