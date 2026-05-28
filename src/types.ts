/**
 * Wire types returned by the Memoria API. Inlined here (rather than imported
 * from @memoria/types) so the published SDK has zero runtime dependencies and
 * consumers don't need access to an internal package.
 *
 * If a type changes server-side, update @memoria/types AND this file.
 */

/**
 * ISO-8601 string. Used as the wire format for timestamps in REST responses.
 */
export type IsoTimestamp = string & { __iso: true };

export interface Edge {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  factText: string;
  relationType: string;
  tValid: IsoTimestamp;
  tInvalid: IsoTimestamp | null;
  tIngested: IsoTimestamp;
  tExpired: IsoTimestamp | null;
  episodeIds: string[];
  supersededBy: string | null;
  confidence: number | null;
}

/**
 * Edge with its supersession target hydrated. Returned by entity-history
 * responses so chains can be rendered without follow-up round-trips.
 */
export interface EdgeWithSupersession extends Edge {
  supersededByEdge: Edge | null;
}

export interface Entity {
  id: string;
  name: string;
  aliases: string[];
  type: string;
  summary: string;
  communityId: string | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  episodeIds: string[];
}

export type EpisodeSource = 'agent' | 'user' | 'system' | 'import';

export type ExtractionStatus = 'pending' | 'extracting' | 'extracted' | 'failed';

export interface Episode {
  id: string;
  content: string;
  source: EpisodeSource;
  sessionId: string | null;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  producedEntityIds: string[];
  producedEdgeIds: string[];
  extractionStatus?: ExtractionStatus;
  extractionError?: string;
}

/**
 * Polling response for the async ingest path. Returned by
 * `getExtractionStatus()` after a `remember({ ..., async: true })` call.
 */
export interface ExtractionStatusResponse {
  status: ExtractionStatus;
  entityCount: number;
  edgeCount: number;
  /** Failure message; present only when `status === 'failed'`. */
  error?: string;
}

/**
 * Entry in an entity's bi-temporal history.
 */
export interface EntityHistoryEntry {
  edge: EdgeWithSupersession;
}

/**
 * Response from `getEntityHistory()`. The `edges` are ordered by
 * `tIngested` desc and bi-temporally filtered by `asOf`.
 */
export interface EntityHistoryResponse {
  entity: Entity;
  asOf: IsoTimestamp;
  edges: EdgeWithSupersession[];
}

/**
 * Entry in `getRelatedEdges()` results. `score` is the number of endpoint
 * entities shared with the seed edge (1 or 2).
 */
export interface RelatedEdgeEntry {
  edge: Edge;
  score: 1 | 2;
  sharedEntities: string[];
}

export interface RelatedEdgesResponse {
  seedEdge: Edge;
  related: RelatedEdgeEntry[];
}

export interface PlaybookScope {
  branch?: string;
  file?: string;
  sessionId?: string;
}

export type GeneratedBy = 'dreaming' | 'user';

export interface Playbook {
  id: string;
  title: string;
  scope: PlaybookScope;
  content: string;
  sourceEdgeIds: string[];
  generatedAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  generatedBy: GeneratedBy;
}
