# Releasing

GitHub releases and npm publishes are handled by `.github/workflows/release.yml` after `CI` completes successfully for a push to `main`.

The workflow reads `packages/eslint-config-expo-magic/package.json`, converts the package version to a `vX.Y.Z` tag, and publishes only when npm does not already have that exact package version. It creates a GitHub release only when that version is not already the latest release and a release for that exact tag does not already exist.

Release or publish work is skipped when:

1. The latest GitHub release already matches the package version.
2. A GitHub release already exists for the package version tag.
3. npm already has `eslint-config-expo-magic@<version>`.
4. The triggering `CI` run did not come from a push to `main`. `release.yml` has no manual trigger, and a manually dispatched or scheduled `CI` run never releases, even on `main`.

When both npm publish and GitHub release creation are needed, npm publish runs first and the workflow verifies `npm view eslint-config-expo-magic@<version>` plus `dist-tags.latest` before creating the GitHub release.

The release body is the `## <version>` section of `CHANGELOG.md`. The workflow extracts it with `scripts/extract-release-notes.js` and fails when that section is missing or empty.

## Publish gate

The workflow and manual publishing both run `scripts/publish-package.js`. It runs these steps in order and stops at the first failure. Step 4 runs only with `--publish`:

1. Check that every `main`, `module`, `types`, `exports`, and `bin` target exists and is listed in the package `files`.
2. Run `scripts/release-check.js`: `check-pm`, `report:config`, and `report:release-notes`, then fail if `docs/CONFIG_DIFF.md`, `docs/config-diff.json`, or `docs/RELEASE_NOTES.next.md` differ from the committed files, then `audit:deps`, `test`, `typecheck`, `validate`, `smoke:release`, `smoke:clean-sdk57`, and `bun pm pack --dry-run`.
3. Run `bun pm pack --dry-run` and `npm publish --dry-run --ignore-scripts --access public`.
4. Publish with `npm publish --ignore-scripts --access public`, with `--provenance` in GitHub Actions.

Because npm runs with `--ignore-scripts`, the package `prepublishOnly` script does not run on this path. The gate is the explicit `release-check.js` call in step 2.

Commit the regenerated report files before you release. Otherwise step 2 fails. `smoke:clean-sdk57` runs Expo Doctor against the SDK 57 versions in `test-project/package.json`, so that pin must match the patch that Expo Doctor expects.

To publish manually, run `bun run publish-package --publish`. `bun run publish-package -- --publish` is the same, because `bun run` removes the `--` separator. Other arguments go to both `npm publish` commands.
