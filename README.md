# @premex/memoria

[![npm version](https://img.shields.io/npm/v/@premex/memoria.svg)](https://www.npmjs.com/package/@premex/memoria)
[![CI](https://github.com/premex-ab/memoria-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/premex-ab/memoria-sdk/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

The official TypeScript client for [Memoria](https://memoria.premex.se) — bi-temporal knowledge-graph memory for AI agents.

```bash
npm install @premex/memoria
```

## Quick start

```ts
import { MemoriaClient } from '@premex/memoria';

const memoria = new MemoriaClient({ apiKey: 'mem_live_...' });

// Write a memory
await memoria.remember({
  content: 'Pricing for Enterprise is $499/seat/month, effective 2026-Q3.',
  source: 'agent',
});

// Recall it later
const { results } = await memoria.recall({
  query: 'What is enterprise pricing?',
  k: 5,
});

for (const r of results) {
  console.log(r.edge.factText, '— score:', r.score);
}
```

Get an API key at [memoria.premex.se](https://memoria.premex.se).

## Bi-temporal recall

Memoria tracks two clocks for every fact: when it was true in the world (`tValid`/`tInvalid`) and when Memoria learned it (`tIngested`/`tExpired`). Pass `asOf` to recall what your agent knew at a point in time:

```ts
await memoria.recall({
  query: 'enterprise pricing',
  asOf: '2026-03-01T00:00:00Z',
});
```

This is the headline feature — most memory products only track ingestion time, so they can't answer "what did the agent believe last Tuesday?" correctly after a fact is updated.

## API

**Episodes**
| Method | Endpoint |
|---|---|
| `remember(params)` | `POST /v1/episodes` — runs the 7-stage extraction pipeline |
| `getEpisode(id)` | `GET /v1/episodes/:id` |
| `getExtractionStatus(id)` | `GET /v1/episodes/:id/extraction-status` — poll after async ingest |

**Recall**
| Method | Endpoint |
|---|---|
| `recall(params)` | `POST /v1/recall` — hybrid dense + sparse + graph retrieval |

**Entities**
| Method | Endpoint |
|---|---|
| `createEntity(params)` | `POST /v1/entities` — pre-seed before writing episodes |
| `getEntity(id)` | `GET /v1/entities/:id` |
| `getEntityHistory(id, opts?)` | `GET /v1/entities/:id/history` — bi-temporal timeline |

**Edges**
| Method | Endpoint |
|---|---|
| `relate(params)` | `POST /v1/edges` — create a bi-temporal fact between entities |
| `getEdge(id)` | `GET /v1/edges/:id` |
| `getRelatedEdges(id, opts?)` | `GET /v1/edges/:id/related` — neighbors of a seed edge |
| `forget(id, params)` | `PATCH /v1/edges/:id/invalidate` — mark an edge invalid at event time |

**Playbooks**
| Method | Endpoint |
|---|---|
| `listPlaybooks()` | `GET /v1/playbooks` |
| `getPlaybook(id)` | `GET /v1/playbooks/:id` |
| `regeneratePlaybook(scope)` | `POST /v1/playbooks/regenerate` |

### Examples — the 0.2.0 additions

```ts
// Pre-seed an entity, then create an explicit edge between two known ids.
const repo = await memoria.createEntity({ name: 'acme-web', type: 'repo' });
const tool = await memoria.createEntity({ name: 'vite', type: 'build_tool' });
const edge = await memoria.relate({
  fromEntityId: repo.id,
  toEntityId: tool.id,
  factText: 'acme-web uses vite',
  relationType: 'uses_build_tool',
  tValid: '2026-05-25T00:00:00Z',
});

// Time travel: timeline of edges that ever touched the entity
const { edges } = await memoria.getEntityHistory(repo.id, {
  asOf: '2026-05-01T00:00:00Z',
  limit: 20,
});

// Mark an edge as no longer valid as of an event time
await memoria.forget(edge.id, { tInvalid: '2026-06-15T00:00:00Z' });

// Trigger a playbook regenerate for a scope (branch, file, or sessionId)
await memoria.regeneratePlaybook({ branch: 'main' });
```

### Errors

Errors throw typed subclasses you can `catch` and branch on:

| Class | When |
|---|---|
| `MemoriaAuthError` | 401 / 403 — invalid or missing API key |
| `MemoriaNotFoundError` | 404 — entity / edge / episode / playbook doesn't exist |
| `MemoriaQuotaError` | 429 — rate limited (read `.retryAfter` for the suggested backoff in seconds) |
| `MemoriaError` | Everything else (`.status` + `.code` on the instance) |

```ts
import { MemoriaQuotaError } from '@premex/memoria';

try {
  await memoria.remember({ content: '...' });
} catch (err) {
  if (err instanceof MemoriaQuotaError) {
    await sleep((err.retryAfter ?? 1) * 1000);
    // retry
  } else {
    throw err;
  }
}
```

## Configuration

```ts
new MemoriaClient({
  apiKey: 'mem_live_...',
  baseURL: 'https://api.memoria.premex.se', // override for self-hosted / staging
});
```

The `baseURL` defaults to Memoria's hosted API. Override for local dev (`http://localhost:8787`) or self-hosted deployments.

## Versioning

This SDK follows [SemVer](https://semver.org/). The 0.x series is API-stable for the methods listed above but may add new methods as the Memoria API expands. 1.0 ships when the surface is feature-complete.

## Contributing

Issues and PRs welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) once it lands. For now, the [issue tracker](https://github.com/premex-ab/memoria-sdk/issues) is the right place to report bugs or request methods.

The Memoria server lives in a separate (currently private) monorepo. This SDK is a thin REST client and has no runtime dependencies.

## License

MIT — see [LICENSE](LICENSE).
