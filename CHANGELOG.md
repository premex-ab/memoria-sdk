# Changelog

All notable changes to `@premex/memoria` are documented here. This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] — 2026-05-28

Closer to API parity. No breaking changes — all 0.1.x methods keep working.

### Added
- `getExtractionStatus(episodeId)` — poll the async ingest pipeline. Returns `{ status, entityCount, edgeCount, error? }`.
- `createEntity({ name, type, aliases?, summary? })` — pre-seed an entity directly instead of waiting for the extraction pipeline to discover it.
- `getEntityHistory(id, { asOf?, limit? })` — bi-temporal timeline of edges touching an entity, with supersession chains hydrated.
- `relate({ fromEntityId, toEntityId, factText, relationType, tValid, tInvalid? })` — create an explicit bi-temporal fact between two known entities.
- `getRelatedEdges(edgeId, { k? })` — edges sharing endpoints with a seed edge (1 or 2 shared entities, scored).
- `forget(edgeId, { tInvalid, supersededBy? })` — mark an edge invalid at an event time. The forget verb that mirrors the MCP tool.
- `regeneratePlaybook({ branch?, file?, sessionId? })` — trigger the playbook LLM pipeline for a scope.
- New wire types: `ExtractionStatusResponse`, `EntityHistoryResponse`, `EdgeWithSupersession`, `RelatedEdgesResponse`, `RelatedEdgeEntry`, `EntityHistoryEntry`.

## [0.1.3] — 2026-05-28

CI/CD only — clear the placeholder `NODE_AUTH_TOKEN` that `actions/setup-node` injects so npm CLI falls through to OIDC trusted-publishing instead of trying to authenticate with a literal `XXXXX-XXXXX-XXXXX-XXXXX` token. See [actions/setup-node#1027](https://github.com/actions/setup-node/issues/1027).

## [0.1.2] — 2026-05-28

CI/CD only — upgrade the publish workflow to install `npm@latest` before publishing so trusted publishing's OIDC path (which requires npm ≥ 11.5.1) is guaranteed available.

## [0.1.1] — 2026-05-28

No functional changes — verifies the trusted-publishing (OIDC) release pipeline end-to-end. Starting with this release, every tarball on npm is signed with [provenance attestation](https://docs.npmjs.com/generating-provenance-statements) linking back to the exact GitHub Actions workflow run that built it.

## [0.1.0] — 2026-05-28

Initial public release.

### Added
- `MemoriaClient` with `remember()`, `recall()`, `getEntity()`, `getEdge()`, `getEpisode()`, `listPlaybooks()`, `getPlaybook()`.
- Typed error hierarchy: `MemoriaError`, `MemoriaAuthError`, `MemoriaNotFoundError`, `MemoriaQuotaError`.
- Wire types: `Edge`, `Entity`, `Episode`, `Playbook`, plus their supporting unions.
- Bi-temporal recall via the `asOf` parameter.

[Unreleased]: https://github.com/premex-ab/memoria-sdk/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/premex-ab/memoria-sdk/releases/tag/v0.2.0
[0.1.3]: https://github.com/premex-ab/memoria-sdk/releases/tag/v0.1.3
[0.1.2]: https://github.com/premex-ab/memoria-sdk/releases/tag/v0.1.2
[0.1.1]: https://github.com/premex-ab/memoria-sdk/releases/tag/v0.1.1
[0.1.0]: https://github.com/premex-ab/memoria-sdk/releases/tag/v0.1.0
