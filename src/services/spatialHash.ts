export interface SpatialBounds2D {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface SpatialEntry<T> extends SpatialBounds2D {
  value: T;
}

/**
 * Uniform-grid broadphase for the relatively bounded Požarevac playfield.
 * Insert and query are O(1) average for local neighbourhoods; exact overlap
 * tests remain in the narrow phase owned by the caller.
 */
export class SpatialHash2D<T> {
  private readonly cellSize: number;
  private readonly buckets = new Map<string, SpatialEntry<T>[]>();

  public constructor(cellSize = 8) {
    if (!Number.isFinite(cellSize) || cellSize <= 0) throw new Error('cellSize must be positive');
    this.cellSize = cellSize;
  }

  public clear(): void {
    this.buckets.clear();
  }

  public insert(entry: SpatialEntry<T>): void {
    if (!isFiniteBounds(entry)) return;
    for (const cell of this.cellsFor(entry)) {
      const bucket = this.buckets.get(cell);
      if (bucket) bucket.push(entry);
      else this.buckets.set(cell, [entry]);
    }
  }

  public query(bounds: SpatialBounds2D): T[] {
    if (!isFiniteBounds(bounds)) return [];
    const result: T[] = [];
    const seen = new Set<SpatialEntry<T>>();
    for (const cell of this.cellsFor(bounds)) {
      for (const entry of this.buckets.get(cell) ?? []) {
        if (seen.has(entry)) continue;
        seen.add(entry);
        if (overlaps(entry, bounds)) result.push(entry.value);
      }
    }
    return result;
  }

  public get size(): number {
    let count = 0;
    for (const bucket of this.buckets.values()) count += bucket.length;
    return count;
  }

  private cellsFor(bounds: SpatialBounds2D): string[] {
    const minCellX = Math.floor(bounds.minX / this.cellSize);
    const maxCellX = Math.floor(bounds.maxX / this.cellSize);
    const minCellZ = Math.floor(bounds.minZ / this.cellSize);
    const maxCellZ = Math.floor(bounds.maxZ / this.cellSize);
    const cells: string[] = [];
    for (let x = minCellX; x <= maxCellX; x += 1) {
      for (let z = minCellZ; z <= maxCellZ; z += 1) cells.push(`${x}:${z}`);
    }
    return cells;
  }
}

function overlaps(a: SpatialBounds2D, b: SpatialBounds2D): boolean {
  return a.minX <= b.maxX && a.maxX >= b.minX && a.minZ <= b.maxZ && a.maxZ >= b.minZ;
}

function isFiniteBounds(bounds: SpatialBounds2D): boolean {
  return [bounds.minX, bounds.maxX, bounds.minZ, bounds.maxZ].every(Number.isFinite)
    && bounds.minX <= bounds.maxX
    && bounds.minZ <= bounds.maxZ;
}
