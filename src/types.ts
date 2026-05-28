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
