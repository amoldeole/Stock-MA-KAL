# Stock MA-KAL API Documentation

## Base URL
```
Development: http://localhost:4000/api
Production: https://api.stockmakal.com/api
```

## Authentication
Most endpoints are public. Admin endpoints require JWT:
```
Authorization: Bearer <token>
```

## Endpoints

### GET /api/quote/:symbol
Get real-time stock quote.
```json
{
  "success": true,
  "data": {
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "exchange": "NASDAQ",
    "price": 195.42,
    "change": 2.31,
    "changePercent": 1.20,
    "volume": 45230000,
    "marketCap": 3020000000000,
    "timestamp": 1715000000000
  }
}
```

### GET /api/history/:symbol?timeframe=1d&limit=500
Get historical OHLCV data.

**Query Parameters:**
- `timeframe`: 1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w, 1M
- `limit`: 1-2000 (default: 500)

### POST /api/indicators/ma
Calculate moving average.
```json
{
  "symbol": "AAPL",
  "timeframe": "1d",
  "config": {
    "type": "EMA",
    "period": 20,
    "field": "close"
  }
}
```

### POST /api/indicators/kalman
Calculate Kalman filter estimates.
```json
{
  "symbol": "AAPL",
  "timeframe": "1d",
  "config": {
    "processNoise": 0.01,
    "measurementNoise": 1.0,
    "estimateError": 1.0
  }
}
```

### POST /api/signals/generate
Generate composite trading signal.
```json
{
  "symbol": "AAPL",
  "timeframe": "1d"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "buy",
    "confidence": 72,
    "reason": "Golden cross detected. RSI recovering from oversold",
    "timestamp": 1715000000000,
    "indicators": {
      "ma_crossover": 1,
      "rsi": 42.5,
      "kalman_velocity": 0.0023,
      "volume_ratio": 1.3
    }
  }
}
```

### GET /api/features?platform=web
Get dynamic feature configuration.

### POST /api/voice/parse
Parse voice command text.
```json
{
  "text": "Show AAPL chart"
}
```

## WebSocket

Connect to `ws://localhost:4000/ws`

### Subscribe to prices
```json
{ "type": "subscribe", "symbols": ["AAPL", "MSFT"] }
```

### Price update event
```json
{
  "type": "price_update",
  "data": {
    "symbol": "AAPL",
    "price": 195.42,
    "change": 2.31,
    "changePercent": 1.20,
    "timestamp": 1715000000000
  }
}
```
