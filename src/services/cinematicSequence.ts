/**
 * Returns the next clip index, or null when the sequence has no remaining clip.
 * Invalid indexes/counts fail closed instead of producing an out-of-range index.
 */
export function getNextCinematicClipIndex(currentIndex: number, clipCount: number): number | null {
  if (!Number.isInteger(currentIndex) || !Number.isInteger(clipCount) || clipCount < 1) return null;
  if (currentIndex < 0 || currentIndex >= clipCount - 1) return null;
  return currentIndex + 1;
}
