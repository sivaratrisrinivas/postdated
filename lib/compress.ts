/**
 * Venue wifi kills demos (§7 stack notes), so a 12-megapixel phone photo never goes up
 * the wire at full size.
 *
 * 2576px on the long edge is not an arbitrary shrink — it is exactly the resolution
 * Claude Opus 5's vision stack uses. Below it you lose 9pt type; above it you pay for
 * pixels the model discards. So this both cuts the upload and keeps every readable
 * character of a photographed discharge summary.
 */
const MAX_EDGE = 2576;
const QUALITY = 0.85;

export interface CompressedImage {
  /** Base64, no data-URL prefix and no newlines — the API rejects both. */
  base64: string;
  media_type: 'image/jpeg';
  bytes: number;
}

export async function compressForUpload(file: File): Promise<CompressedImage> {
  const bitmap = await createImageBitmap(file);

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);

  return { base64, media_type: 'image/jpeg', bytes: Math.round((base64.length * 3) / 4) };
}
