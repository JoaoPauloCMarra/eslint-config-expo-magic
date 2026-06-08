# Releasing

GitHub releases and npm publishes are handled by `.github/workflows/release.yml` after `CI` completes successfully for a push to `main`.

The workflow reads `packages/eslint-config-expo-magic/package.json`, converts the package version to a `vX.Y.Z` tag, and publishes only when npm does not already have that exact package version. It creates a GitHub release only when that version is not already the latest release and a release for that exact tag does not already exist.

Release or publish work is skipped when:

1. The latest GitHub release already matches the package version.
2. A GitHub release already exists for the package version tag.
3. npm already has `eslint-config-expo-magic@<version>`.
4. The triggering `CI` run did not come from a push to `main`.
5. A manual dispatch is run from a branch other than `main`.

When both npm publish and GitHub release creation are needed, npm publish runs first and the workflow verifies `npm view eslint-config-expo-magic@<version>` plus `dist-tags.latest` before creating the GitHub release.

The release body is generated during the workflow from the current config report via `bun run report:release-notes`. Manual publishing still uses `bun run publish-package -- --publish`, which runs the same release checks and npm publish command.
