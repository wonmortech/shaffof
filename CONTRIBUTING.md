# Contributing to Shaffof

Thank you for helping. Shaffof is a verifiable ledger for charity funds and a sourced zakat calculator. It is in the planning stage: today the repository holds the research
([docs/research/](docs/research/)), the plan ([docs/PLAN.md](docs/PLAN.md)) and the home page ([site/](site/)).

## Ways to contribute

| You want to | Do this |
|---|---|
| Report a bug or a mistake on the site | Open an issue with the **Bug** template |
| Suggest an idea or a change to the plan | Open an issue with the **Idea** template |
| Correct a research source or a legal reference | Open a pull request that links the primary source |
| Report a vulnerability | Not a public issue: see [SECURITY.md](SECURITY.md) |

Good first issues are labelled [`good first issue`](https://github.com/wonmortech/shaffof/labels/good%20first%20issue).

## Development

Requirements: Node.js 24 and Git. There is no build step: `site/` is served as it is.

```sh
npm ci                                  # test tools only; the site has no runtime dependencies
npx playwright install chromium         # once, for the browser tests
node tools/check-site.mjs               # links, CSP rules, forbidden text
npm run lint                            # ESLint, zero warnings allowed
npm test                                # unit tests, browser tests, combined coverage gate
```

## Requirements for a change

- **Tests.** New behaviour and every bug fix come with an automated test in `tests/`. CI runs `npm test` on
  every pull request and fails if unit coverage of the logic files drops below 90 % lines and 80 % branches, or
  if the combined unit and browser coverage of all JavaScript under `site/` drops below 90 % statements, 90 %
  lines or 80 % branches (`tools/coverage.mjs`; the report is written to `.coverage/report/`).
- **The CSP.** The site is served with `default-src 'self'`: no inline `<script>`, no inline event handlers and
  no third-party origins. `tools/check-site.mjs` enforces this.
- **Licence headers.** Every new source file starts with the two SPDX lines used in the existing files
  (`SPDX-FileCopyrightText` and `SPDX-License-Identifier`); files that take no comments go in `REUSE.toml`.
  CI runs `reuse lint`.
- **Coding standard.** Enforced by ESLint (`eslint.config.mjs`, `npm run lint`, zero warnings). Plain modern JavaScript (ES2022), no frameworks and no runtime dependencies; build the DOM
  with `textContent` and DOM APIs, never `innerHTML` with data. Keep each language page (`/`, `/en/`, `/ru/`)
  in sync, and keep the page accessible (WCAG 2.2 AA: contrast, focus, keyboard, `prefers-reduced-motion`).
- **Honesty.** Plans are labelled as plans. A claim or a number needs a source someone else can check.
- **One topic per pull request**, Conventional Commits style (`feat:`, `fix:`, `docs:`, `test:`).

## Developer Certificate of Origin (DCO)

Every commit must be signed off, which certifies that you wrote it or have the right to submit it under the
project licence ([developercertificate.org](https://developercertificate.org/)):

```sh
git commit -s -m "fix: ..."
```

This adds a `Signed-off-by: Your Name <email>` line. The `dco` check fails a pull request that has an
unsigned commit; fix it with `git rebase --signoff origin/main` and push again.

## Review and merge

Every change goes through a pull request. It needs green CI (`build`, `dco`) and at least one approving review
from a maintainer other than the author ([GOVERNANCE.md](GOVERNANCE.md)); the branch rules of `main` enforce both.
We squash-merge and delete the branch.

## Licence and conduct

Contributions are released under the [Apache License 2.0](LICENSE). No CLA is required.
Everyone taking part follows the [Code of Conduct](CODE_OF_CONDUCT.md).
