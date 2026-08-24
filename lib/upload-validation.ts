export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const MAX_BASE64_LENGTH = Math.ceil((MAX_UPLOAD_BYTES * 4) / 3) + 4;

const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png']);

export type SupportedImageType = 'image/jpeg' | 'image/png';

export type ImagePayloadValidation =
  | { ok: true; mediaType: SupportedImageType; bytes: number }
  | { ok: false; error: string };

/** Validate the JSON image boundary; browser accept/capture attributes are only hints. */
export function validateImagePayload(image: unknown, mediaType: unknown): ImagePayloadValidation {
  if (typeof image !== 'string' || image.length === 0) {
    return { ok: false, error: 'no image' };
  }
  if (typeof mediaType !== 'string' || !SUPPORTED_IMAGE_TYPES.has(mediaType)) {
    return { ok: false, error: 'unsupported image type' };
  }
  if (image.length > MAX_BASE64_LENGTH || !isBase64(image)) {
    return { ok: false, error: 'invalid image payload' };
  }

  const padding = image.endsWith('==') ? 2 : image.endsWith('=') ? 1 : 0;
  const bytes = Math.floor((image.length * 3) / 4) - padding;
  if (bytes > MAX_UPLOAD_BYTES) {
    return { ok: false, error: 'image is too large' };
  }

  return { ok: true, mediaType: mediaType as SupportedImageType, bytes };
}

function isBase64(value: string): boolean {
  return value.length % 4 === 0 && /^[A-Za-z0-9+/]*={0,2}$/.test(value);
}
