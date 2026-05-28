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

  // ---- 0.2.0 additions ---------------------------------------------------

  it('getExtractionStatus() GETs /v1/episodes/:id/extraction-status', async () => {
    const fetchSpy = mockFetchJson(200, {
      status: 'extracted',
      entityCount: 3,
      edgeCount: 2,
    });
    const client = new MemoriaClient({ apiKey: 'mem_live_x' });
    const out = await client.getExtractionStatus('ep_1');
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.memoria.premex.se/v1/episodes/ep_1/extraction-status',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(out.status).toBe('extracted');
    expect(out.edgeCount).toBe(2);
  });

  it('createEntity() POSTs to /v1/entities with defaulted aliases + summary', async () => {
    const fetchSpy = mockFetchJson(201, {
      id: 'ent_new',
      name: 'vite',
      type: 'build_tool',
      summary: '',
      aliases: [],
      episodeIds: [],
      communityId: null,
      createdAt: '2026-05-28T00:00:00.000Z',
      updatedAt: '2026-05-28T00:00:00.000Z',
    });
    const client = new MemoriaClient({ apiKey: 'mem_live_x' });
    const out = await client.createEntity({ name: 'vite', type: 'build_tool' });
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.memoria.premex.se/v1/entities',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'vite', type: 'build_tool', aliases: [], summary: '' }),
      }),
    );
    expect(out.id).toBe('ent_new');
  });

  it('getEntityHistory() GETs /v1/entities/:id/history and forwards asOf + limit', async () => {
    const fetchSpy = mockFetchJson(200, {
      entity: { id: 'ent_1' },
      asOf: '2026-05-01T00:00:00.000Z',
      edges: [],
    });
    const client = new MemoriaClient({ apiKey: 'mem_live_x' });
    await client.getEntityHistory('ent_1', { asOf: '2026-05-01T00:00:00.000Z', limit: 10 });
    const url = (fetchSpy.mock.calls[0]?.[0] ?? '') as string;
    expect(url).toContain('/v1/entities/ent_1/history');
    expect(url).toContain('asOf=2026-05-01');
    expect(url).toContain('limit=10');
  });

  it('relate() POSTs to /v1/edges', async () => {
    const fetchSpy = mockFetchJson(201, { id: 'edge_new' });
    const client = new MemoriaClient({ apiKey: 'mem_live_x' });
    await client.relate({
      fromEntityId: 'ent_a',
      toEntityId: 'ent_b',
      factText: 'a uses b',
      relationType: 'uses',
      tValid: '2026-05-25T00:00:00.000Z',
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.memoria.premex.se/v1/edges',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"fromEntityId":"ent_a"'),
      }),
    );
  });

  it('getRelatedEdges() GETs /v1/edges/:id/related with k', async () => {
    const fetchSpy = mockFetchJson(200, { seedEdge: { id: 'edge_1' }, related: [] });
    const client = new MemoriaClient({ apiKey: 'mem_live_x' });
    await client.getRelatedEdges('edge_1', { k: 50 });
    const url = (fetchSpy.mock.calls[0]?.[0] ?? '') as string;
    expect(url).toContain('/v1/edges/edge_1/related');
    expect(url).toContain('k=50');
  });

  it('forget() PATCHes /v1/edges/:id/invalidate', async () => {
    const fetchSpy = mockFetchJson(200, { id: 'edge_1' });
    const client = new MemoriaClient({ apiKey: 'mem_live_x' });
    await client.forget('edge_1', { tInvalid: '2026-05-28T00:00:00.000Z' });
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.memoria.premex.se/v1/edges/edge_1/invalidate',
      expect.objectContaining({
        method: 'PATCH',
        body: expect.stringContaining('"tInvalid"'),
      }),
    );
  });

  it('regeneratePlaybook() POSTs to /v1/playbooks/regenerate with scope.* query params', async () => {
    const fetchSpy = mockFetchJson(201, { id: 'pb_1' });
    const client = new MemoriaClient({ apiKey: 'mem_live_x' });
    await client.regeneratePlaybook({ branch: 'main', file: 'README.md' });
    const url = (fetchSpy.mock.calls[0]?.[0] ?? '') as string;
    expect(url).toContain('/v1/playbooks/regenerate');
    expect(url).toContain('scope.branch=main');
    expect(url).toContain(`scope.file=${encodeURIComponent('README.md')}`);
  });
});
