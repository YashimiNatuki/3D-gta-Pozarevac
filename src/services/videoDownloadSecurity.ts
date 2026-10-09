const GOOGLE_VIDEO_HOSTS = new Set(['generativelanguage.googleapis.com', 'storage.googleapis.com']);
export const MAX_GENERATED_VIDEO_BYTES = 100 * 1024 * 1024;

/** Accept only operation resource names, never arbitrary URLs or host/path input. */
export function isValidVideoOperationName(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length <= 512 &&
    /^(?:operations|models\/[A-Za-z0-9._-]+\/operations)\/[A-Za-z0-9_-]{1,256}$/.test(value)
  );
}

/** Google operation responses may point only at the documented Google video hosts. */
export function isAllowedGoogleVideoUri(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 4096) return false;

  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !url.port &&
      GOOGLE_VIDEO_HOSTS.has(url.hostname.toLowerCase())
    );
  } catch {
    return false;
  }
}

export async function readResponseBodyLimited(
  response: Response,
  maxBytes: number = MAX_GENERATED_VIDEO_BYTES
): Promise<Uint8Array> {
  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new Error('Generated video exceeds the allowed download size.');
  }
  if (!response.body) throw new Error('Generated video response has no body.');

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new Error('Generated video exceeds the allowed download size.');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const result = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}
