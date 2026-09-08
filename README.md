# 📈 Stock MA-KAL

### Professional Stock Analysis Platform — Moving Averages & Kalman Filter

A production-grade, full-stack platform for real-time stock market analysis combining **Moving Average indicators** (SMA, EMA, WMA, DEMA, TEMA, HMA, KAMA) with **Kalman Filter** state estimation for adaptive trend detection and AI-powered trading signals.

**Available as**: 🌐 Web App | 📱 Android/iOS App | 🔧 Admin Dashboard

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐     │
│  │  Web App    │  │ Mobile App  │  │  Admin Dashboard    │     │
│  │  (Next.js)  │  │ (Expo/RN)  │  │  (Next.js)          │     │
│  │  :3000      │  │             │  │  :3001              │     │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘     │
│         │                │                     │                 │
│    @stock-ma-kal/shared (types, indicators, utils)               │
└─────────┼────────────────┼─────────────────────┼─────────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌──────────────────────────────────────────────────────────────────┐
│                        SERVER LAYER                              │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Fastify API Server (:4000)                  │    │
│  │  ┌──────┐ ┌──────────┐ ┌────────┐ ┌──────┐ ┌───────┐  │    │
│  │  │Stock │ │Indicators│ │Features│ │Voice │ │Admin  │  │    │
│  │  │Data  │ │Engine    │ │Config  │ │NLP   │ │Stats  │  │    │
│  │  └──┬───┘ └────┬─────┘ └───┬────┘ └──┬───┘ └───┬───┘  │    │
│  └─────┼──────────┼───────────┼──────────┼─────────┼──────┘    │
│        │          │           │          │         │             │
│  ┌─────┴──────────┴───────────┴──────────┴─────────┴──────┐    │
│  │          WebSocket Server (Real-time prices)            │    │
│  └────────────────────────┬────────────────────────────────┘    │
└───────────────────────────┼─────────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
         ┌────────┐   ┌─────────┐   ┌────────────┐
         │PostgreSQL│   │  Redis  │   │Stock APIs  │
         │(persist)│   │(cache)  │   │(Finnhub,AV)│
         └────────┘   └─────────┘   └────────────┘
```

---

## ⚡ Key Features

| Feature | Description |
|---------|-------------|
| **7 Moving Averages** | SMA, EMA, WMA, DEMA, TEMA, HMA, KAMA |
| **Kalman Filter** | Adaptive state estimation with velocity tracking |
| **Trade Signals** | Composite signals from MA + Kalman + RSI + Volume |
| **Real-time Data** | WebSocket price streaming |
| **Voice Commands** | Natural language control on all platforms |
| **Dynamic Features** | Server-driven UI — update features without APK changes |
| **Admin Dashboard** | User management, stats, feature toggles, system health |
| **Shared Code** | Single indicators library across web, mobile, and server |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+
- **npm** 10+
- **Docker** (recommended for PostgreSQL + Redis)

### 1. Clone & Setup

```bash
git clone <repository-url>
cd Stock-MA-KAL
bash scripts/setup.sh
```

### 2. Start Infrastructure (Docker)

```bash
docker-compose up -d postgres redis
```

### 3. Start Development Servers

```bash
# Option A: Start everything
npm run dev

# Option B: Start individually
npm run dev:server    # API on http://localhost:4000
npm run dev:web       # Web on http://localhost:3000
npm run dev:admin     # Admin on http://localhost:3001
```

### 4. Mobile App (Expo)

```bash
cd apps/mobile
npm install
npm start             # Expo dev server
npm run android       # Android emulator/device
npm run ios           # iOS simulator
```

---

## 📁 Project Structure

```
Stock-MA-KAL/
├── apps/
│   ├── web/              # Next.js web application (:3000)
│   │   ├── src/
│   │   │   ├── app/      # Next.js App Router pages
│   │   │   ├── components/  # React components
│   │   │   ├── hooks/    # Custom hooks (voice, etc.)
│   │   │   └── lib/      # Store, API client
│   │   └── package.json
│   │
│   ├── admin/            # Next.js admin dashboard (:3001)
│   │   ├── src/
│   │   │   ├── app/      # Admin pages
│   │   │   └── components/
│   │   └── package.json
│   │
│   └── mobile/           # React Native (Expo) mobile app
│       ├── src/
│       │   ├── screens/  # App screens
│       │   ├── hooks/    # Mobile hooks (voice)
│       │   └── lib/      # Mobile store
│       ├── app.json      # Expo configuration
│       └── eas.json      # EAS Build config (APK/AAB)
│
├── server/               # Fastify API server (:4000)
│   ├── src/
│   │   ├── routes/       # API route handlers
│   │   ├── services/     # Business logic (stock, cache, db)
│   │   ├── config/       # Configuration
│   │   └── utils/        # Logger, helpers
│   └── package.json
│
├── packages/
│   └── shared/           # Shared code across all platforms
│       └── src/
│           ├── types/    # TypeScript interfaces
│           ├── indicators/  # MA + Kalman calculations
│           └── utils/    # Formatters, constants
│
├── docker/               # Dockerfiles
├── scripts/              # Setup & utility scripts
├── docs/                 # Documentation
├── docker-compose.yml    # Full stack orchestration
├── turbo.json            # Turborepo pipeline config
└── package.json          # Root workspace config
```

---

## 🛠️ Development Guide

### Running the API Server

```bash
cd server

# Development (with hot reload)
npm run dev

# Production build
npm run build
npm start
```

The server runs on port 4000 with:
- REST API endpoints (`/api/quote/:symbol`, `/api/history/:symbol`, etc.)
- WebSocket server at `/ws` for real-time price updates
- Redis caching for sub-ms responses
- PostgreSQL for persistence

### Running the Web App

```bash
cd apps/web

# Development (Next.js dev server)
npm run dev

# Production build
npm run build
npm start
```

### Running the Admin Dashboard

```bash
cd apps/admin

npm run dev     # http://localhost:3001
```

### Debugging

**Server debugging:**
```bash
# With Node inspector
cd server && npx tsx --inspect src/index.ts

# VS Code: Add to .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Server",
  "runtimeExecutable": "npx",
  "runtimeArgs": ["tsx", "src/index.ts"],
  "cwd": "${workspaceFolder}/server"
}
```

**Web app debugging:**
```bash
# Enable React DevTools
# Chrome DevTools > Elements/Console/Network

# API request debugging
# Set NEXT_PUBLIC_API_URL to your server URL
```

**Mobile debugging:**
```bash
# React Native Debugger
npx react-native start --reset-cache

# Flipper for React Native
# Install Flipper desktop app
```

---

## 🏗️ Build & Deploy

### Web Application

```bash
# Build for production
cd apps/web
npm run build

# Output in .next/
# Deploy to Vercel, Netlify, or any Node host

# Vercel deployment
npx vercel --prod

# Docker deployment
docker build -f docker/Dockerfile.web -t stockmakal-web .
docker run -p 3000:3000 stockmakal-web
```

### Admin Dashboard

```bash
cd apps/admin
npm run build

# Same deployment options as web
docker build -f docker/Dockerfile.admin -t stockmakal-admin .
docker run -p 3001:3001 stockmakal-admin
```

### API Server

```bash
cd server
npm run build

# Docker (recommended)
docker build -f docker/Dockerfile.server -t stockmakal-api .
docker run -p 4000:4000 stockmakal-api

# Bare metal
node dist/index.js
```

### Full Stack (Docker Compose)

```bash
# Build and start everything
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f api

# Stop everything
docker-compose down
```

---

## 📱 APK Generation (Android)

### Using EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
cd apps/mobile
eas build:configure

# Build APK (for direct install)
eas build --platform android --profile preview

# Build AAB (for Play Store)
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android
```

### Build Profiles (eas.json)

| Profile | Output | Use Case |
|---------|--------|----------|
| `development` | APK with dev client | Testing with debugger |
| `preview` | Standalone APK | Direct distribution |
| `production` | AAB bundle | Google Play Store |

### Local Build (without EAS)

```bash
cd apps/mobile

# Prebuild native projects
npx expo prebuild --platform android

# Build debug APK
cd android && ./gradlew assembleDebug

# APK at: android/app/build/outputs/apk/debug/app-debug.apk
```

### iOS Build

```bash
# Requires macOS + Xcode
cd apps/mobile

# Prebuild
npx expo prebuild --platform ios

# EAS Build
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

---

## 🎤 Voice Commands

Voice commands work on **both web and mobile** platforms. Click/tap the microphone button and speak:

| Command | Example |
|---------|---------|
| Search stock | "Show AAPL chart" |
| Open chart | "Display chart for Tesla" |
| Add indicator | "Add EMA indicator" |
| Remove indicator | "Remove SMA indicator" |
| Change timeframe | "Set 5 minute timeframe" |
| Compare stocks | "Compare AAPL and MSFT" |
| Show signals | "Show trade signals" |
| Set alert | "Set alert for AAPL at 200" |
| Toggle theme | "Toggle dark mode" |
| Screenshot | "Take screenshot" |
| Share | "Share analysis" |
| Export | "Export data" |
| Navigate | "Go back" / "Open settings" |

### Voice API

```bash
# Parse a voice command
curl -X POST http://localhost:4000/api/voice/parse \
  -H "Content-Type: application/json" \
  -d '{"text": "Show AAPL chart"}'

# Get available commands
curl http://localhost:4000/api/voice/commands
```

---

## 🧩 Dynamic Features (Server-Driven UI)

The **Features page** is entirely controlled by the server. This means:
- ✅ Add new features without updating the APK
- ✅ Enable/disable features per platform
- ✅ A/B test features
- ✅ Update icons, descriptions, and routing

### Managing Features

**Via Admin Dashboard:** Navigate to Admin > Features to toggle and edit features.

**Via API:**
```bash
# Get current features
curl http://localhost:4000/api/features?platform=android

# Update all features
curl -X PUT http://localhost:4000/api/features \
  -H "Content-Type: application/json" \
  -d '{...featureConfig}'

# Toggle a feature
curl -X PATCH http://localhost:4000/api/features/screener/toggle

# Add a new feature
curl -X POST http://localhost:4000/api/features/add \
  -H "Content-Type: application/json" \
  -d '{
    "id": "backtest",
    "title": "Backtesting",
    "description": "Test strategies on historical data",
    "icon": "Clock",
    "route": "/backtest",
    "component": "BacktestView",
    "enabled": true,
    "minVersion": "1.0.0",
    "platforms": ["web", "android"],
    "order": 14,
    "badge": "new"
  }'
```

---

## 📊 Indicators Library

### Moving Averages

| Type | Formula | Best For |
|------|---------|----------|
| **SMA** | Simple arithmetic mean | General trend |
| **EMA** | Exponential weighting | Responsive signals |
| **WMA** | Linear weight distribution | Short-term analysis |
| **DEMA** | Double exponential | Reduced lag |
| **TEMA** | Triple exponential | Minimum lag |
| **HMA** | Hull smoothing | Smooth + fast |
| **KAMA** | Volatility adaptive | Market regime changes |

### Kalman Filter

The Kalman Filter provides:
- **State estimation**: Optimal estimate of "true" price
- **Velocity tracking**: Rate of price change (trend strength)
- **Noise reduction**: Adaptive filtering based on volatility
- **Signal generation**: Price vs estimate divergence

```typescript
import { KalmanFilter, adaptiveKalmanFilter } from '@stock-ma-kal/shared';

// Auto-tuned Kalman filter
const result = adaptiveKalmanFilter(prices);
console.log(result.estimates);  // Filtered values
console.log(result.velocities); // Trend direction/strength
```

---

## 🔒 Environment Variables

### Server (`server/.env`)

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stockmakal
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-here
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
ALPHA_VANTAGE_KEY=your-key
FINNHUB_KEY=your-key
```

### Web App (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Mobile (`apps/mobile/.env`)

```env
EXPO_PUBLIC_API_URL=http://localhost:4000
```

---

## 🧪 Testing

```bash
# Run all tests
npm run test

# Test specific package
cd server && npm test
cd packages/shared && npm test
```

---

## 📈 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/quote/:symbol` | Real-time quote |
| GET | `/api/history/:symbol` | Historical OHLCV data |
| GET | `/api/search?q=` | Search stocks |
| POST | `/api/quotes` | Batch quotes |
| POST | `/api/indicators/ma` | Calculate MA |
| POST | `/api/indicators/kalman` | Calculate Kalman filter |
| POST | `/api/indicators/rsi` | Calculate RSI |
| POST | `/api/signals/generate` | Generate trade signal |
| GET | `/api/features` | Get dynamic features |
| POST | `/api/voice/parse` | Parse voice command |
| GET | `/api/voice/commands` | List voice commands |
| GET | `/api/admin/stats` | Admin statistics |
| GET | `/api/admin/health` | System health |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Register |
| WS | `/ws` | WebSocket connection |

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Server won't start | Check PostgreSQL/Redis are running (`docker-compose up -d postgres redis`) |
| CORS errors | Update `CORS_ORIGIN` in server/.env |
| Mobile can't connect | Use your machine's IP instead of localhost: `EXPO_PUBLIC_API_URL=http://192.168.x.x:4000` |
| APK build fails | Run `npx expo prebuild --clean` then rebuild |
| Voice not working | Use Chrome (Web Speech API) or ensure microphone permissions on mobile |
| Features not loading | Check server is running and features endpoint is accessible |

---

## 📋 Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Web** | Next.js 14, React 18, Tailwind | SSR/ISR, fast page loads |
| **Mobile** | Expo, React Native | Cross-platform, OTA updates |
| **Admin** | Next.js 14 | Same stack as web, shared components |
| **API** | Fastify | 2x faster than Express |
| **Cache** | Redis | Sub-ms data retrieval |
| **Database** | PostgreSQL | Reliable, powerful SQL |
| **Charts** | Canvas API + lightweight-charts | 60fps rendering |
| **State** | Zustand | 1KB, no boilerplate |
| **Types** | TypeScript strict | Type safety everywhere |
| **Monorepo** | Turborepo + npm workspaces | Fast builds, shared code |
| **CI/CD** | GitHub Actions + EAS Build | Automated testing & deployment |
| **Containers** | Docker + Docker Compose | Consistent environments |

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
