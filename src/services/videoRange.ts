export type ByteRangeResult =
  | { kind: 'full' }
  | { kind: 'partial'; start: number; end: number }
  | { kind: 'unsatisfiable' };

/** Parse one RFC 9110 byte range. Invalid or multi-range headers are ignored. */
export function parseSingleByteRange(header: string | undefined, totalSize: number): ByteRangeResult {
  if (!header || !Number.isSafeInteger(totalSize) || totalSize < 0) return { kind: 'full' };

  const match = /^bytes=(\d*)-(\d*)$/i.exec(header);
  if (!match) return { kind: 'full' };

  const [, rawStart, rawEnd] = match;
  if (!rawStart && !rawEnd) return { kind: 'full' };
  if (totalSize === 0) return { kind: 'unsatisfiable' };

  if (!rawStart) {
    const suffixLength = Number(rawEnd);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return { kind: 'unsatisfiable' };
    return {
      kind: 'partial',
      start: Math.max(0, totalSize - suffixLength),
      end: totalSize - 1,
    };
  }

  const start = Number(rawStart);
  if (!Number.isSafeInteger(start) || start < 0 || start >= totalSize) return { kind: 'unsatisfiable' };

  const requestedEnd = rawEnd ? Number(rawEnd) : totalSize - 1;
  if (!Number.isSafeInteger(requestedEnd) || requestedEnd < start) return { kind: 'unsatisfiable' };

  return { kind: 'partial', start, end: Math.min(requestedEnd, totalSize - 1) };
}
