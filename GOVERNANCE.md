# Governance

Shaffof is a project of [Wonmor](https://wonmor.io), run in the public `wonmortech` GitHub organization.

## Roles

| Role | Who | Can do |
|---|---|---|
| Maintainer | [@wonmors](https://github.com/wonmors), [@XakimovNosirbek](https://github.com/XakimovNosirbek) | Review and merge pull requests, triage issues, cut releases, handle security reports |
| Contributor | Anyone who opens an issue or a pull request | Propose changes; becomes a maintainer after sustained, reviewed contributions and the maintainers' agreement |

The `core` team of the organization holds admin rights; `maintainers` and `contributors` teams map to the roles above.

## Decisions

Day-to-day decisions are made in issues and pull requests. A change merges after review and green CI
([CONTRIBUTING.md](CONTRIBUTING.md)). Larger decisions (scope, licence, architecture, anything in
[docs/PLAN.md](docs/PLAN.md)) are proposed in an issue, stay open for at least 7 days for comments, and are
recorded in the plan. When maintainers disagree, the project lead (@wonmors) decides and writes down why.

## Continuity

To be clear about the current state: both maintainer accounts listed above belong to the founder, so today
the project has one person behind it, not two independent people. Continuity therefore rests on:

- the account recovery settings of the `wonmortech` organization and of those accounts, so access can be
  restored if a device or a password is lost;
- automated deployment from `main` ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)) and
  reproducible, signed releases ([SECURITY.md](SECURITY.md#verifying-a-release)), so no single machine is
  needed to publish the site and anyone can rebuild it from the public repository under its open licence.

Adding an independent second owner is an open goal; see [Open goals](#open-goals).

## Open goals

- **An independent second owner and maintainer.** Someone other than the founder, with owner rights in the
  organization and the ability to merge, release and deploy. This is the missing piece for real continuity
  and for reviews by a second person; until then, the review rule in [CONTRIBUTING.md](CONTRIBUTING.md)
  applies only when another maintainer is available. Contributors who want to take on this role can say so
  in an issue.

## Security

Vulnerability reports follow [SECURITY.md](SECURITY.md). Only maintainers see private advisories.
