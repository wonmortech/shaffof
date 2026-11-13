# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/). Version 0.x means the project is in planning: the site and the
documents change, there is no released product yet.

## [Unreleased]

### Added
- Property-based tests with fast-check on random input, run in CI with the unit tests.
- ESLint (flat config, `npm run lint`, zero warnings allowed), run in the required CI job.
- Combined coverage of every script under `site/`: Chromium V8 coverage from the browser tests merged with the
  unit-test coverage, gated at 90% statements and lines and 80% branches (today 98.3% statements, 92.1% branches).
- Browser tests for the whole hero animation, pointer and resize, the theme switch under reduced motion, the
  two-reports illustration, re-checking a proof when the receipt changes, and the page without WebCrypto.
- REUSE compliance: SPDX headers in every source file, `REUSE.toml` for the rest, licence texts in `LICENSES/`,
  and `reuse lint` in CI.
- SECURITY.md: how to verify a release (checksum and Sigstore-signed build provenance).

### Changed
- GOVERNANCE.md states the real continuity situation: both maintainer accounts belong to the founder, and an
  independent second owner is an open goal.
- README.md: current status of releases, links to the security, governance and contributing documents.

### Fixed
- Removed a no-op string replacement in the page generator (CodeQL js/identity-replacement).
- Removed an unused variable in the hero animation (found by ESLint).

## [0.1.0] - 2026-11-14

### Added
- Research with competitors, standards and legal notes in `docs/research/`, and the plan in `docs/PLAN.md`.
- Home page at https://shaffof.wonmor.io in Uzbek, English and Russian, with light and dark themes and an in-browser demo.
- Share card image per language.
- Automatic deployment from `main` with live verification and rollback.
- Automated tests: unit tests with a coverage gate and browser tests for every language page, run in CI.
- Security assurance case ([docs/ASSURANCE.md](docs/ASSURANCE.md)), security policy and `security.txt`.
- Governance, contributing guide with DCO sign-off, code of conduct, issue and pull request templates.
- OpenSSF Scorecard workflow, and reproducible release archives with signed build provenance.

[Unreleased]: https://github.com/wonmortech/shaffof/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/wonmortech/shaffof/releases/tag/v0.1.0
