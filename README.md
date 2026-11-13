# Shaffof

[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/16670/badge)](https://www.bestpractices.dev/projects/16670)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/wonmortech/shaffof/badge)](https://scorecard.dev/viewer/?uri=github.com/wonmortech/shaffof)
[![CI](https://github.com/wonmortech/shaffof/actions/workflows/ci.yml/badge.svg)](https://github.com/wonmortech/shaffof/actions/workflows/ci.yml)
[![Mozilla Observatory A+](https://img.shields.io/badge/Mozilla_Observatory-A%2B-brightgreen)](https://developer.mozilla.org/en-US/observatory/analyze?host=shaffof.wonmor.io)
[![SSL Labs A+](https://img.shields.io/badge/SSL_Labs-A%2B-brightgreen)](https://www.ssllabs.com/ssltest/analyze.html?d=shaffof.wonmor.io)

**A verifiable ledger for charity funds, and a sourced zakat calculator.**
*Shaffof* means "transparent" in Uzbek.

> **Status: planning. Nothing is released yet.** The home page has a working in-browser demo of
> the verification idea, but there is no product, no hosted service and no partner fund.

Site: https://shaffof.wonmor.io

## What it is

1. **Verifiable charity reports.** A fund keeps an append-only ledger of income and spending. Each
   month the entries are folded into a Merkle tree, and its root is timestamped with
   [OpenTimestamps](https://opentimestamps.org/) (through the shared core of the sister project Muhr)
   and published. Anyone can then check that a published report was not changed afterwards, and a
   donor can check with a receipt number that their own gift is included (an inclusion proof, as in
   [RFC 9162](https://www.rfc-editor.org/rfc/rfc9162)).
2. **A zakat calculator** that shows several madhhab methods side by side, each with its source,
   and gives no rulings of its own. It runs in the browser and stores nothing.

## What it is not

- It never collects, holds or moves money. Payments go through the fund's own bank account.
- No token, no crypto payments. Sealing only ties a hash to a point in time.
- No donor names in public reports, and no donor rankings or leaderboards.
- No fatwas.

> **Zakat rulings must be confirmed by qualified scholars.** The calculator will not be released
> until its methods and sources have been reviewed in writing by qualified scholars. Nothing in this
> repository is legal or religious advice.

## Documents

- [docs/PLAN.md](docs/PLAN.md): goals, architecture, milestones, risks, open questions (Uzbek)
- [docs/research/](docs/research/): competitors, references, inspiration, legal and sharia notes (Uzbek)
- [DESIGN.md](DESIGN.md): the visual direction of the home page

## Repository layout

| Path | What |
|---|---|
| `site/` | The static home page (uz default, `en/`, `ru/`). No build step; serve the folder as is. |
| `tools/render-pages.mjs` | Regenerates the three `index.html` files from one string table: `node tools/render-pages.mjs` |
| `docs/` | Plan and research |

The site is designed for a strict CSP (`script-src 'self'`, no external hosts): fonts are
self-hosted and every script is a local file.

## Family

Shaffof shares its key, Merkle log and anchoring core with two sister projects:
[Muhr](https://muhr.wonmor.io) (document seals) and [Sanad](https://sanad.wonmor.io) (verifiable
certificates).

## Contributing

Questions, criticism and ideas are welcome in [GitHub issues](https://github.com/wonmortech/shaffof/issues).

## Licence

[Apache-2.0](LICENSE). Fonts in `site/fonts/` are under the SIL Open Font License (see the
`LICENSE-*.txt` files next to them).

---

A [Wonmor](https://wonmor.io) project.
