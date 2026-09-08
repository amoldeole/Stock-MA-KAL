// ============================================================
// Kalman Filter Implementation
// State-space model for adaptive price tracking
// Handles noise reduction + trend estimation simultaneously
// ============================================================

import { KalmanFilterConfig, KalmanState } from '../types';

export class KalmanFilter {
  // State transition matrix (constant velocity model)
  private F: number[][];
  // Measurement matrix
  private H: number[][];
  // Process noise covariance
  private Q: number[][];
  // Measurement noise covariance
  private R: number[][];
  // State estimate
  private x: number[];
  // Error covariance
  private P: number[][];
  // Last timestamp
  private lastTimestamp: number;
  // History for visualization
  private history: KalmanState[];

  constructor(config: KalmanFilterConfig) {
    const dt = 1; // Default time step

    // State transition matrix: [position, velocity]
    this.F = [
      [1, dt],
      [0, 1],
    ];

    // Measurement matrix: we observe position only
    this.H = [[1, 0]];

    // Process noise covariance
    this.Q = [
      [config.processNoise, 0],
      [0, config.processNoise * 0.1],
    ];

    // Measurement noise covariance
    this.R = [[config.measurementNoise]];

    // Initial state
    const initVal = config.initialValue ?? 0;
    this.x = [initVal, 0]; // [position, velocity]

    // Initial error covariance
    this.P = [
      [config.estimateError, 0],
      [0, config.estimateError],
    ];

    this.lastTimestamp = Date.now();
    this.history = [];
  }

  /**
   * Predict step - project state forward
   */
  private predict(dt: number = 1): void {
    // Update state transition with actual dt
    this.F[0][1] = dt;

    // x = F * x
    const newX = [
      this.F[0][0] * this.x[0] + this.F[0][1] * this.x[1],
      this.F[1][0] * this.x[0] + this.F[1][1] * this.x[1],
    ];

    // P = F * P * F' + Q
    const newP = this.matrixAdd(
      this.matrixMultiply(
        this.matrixMultiply(this.F, this.P),
        this.transpose(this.F)
      ),
      this.Q
    );

    this.x = newX;
    this.P = newP;
  }

  /**
   * Update step - incorporate measurement
   */
  private update(measurement: number): number {
    // Innovation: y = z - H * x
    const y = measurement - (this.H[0][0] * this.x[0] + this.H[0][1] * this.x[1]);

    // Innovation covariance: S = H * P * H' + R
    const S = this.matrixAdd(
      this.matrixMultiply(
        this.matrixMultiply(this.H, this.P),
        this.transpose(this.H)
      ),
      this.R
    );

    // Kalman Gain: K = P * H' * S^(-1)
    const SInv = [[1 / S[0][0]]];
    const K = this.matrixMultiply(
      this.matrixMultiply(this.P, this.transpose(this.H)),
      SInv
    );

    // Updated state: x = x + K * y
    this.x = [
      this.x[0] + K[0][0] * y,
      this.x[1] + K[1][0] * y,
    ];

    // Updated covariance: P = (I - K * H) * P
    const KH = this.matrixMultiply(K, this.H);
    const I = [
      [1 - KH[0][0], -KH[0][1]],
      [-KH[1][0], 1 - KH[1][1]],
    ];
    this.P = this.matrixMultiply(I, this.P);

    return S[0][0]; // Return innovation covariance for diagnostics
  }

  /**
   * Process a new measurement
   */
  process(measurement: number, timestamp?: number): KalmanState {
    const now = timestamp ?? Date.now();
    const dt = Math.max((now - this.lastTimestamp) / 1000, 0.001); // seconds, min 1ms

    // Predict
    this.predict(dt);

    // Update
    const innovationCov = this.update(measurement);

    // Calculate Kalman gain (scalar for 1D measurement)
    const S = this.H[0][0] * this.P[0][0] * this.H[0][0] + this.R[0][0];
    const kalmanGain = (this.P[0][0] * this.H[0][0]) / S;

    this.lastTimestamp = now;

    const state: KalmanState = {
      value: measurement,
      velocity: this.x[1],
      estimate: this.x[0],
      covariance: this.P[0][0],
      kalmanGain,
      timestamp: now,
    };

    this.history.push(state);
    return state;
  }

  /**
   * Process batch of measurements
   */
  processBatch(
    measurements: number[],
    timestamps?: number[]
  ): KalmanState[] {
    return measurements.map((m, i) => this.process(m, timestamps?.[i]));
  }

  /**
   * Get filtered values (position estimates)
   */
  getFilteredValues(): number[] {
    return this.history.map((s) => s.estimate);
  }

  /**
   * Get velocity estimates (trend strength)
   */
  getVelocities(): number[] {
    return this.history.map((s) => s.velocity);
  }

  /**
   * Get full history
   */
  getHistory(): KalmanState[] {
    return [...this.history];
  }

  /**
   * Get current state
   */
  getCurrentState(): KalmanState | null {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null;
  }

  /**
   * Reset filter
   */
  reset(config?: KalmanFilterConfig): void {
    if (config) {
      const initVal = config.initialValue ?? 0;
      this.x = [initVal, 0];
      this.P = [
        [config.estimateError, 0],
        [0, config.estimateError],
      ];
      this.Q = [
        [config.processNoise, 0],
        [0, config.processNoise * 0.1],
      ];
      this.R = [[config.measurementNoise]];
    } else {
      this.x = [0, 0];
      this.P = [[1, 0], [0, 1]];
    }
    this.history = [];
  }

  // ─── Matrix Operations ─────────────────────────────────────

  private matrixMultiply(a: number[][], b: number[][]): number[][] {
    const rows = a.length;
    const cols = b[0].length;
    const inner = b.length;
    const result: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        for (let k = 0; k < inner; k++) {
          result[i][j] += a[i][k] * b[k][j];
        }
      }
    }

    return result;
  }

  private matrixAdd(a: number[][], b: number[][]): number[][] {
    return a.map((row, i) => row.map((val, j) => val + b[i][j]));
  }

  private transpose(m: number[][]): number[][] {
    return m[0].map((_, j) => m.map((row) => row[j]));
  }
}

// ─── Convenience: Apply Kalman filter to price series ────────
export function kalmanFilter(
  data: number[],
  config?: Partial<KalmanFilterConfig>
): { estimates: number[]; velocities: number[]; states: KalmanState[] } {
  const filter = new KalmanFilter({
    processNoise: config?.processNoise ?? 0.01,
    measurementNoise: config?.measurementNoise ?? 1.0,
    estimateError: config?.estimateError ?? 1.0,
    initialValue: config?.initialValue ?? data[0],
  });

  const states = filter.processBatch(data);

  return {
    estimates: states.map((s) => s.estimate),
    velocities: states.map((s) => s.velocity),
    states,
  };
}

// ─── Adaptive Kalman: auto-tune noise parameters ─────────────
export function adaptiveKalmanFilter(
  data: number[],
  windowSize: number = 20
): { estimates: number[]; velocities: number[]; states: KalmanState[] } {
  // Estimate noise from data statistics
  const returns: number[] = [];
  for (let i = 1; i < data.length; i++) {
    returns.push((data[i] - data[i - 1]) / data[i - 1]);
  }

  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + (b - meanReturn) ** 2, 0) / returns.length;
  const volatility = Math.sqrt(variance);

  return kalmanFilter(data, {
    processNoise: volatility * 0.1,
    measurementNoise: volatility * data[0],
    estimateError: volatility * data[0] * 10,
    initialValue: data[0],
  });
}
