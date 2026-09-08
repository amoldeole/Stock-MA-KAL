# Deployment Guide

## Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Domain name (for production)

## Quick Deploy (Docker)

### 1. Clone and configure
```bash
git clone <repo-url>
cd Stock-MA-KAL
cp server/.env.example server/.env
# Edit server/.env with production values
```

### 2. Start all services
```bash
docker-compose up -d --build
```

### 3. Verify
```bash
curl http://localhost:4000/api/health
curl http://localhost:3000
curl http://localhost:3001
```

## Vercel Deployment (Web + Admin)

### Web App
```bash
cd apps/web
npx vercel --prod
```

### Admin
```bash
cd apps/admin
npx vercel --prod
```

Set environment variable:
```
NEXT_PUBLIC_API_URL=https://api.stockmakal.com
```

## Railway/Render (API Server)

1. Connect GitHub repository
2. Set build command: `cd server && npm install && npm run build`
3. Set start command: `cd server && node dist/index.js`
4. Set environment variables from server/.env

## Mobile App (Expo EAS)

### First Time Setup
```bash
npm install -g eas-cli
eas login
cd apps/mobile
eas build:configure
```

### Build APK
```bash
eas build --platform android --profile preview
```

### Build for Play Store
```bash
eas build --platform android --profile production
eas submit --platform android
```

### Build for App Store
```bash
eas build --platform ios --profile production
eas submit --platform ios
```

## Environment Variables (Production)

### Server
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
JWT_SECRET=<strong-random-secret>
CORS_ORIGIN=https://stockmakal.com,https://admin.stockmakal.com
ALPHA_VANTAGE_KEY=<real-key>
FINNHUB_KEY=<real-key>
```

### Web
```env
NEXT_PUBLIC_API_URL=https://api.stockmakal.com
```

### Mobile
```env
EXPO_PUBLIC_API_URL=https://api.stockmakal.com
```

## Scaling

### Horizontal Scaling
- API: Run multiple instances behind a load balancer
- Web: Vercel/CDN auto-scales
- Database: Use managed PostgreSQL (RDS, Supabase)
- Cache: Use managed Redis (Upstash, ElastiCache)

### Performance Tips
1. Enable Redis caching (already configured)
2. Use CDN for static assets
3. Enable gzip compression
4. Set proper cache headers
5. Use connection pooling for PostgreSQL
