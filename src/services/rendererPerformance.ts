export interface AdaptiveRenderBudgetOptions {
  minPixelRatio?: number;
  maxPixelRatio?: number;
  sampleSize?: number;
  slowFrameMs?: number;
  fastFrameMs?: number;
}

/**
 * Keeps a renderer inside a stable frame-time budget without oscillating DPR
 * on borderline hardware. The controller only emits a change after a full
 * sample window, so resize/post-processing work is amortized.
 */
export class AdaptiveRenderBudget {
  private readonly minPixelRatio: number;
  private readonly maxPixelRatio: number;
  private readonly sampleSize: number;
  private readonly slowFrameMs: number;
  private readonly fastFrameMs: number;
  private frameTimes: number[] = [];
  private currentPixelRatio: number;

  public constructor(initialPixelRatio: number, options: AdaptiveRenderBudgetOptions = {}) {
    this.minPixelRatio = options.minPixelRatio ?? 0.75;
    this.maxPixelRatio = options.maxPixelRatio ?? 2;
    this.sampleSize = options.sampleSize ?? 45;
    this.slowFrameMs = options.slowFrameMs ?? 24;
    this.fastFrameMs = options.fastFrameMs ?? 15;
    this.currentPixelRatio = clamp(initialPixelRatio, this.minPixelRatio, this.maxPixelRatio);
  }

  public get pixelRatio(): number {
    return this.currentPixelRatio;
  }

  /** Returns a new DPR only when the rolling sample justifies a change. */
  public sample(frameTimeMs: number): number | null {
    if (!Number.isFinite(frameTimeMs) || frameTimeMs <= 0) return null;
    this.frameTimes.push(frameTimeMs);
    if (this.frameTimes.length < this.sampleSize) return null;

    const averageFrameMs = this.frameTimes.reduce((sum, value) => sum + value, 0) / this.frameTimes.length;
    this.frameTimes.length = 0;

    const nextPixelRatio = averageFrameMs > this.slowFrameMs
      ? this.currentPixelRatio - 0.25
      : averageFrameMs < this.fastFrameMs
        ? this.currentPixelRatio + 0.125
        : this.currentPixelRatio;
    const clamped = clamp(nextPixelRatio, this.minPixelRatio, this.maxPixelRatio);

    if (Math.abs(clamped - this.currentPixelRatio) < 0.001) return null;
    this.currentPixelRatio = clamped;
    return clamped;
  }
}

export function getInitialPixelRatio(devicePixelRatio: number, deviceMemory?: number): number {
  const safeDpr = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;
  const memoryCap = Number.isFinite(deviceMemory) && (deviceMemory ?? 0) <= 4 ? 1.25 : 2;
  return clamp(Math.min(safeDpr, 2), 0.75, memoryCap);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
