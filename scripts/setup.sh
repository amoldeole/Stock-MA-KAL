# ============================================================
# Development Setup Script
# Run this to get everything up and running
# ============================================================

#!/bin/bash
set -e

echo "🚀 Stock-MA-KAL Development Setup"
echo "================================="

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js required (v20+)"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm required"; exit 1; }

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "❌ Node.js v20+ required (current: $(node -v))"
  exit 1
fi

echo "✅ Node.js $(node -v)"
echo "✅ npm $(npm -v)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Setup environment files
echo ""
echo "🔧 Setting up environment files..."
cp server/.env.example server/.env 2>/dev/null || true

# Check for Docker (optional)
if command -v docker >/dev/null 2>&1; then
  echo "✅ Docker available"
  echo ""
  echo "📋 To start with Docker:"
  echo "   docker-compose up -d"
else
  echo "⚠️  Docker not found (optional, for PostgreSQL/Redis)"
  echo "   Install Docker for full database support"
fi

echo ""
echo "================================="
echo "✅ Setup complete!"
echo ""
echo "🚀 Quick Start:"
echo "   npm run dev              # Start all dev servers"
echo "   npm run dev:server       # API server only (port 4000)"
echo "   npm run dev:web          # Web app only (port 3000)"
echo "   npm run dev:admin        # Admin dashboard (port 3001)"
echo ""
echo "📱 Mobile App:"
echo "   cd apps/mobile"
echo "   npm install"
echo "   npm start                # Expo dev server"
echo "   npm run android          # Run on Android"
echo "   npm run ios              # Run on iOS"
echo ""
echo "🏗️  Build & Deploy:"
echo "   npm run build            # Build all apps"
echo "   docker-compose up -d     # Run with Docker"
echo ""
echo "📱 Build APK:"
echo "   cd apps/mobile"
echo "   eas build --platform android --profile preview"
echo ""
echo "🎤 Voice Commands:"
echo "   Click the mic button (web) or hold mic (mobile)"
echo "   Try: 'Show AAPL chart', 'Add EMA indicator', 'Set 5 minute timeframe'"
