import { request } from './http.js';
import type {
  Edge,
  Entity,
  EntityHistoryResponse,
  Episode,
  EpisodeSource,
  ExtractionStatusResponse,
  Playbook,
  PlaybookScope,
  RelatedEdgesResponse,
} from './types.js';

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

export interface CreateEntityParams {
  name: string;
  type: string;
  aliases?: string[];
  summary?: string;
}

export interface GetEntityHistoryParams {
  /** ISO-8601 datetime; only edges with `tIngested <= asOf` are returned. Defaults to now. */
  asOf?: string;
  /** Page size (default 50, max 500). */
  limit?: number;
}

export interface RelateParams {
  fromEntityId: string;
  toEntityId: string;
  factText: string;
  relationType: string;
  /** ISO-8601 datetime when the fact became true in the world. */
  tValid: string;
  /** Optional event-time invalidation. Omit or null when currently true. */
  tInvalid?: string | null;
}

export interface GetRelatedEdgesParams {
  /** Page size (default 20, max 100). */
  k?: number;
}

export interface ForgetParams {
  /** ISO-8601 datetime when the fact stopped being true. */
  tInvalid: string;
  /** Optional id of the edge that supersedes this one. */
  supersededBy?: string | null;
}

export class MemoriaClient {
  readonly baseURL: string;
  readonly apiKey: string;

  constructor(opts: MemoriaClientOptions) {
    this.apiKey = opts.apiKey;
    this.baseURL = opts.baseURL ?? DEFAULT_BASE_URL;
  }

  /** POST /v1/episodes — runs the 7-stage extraction pipeline. */
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
    });
  }

  /** POST /v1/recall — hybrid dense + sparse + graph retrieval, sub-second p50. */
  recall(params: RecallParams): Promise<RecallResult> {
    return request<RecallResult>({
      baseURL: this.baseURL,
      apiKey: this.apiKey,
      method: 'POST',
      path: '/v1/recall',
      body: params,
    });
  }

  /** GET /v1/episodes/:id */
  getEpisode(id: string): Promise<Episode> {
    return request<Episode>({
      baseURL: this.baseURL,
      apiKey: this.apiKey,
      method: 'GET',
      path: `/v1/episodes/${encodeURIComponent(id)}`,
    });
  }

  /** GET /v1/episodes/:id/extraction-status — poll after `remember({ async: true })`. */
  getExtractionStatus(episodeId: string): Promise<ExtractionStatusResponse> {
    return request<ExtractionStatusResponse>({
      baseURL: this.baseURL,
      apiKey: this.apiKey,
      method: 'GET',
      path: `/v1/episodes/${encodeURIComponent(episodeId)}/extraction-status`,
    });
  }

  /** POST /v1/entities — pre-seed an entity before writing related episodes. */
  createEntity(params: CreateEntityParams): Promise<Entity> {
    return request<Entity>({
      baseURL: this.baseURL,
      apiKey: this.apiKey,
      method: 'POST',
      path: '/v1/entities',
      body: {
        name: params.name,
        type: params.type,
        aliases: params.aliases ?? [],
        summary: params.summary ?? '',
      },
    });
  }

  /** GET /v1/entities/:id */
  getEntity(id: string): Promise<Entity> {
    return request<Entity>({
      baseURL: this.baseURL,
      apiKey: this.apiKey,
      method: 'GET',
      path: `/v1/entities/${encodeURIComponent(id)}`,
    });
  }

  /**
   * GET /v1/entities/:id/history — timeline of edges touching the entity,
   * ordered by `tIngested` desc and bi-temporally filtered by `asOf`.
   * Each entry is decorated with its supersession target.
   */
  getEntityHistory(
    id: string,
    params: GetEntityHistoryParams = {},
  ): Promise<EntityHistoryResponse> {
    return request<EntityHistoryResponse>({
      baseURL: this.baseURL,
      apiKey: this.apiKey,
      method: 'GET',
      path: `/v1/entities/${encodeURIComponent(id)}/history`,
      query: { asOf: params.asOf, limit: params.limit },
    });
  }

  /** POST /v1/edges — create a bi-temporal fact between two existing entities. */
  relate(params: RelateParams): Promise<Edge> {
    return request<Edge>({
      baseURL: this.baseURL,
      apiKey: this.apiKey,
      method: 'POST',
      path: '/v1/edges',
      body: {
        fromEntityId: params.fromEntityId,
        toEntityId: params.toEntityId,
        factText: params.factText,
        relationType: params.relationType,
        tValid: params.tValid,
        tInvalid: params.tInvalid,
      },
    });
  }

  /** GET /v1/edges/:id */
  getEdge(id: string): Promise<Edge> {
    return request<Edge>({
      baseURL: this.baseURL,
      apiKey: this.apiKey,
      method: 'GET',
      path: `/v1/edges/${encodeURIComponent(id)}`,
    });
  }

  /** GET /v1/edges/:id/related — edges sharing endpoints with the seed edge. */
  getRelatedEdges(
    edgeId: string,
    params: GetRelatedEdgesParams = {},
  ): Promise<RelatedEdgesResponse> {
    return request<RelatedEdgesResponse>({
      baseURL: this.baseURL,
      apiKey: this.apiKey,
      method: 'GET',
      path: `/v1/edges/${encodeURIComponent(edgeId)}/related`,
      query: { k: params.k },
    });
  }

  /**
   * PATCH /v1/edges/:id/invalidate — mark an edge as no longer valid as of
   * `tInvalid`. Returns the updated edge. Once invalidated, an edge cannot
   * be invalidated again (409 `already_invalidated`).
   */
  forget(edgeId: string, params: ForgetParams): Promise<Edge> {
    return request<Edge>({
      baseURL: this.baseURL,
      apiKey: this.apiKey,
      method: 'PATCH',
      path: `/v1/edges/${encodeURIComponent(edgeId)}/invalidate`,
      body: {
        tInvalid: params.tInvalid,
        supersededBy: params.supersededBy,
      },
    });
  }

  /** GET /v1/playbooks */
  listPlaybooks(): Promise<{ playbooks: Playbook[] }> {
    return request<{ playbooks: Playbook[] }>({
      baseURL: this.baseURL,
      apiKey: this.apiKey,
      method: 'GET',
      path: '/v1/playbooks',
    });
  }

  /** GET /v1/playbooks/:id */
  getPlaybook(id: string): Promise<Playbook> {
    return request<Playbook>({
      baseURL: this.baseURL,
      apiKey: this.apiKey,
      method: 'GET',
      path: `/v1/playbooks/${encodeURIComponent(id)}`,
    });
  }

  /**
   * POST /v1/playbooks/regenerate — run the playbook LLM pipeline against
   * all edges in the given scope and replace (or create) the playbook for
   * that scope. At least one scope dimension must be set.
   */
  regeneratePlaybook(scope: PlaybookScope): Promise<Playbook> {
    const query: Record<string, string | undefined> = {};
    if (scope.branch !== undefined) query['scope.branch'] = scope.branch;
    if (scope.file !== undefined) query['scope.file'] = scope.file;
    if (scope.sessionId !== undefined) query['scope.sessionId'] = scope.sessionId;
    return request<Playbook>({
      baseURL: this.baseURL,
      apiKey: this.apiKey,
      method: 'POST',
      path: '/v1/playbooks/regenerate',
      query,
    });
  }
}
