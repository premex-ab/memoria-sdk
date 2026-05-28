import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoriaClient } from '../src/client.js';

afterEach(() => {
  vi.restoreAllMocks();
});

function mockFetchJson(status: number, body: unknown) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    }),
  );
}

describe('MemoriaClient', () => {
  it('uses default baseURL when not specified', () => {
    const client = new MemoriaClient({ apiKey: 'mem_live_x' });
    expect(client.baseURL).toBe('https://api.memoria.premex.se');
  });

  it('respects custom baseURL', () => {
    const client = new MemoriaClient({ apiKey: 'mem_live_x', baseURL: 'http://localhost:8787' });
    expect(client.baseURL).toBe('http://localhost:8787');
  });

  it('remember() POSTs to /v1/episodes', async () => {
    const fetchSpy = mockFetchJson(200, {
      episodeId: 'ep_1',
      extractedEntities: [],
      extractedFacts: [],
    });
    const client = new MemoriaClient({ apiKey: 'mem_live_x' });
    const out = await client.remember({ content: 'hello', source: 'agent' });
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.memoria.premex.se/v1/episodes',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(out.episodeId).toBe('ep_1');
  });

  it('recall() POSTs to /v1/recall', async () => {
    const fetchSpy = mockFetchJson(200, { results: [] });
    const client = new MemoriaClient({ apiKey: 'mem_live_x' });
    await client.recall({ query: 'what did I decide about pnpm?' });
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.memoria.premex.se/v1/recall',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('getEntity() GETs /v1/entities/:id', async () => {
    mockFetchJson(200, {
      id: 'ent_1',
      name: 'pnpm',
      type: 'tool',
      summary: '',
      aliases: [],
      episodeIds: [],
      communityId: null,
      createdAt: '2026-05-26T00:00:00.000Z',
      updatedAt: '2026-05-26T00:00:00.000Z',
    });
    const client = new MemoriaClient({ apiKey: 'mem_live_x' });
    const ent = await client.getEntity('ent_1');
    expect(ent.id).toBe('ent_1');
  });

  it('listPlaybooks() GETs /v1/playbooks', async () => {
    mockFetchJson(200, { playbooks: [] });
    const client = new MemoriaClient({ apiKey: 'mem_live_x' });
    const list = await client.listPlaybooks();
    expect(list.playbooks).toEqual([]);
  });
});
