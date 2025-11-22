#!/bin/bash

echo "🚀 Starting Language Exchange iOS App..."
echo ""

# Check if port 8081 is available, otherwise use 8082
if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 8081 is in use, using port 8082..."
    PORT=8082
else
    PORT=8081
fi

# Start Expo with iOS
npx expo start --ios --port $PORT





















