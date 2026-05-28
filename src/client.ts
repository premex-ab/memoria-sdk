import { request } from './http.js';
import type { Edge, Entity, Episode, EpisodeSource, Playbook } from './types.js';

const DEFAULT_BASE_URL = 'https://api.memoria.premex.se';

export interface MemoriaClientOptions {
  apiKey: string;
  baseURL?: string;
}

export interface RememberParams {
  content: string;
  source?: EpisodeSource;
  sessionId?: string;
  metadata?: Record<string, unknown>;
  // Note: Idempotency-Key header support arrives in Phase 6e; the field
  // will be added back to this interface once the http layer forwards
  // arbitrary headers.
}

export interface RememberResult {
  episodeId: string;
  extractedEntities: Array<{ id: string; name: string }>;
  extractedFacts: Array<{ id: string; factText: string }>;
}

export interface RecallParams {
  query: string;
  asOf?: string;
  tags?: string[];
  entities?: string[];
  k?: number;
  includeProvenance?: boolean;
}

export interface RecallResult {
  results: Array<{
    edge: Edge;
    fromEntity: Entity;
    toEntity: Entity;
    contextEpisodes?: Episode[];
    score: number;
  }>;
}

export class MemoriaClient {
  readonly baseURL: string;
  readonly apiKey: string;

  constructor(opts: MemoriaClientOptions) {
    this.apiKey = opts.apiKey;
    this.baseURL = opts.baseURL ?? DEFAULT_BASE_URL;
  }

  remember(params: RememberParams): Promise<RememberResult> {
    return request<RememberResult>({
      baseURL: this.baseURL,
      apiKey: this.apiKey,
      method: 'POST',
      path: '/v1/episodes',
      body: {
        content: params.content,
        source: params.source ?? 'agent',
        sessionId: params.sessionId,
        metadata: params.metadata,
      },
      // Idempotency-Key header support added in Phase 6e.
    });
  }

  recall(params: RecallParams): Promise<RecallResult> {
    return request<RecallResult>({
      baseURL: this.baseURL,
      apiKey: this.apiKey,
      method: 'POST',
      path: '/v1/recall',
      body: params,
    });
  }

  getEntity(id: string): Promise<Entity> {
    return request<Entity>({
      baseURL: this.baseURL,
      apiKey: this.apiKey,
      method: 'GET',
      path: `/v1/entities/${encodeURIComponent(id)}`,
    });
  }

  getEdge(id: string): Promise<Edge> {
    return request<Edge>({
      baseURL: this.baseURL,
      apiKey: this.apiKey,
      method: 'GET',
      path: `/v1/edges/${encodeURIComponent(id)}`,
    });
  }

  getEpisode(id: string): Promise<Episode> {
    return request<Episode>({
      baseURL: this.baseURL,
      apiKey: this.apiKey,
      method: 'GET',
      path: `/v1/episodes/${encodeURIComponent(id)}`,
    });
  }

  listPlaybooks(): Promise<{ playbooks: Playbook[] }> {
    return request<{ playbooks: Playbook[] }>({
      baseURL: this.baseURL,
      apiKey: this.apiKey,
      method: 'GET',
      path: '/v1/playbooks',
    });
  }

  getPlaybook(id: string): Promise<Playbook> {
    return request<Playbook>({
      baseURL: this.baseURL,
      apiKey: this.apiKey,
      method: 'GET',
      path: `/v1/playbooks/${encodeURIComponent(id)}`,
    });
  }
}
