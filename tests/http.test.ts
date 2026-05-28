import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MemoriaAuthError,
  MemoriaError,
  MemoriaNotFoundError,
  MemoriaQuotaError,
} from '../src/errors.js';
import { request } from '../src/http.js';

afterEach(() => {
  vi.restoreAllMocks();
});

function mockFetch(response: { status: number; body?: unknown; headers?: Record<string, string> }) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(response.body ? JSON.stringify(response.body) : null, {
      status: response.status,
      headers: { 'content-type': 'application/json', ...response.headers },
    }),
  );
}

describe('request', () => {
  it('sends Authorization bearer header', async () => {
    const fetchSpy = mockFetch({ status: 200, body: { ok: true } });
    await request<{ ok: boolean }>({
      baseURL: 'https://api.example.com',
      apiKey: 'mem_live_abc',
      method: 'GET',
      path: '/v1/health',
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.example.com/v1/health',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer mem_live_abc',
          Accept: 'application/json',
        }),
      }),
    );
  });

  it('serialises body and sets content-type for POST', async () => {
    const fetchSpy = mockFetch({ status: 200, body: { id: 'ep_1' } });
    await request({
      baseURL: 'https://api.example.com',
      apiKey: 'mem_live_abc',
      method: 'POST',
      path: '/v1/episodes',
      body: { content: 'hello' },
    });
    const init = fetchSpy.mock.calls[0]?.[1];
    expect(init?.body).toBe('{"content":"hello"}');
    expect((init?.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });

  it('returns parsed JSON on 2xx', async () => {
    mockFetch({ status: 200, body: { id: 'ep_1' } });
    const out = await request<{ id: string }>({
      baseURL: 'https://api.example.com',
      apiKey: 'mem_live_abc',
      method: 'GET',
      path: '/v1/episodes/ep_1',
    });
    expect(out).toEqual({ id: 'ep_1' });
  });

  it('throws MemoriaAuthError on 401', async () => {
    mockFetch({ status: 401, body: { error: 'bad key' } });
    await expect(
      request({ baseURL: 'https://x', apiKey: 'k', method: 'GET', path: '/v1/health' }),
    ).rejects.toBeInstanceOf(MemoriaAuthError);
  });

  it('throws MemoriaNotFoundError on 404', async () => {
    mockFetch({ status: 404, body: { error: 'nope' } });
    await expect(
      request({ baseURL: 'https://x', apiKey: 'k', method: 'GET', path: '/v1/episodes/x' }),
    ).rejects.toBeInstanceOf(MemoriaNotFoundError);
  });

  it('throws MemoriaQuotaError on 429 and parses Retry-After', async () => {
    mockFetch({ status: 429, body: { error: 'slow down' }, headers: { 'Retry-After': '120' } });
    const err = await request({
      baseURL: 'https://x',
      apiKey: 'k',
      method: 'GET',
      path: '/v1/health',
    }).catch((e) => e);
    expect(err).toBeInstanceOf(MemoriaQuotaError);
    expect((err as MemoriaQuotaError).retryAfter).toBe(120);
  });

  it('throws generic MemoriaError on 5xx', async () => {
    mockFetch({ status: 503, body: { error: 'unavailable' } });
    const err = await request({
      baseURL: 'https://x',
      apiKey: 'k',
      method: 'GET',
      path: '/v1/health',
    }).catch((e) => e);
    expect(err).toBeInstanceOf(MemoriaError);
    expect((err as MemoriaError).status).toBe(503);
  });
});
