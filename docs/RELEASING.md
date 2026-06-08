# Releasing

GitHub releases are created by `.github/workflows/release.yml` after `CI` completes successfully for a push to `main`.

The workflow reads `packages/eslint-config-expo-magic/package.json`, converts the package version to a `vX.Y.Z` tag, and creates a GitHub release only when that version is not already the latest release and a release for that exact tag does not already exist.

Release creation is skipped when:

1. The latest GitHub release already matches the package version.
2. A GitHub release already exists for the package version tag.
3. The triggering `CI` run did not come from a push to `main`.
4. A manual dispatch is run from a branch other than `main`.

The release body is generated during the workflow from the current config report via `bun run report:release-notes`. This automation does not publish to npm; package publishing remains controlled by the existing `bun run publish-package` path.
