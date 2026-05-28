# Changelog

All notable changes to `@premex/memoria` are documented here. This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] — 2026-05-28

Initial public release.

### Added
- `MemoriaClient` with `remember()`, `recall()`, `getEntity()`, `getEdge()`, `getEpisode()`, `listPlaybooks()`, `getPlaybook()`.
- Typed error hierarchy: `MemoriaError`, `MemoriaAuthError`, `MemoriaNotFoundError`, `MemoriaQuotaError`.
- Wire types: `Edge`, `Entity`, `Episode`, `Playbook`, plus their supporting unions.
- Bi-temporal recall via the `asOf` parameter.

[Unreleased]: https://github.com/premex-ab/memoria-sdk/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/premex-ab/memoria-sdk/releases/tag/v0.1.0
