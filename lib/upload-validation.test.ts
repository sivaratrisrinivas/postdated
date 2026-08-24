import { describe, expect, it } from 'vitest';
import { MAX_BASE64_LENGTH, validateImagePayload } from './upload-validation';

describe('validateImagePayload', () => {
  it('accepts a bounded JPEG base64 payload', () => {
    expect(validateImagePayload('aGVsbG8=', 'image/jpeg')).toEqual({
      ok: true,
      mediaType: 'image/jpeg',
      bytes: 5,
    });
  });

  it('rejects a media type outside the image route contract', () => {
    expect(validateImagePayload('aGVsbG8=', 'application/pdf')).toEqual({
      ok: false,
      error: 'unsupported image type',
    });
  });

  it('rejects WebP because the live Cerebras reader accepts JPEG and PNG only', () => {
    expect(validateImagePayload('aGVsbG8=', 'image/webp')).toEqual({
      ok: false,
      error: 'unsupported image type',
    });
  });

  it('rejects malformed base64 instead of forwarding it to the provider', () => {
    expect(validateImagePayload('not base64!', 'image/jpeg')).toEqual({
      ok: false,
      error: 'invalid image payload',
    });
  });

  it('rejects a payload over the image size limit', () => {
    expect(validateImagePayload('A'.repeat(MAX_BASE64_LENGTH + 4), 'image/jpeg')).toEqual({
      ok: false,
      error: 'invalid image payload',
    });
  });
});
