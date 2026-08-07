# Contributing

We want to invite the vast community of developers to contribute to our mission and improve MapSwipe mobile app.

## Contributions

We welcome any contributions that help improve the application. Before you start hacking, please read through [README](README.md) and the issues on GitHub to find the best fit for your skills. If you find a task that you are comfortable working on, simply fork the repo and submit a PR (to the `develop` branch) when you are ready!

If you are thinking of a change that is not trivial, we suggest you first [open an issue](https://github.com/mapswipe/mapswipe-mobile/issues) to discuss your proposed changes. This may save you a lot of time, as other people may be working on similar (or conflicting) changes.

Direct AI-generated contributions are not allowed. All contributions must be reviewed, tested, and fully understood by the contributor before submission, and repository owners will independently review, run, and verify all changes. Additionally, all PRs must go through a proper review process, with final review and approval conducted by Togglecorp before merging. Contributors may be asked to make revisions based on feedback.

## GitHub Actions

See [docs/deployment.md](docs/deployment.md) for how releases are cut. This is also detailed in the CI config files under `.github/workflows`.

## Troubleshooting and random notes

- When updating dependencies with `pnpm`, make sure that the corresponding `iOS` dependency is updated as well, for instance `Sentry` has a cocoapod that does not seem to sync automatically with the javascript version, which ends up breaking the build.
