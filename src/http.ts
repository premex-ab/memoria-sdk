import {
  MemoriaAuthError,
  MemoriaError,
  MemoriaNotFoundError,
  MemoriaQuotaError,
} from './errors.js';

export interface RequestParams {
  baseURL: string;
  apiKey: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
}

export async function request<T = unknown>(params: RequestParams): Promise<T> {
  const url = new URL(params.path, params.baseURL);
  if (params.query) {
    for (const [k, v] of Object.entries(params.query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${params.apiKey}`,
    Accept: 'application/json',
  };
  let body: string | undefined;
  if (params.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(params.body);
  }

  const res = await fetch(url.toString(), {
    method: params.method,
    headers,
    body,
    signal: params.signal,
  });

  if (res.ok) {
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  let payload: { error?: string; message?: string } = {};
  try {
    payload = (await res.json()) as typeof payload;
  } catch {
    // body wasn't JSON; fall through
  }
  const message = payload.error ?? payload.message ?? `HTTP ${res.status}`;

  switch (res.status) {
    case 401:
    case 403:
      throw new MemoriaAuthError(message);
    case 404:
      throw new MemoriaNotFoundError(message);
    case 429: {
      const retryAfterHeader = res.headers.get('Retry-After');
      const retryAfter = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) : undefined;
      throw new MemoriaQuotaError(message, { retryAfter });
    }
    default:
      throw new MemoriaError(message, { status: res.status, code: 'http_error' });
  }
}
