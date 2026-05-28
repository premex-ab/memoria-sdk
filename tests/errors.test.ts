import { describe, expect, it } from 'vitest';
import {
  MemoriaAuthError,
  MemoriaError,
  MemoriaNotFoundError,
  MemoriaQuotaError,
} from '../src/errors.js';

describe('MemoriaError', () => {
  it('preserves status, code, and message', () => {
    const e = new MemoriaError('boom', { status: 500, code: 'internal' });
    expect(e.message).toBe('boom');
    expect(e.status).toBe(500);
    expect(e.code).toBe('internal');
  });

  it('MemoriaAuthError marks status 401', () => {
    const e = new MemoriaAuthError('bad key');
    expect(e.status).toBe(401);
    expect(e.code).toBe('unauthenticated');
  });

  it('MemoriaQuotaError marks status 429 and exposes retryAfter', () => {
    const e = new MemoriaQuotaError('over limit', { retryAfter: 60 });
    expect(e.status).toBe(429);
    expect(e.code).toBe('quota_exceeded');
    expect(e.retryAfter).toBe(60);
  });

  it('MemoriaNotFoundError marks status 404', () => {
    const e = new MemoriaNotFoundError('no such episode');
    expect(e.status).toBe(404);
    expect(e.code).toBe('not_found');
  });
});
