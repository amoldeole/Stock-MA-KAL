# Kalman Filter — Technical Deep Dive

## Overview

The Kalman Filter is a recursive algorithm that estimates the state of a dynamic system from noisy measurements. In Stock MA-KAL, we use it for:

1. **Price Tracking**: Estimate the "true" price from noisy market data
2. **Trend Detection**: Velocity component reveals trend direction and strength
3. **Noise Reduction**: Adaptive filtering based on market volatility
4. **Signal Generation**: Divergence between actual price and Kalman estimate

## State-Space Model

### State Vector
```
x = [position, velocity]'
```
- **position**: Estimated "true" price
- **velocity**: Rate of change (trend strength)

### State Transition (Prediction)
```
F = [1, dt]
    [0,  1]

x_pred = F * x_prev
P_pred = F * P_prev * F' + Q
```

### Measurement Update
```
H = [1, 0]  (we observe position only)

y = z - H * x_pred        (innovation)
S = H * P_pred * H' + R   (innovation covariance)
K = P_pred * H' * S^(-1)  (Kalman gain)

x = x_pred + K * y        (updated state)
P = (I - K * H) * P_pred  (updated covariance)
```

## Parameters

| Parameter | Symbol | Effect |
|-----------|--------|--------|
| Process Noise | Q | Higher = more responsive to changes |
| Measurement Noise | R | Higher = smoother estimates |
| Initial Error | P₀ | Higher = faster initial convergence |

## Adaptive Kalman Filter

The `adaptiveKalmanFilter()` function automatically tunes Q and R based on:
1. Historical return variance
2. Current price level
3. Rolling volatility window

```typescript
const result = adaptiveKalmanFilter(prices, windowSize = 20);
// result.estimates - filtered price values
// result.velocities - trend strength (positive = uptrend)
// result.states - full state history
```

## Trading Signals from Kalman

### Velocity-Based Signal
- Positive velocity → Uptrend (buy bias)
- Negative velocity → Downtrend (sell bias)
- High |velocity| → Strong trend
- Near-zero velocity → Sideways market

### Price vs Estimate Divergence
- Price above estimate → Potential pullback
- Price below estimate → Potential bounce
- Large divergence → Mean reversion opportunity

### Combined Signal
The `generateSignal()` function combines Kalman with:
- MA crossovers (golden/death cross)
- RSI overbought/oversold
- Volume confirmation

Result: Composite signal with confidence score (0-100).
