## From 5.x to 6.0.0

6.0 replaces ESLint and Prettier with Bun's built-in `bun lint` and `bun fmt`. The rule set and the `createConfig` options stay the same; the config format, file names, and commands change.

### 1. Update Bun and the package

Use a Bun release with the built-in `bun lint` and `bun fmt` commands, then:

```bash
bun add --dev eslint-config-expo-magic@^6
```

### 2. Replace the config files

`bunx expo-magic-init --write` does steps 2 and 3 for you and prints what else it finds. By hand:

| 5.x                                                                 | 6.0                                                                                    |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `eslint.config.js` exporting `require('…/mobile-app')`              | `oxlint.config.ts` exporting `createMobileAppConfig()` from `…/mobile-app`             |
| `eslint.config.js` exporting `createConfig({...})`                  | `oxlint.config.ts` exporting `createConfig({...})`                                     |
| `"prettier": "eslint-config-expo-magic/prettier"` in `package.json` | `.prettierrc.js` with `module.exports = require('eslint-config-expo-magic/prettier');` |

```ts
// oxlint.config.ts
import { createMobileAppConfig } from 'eslint-config-expo-magic/mobile-app';

export default createMobileAppConfig();
```

Delete `eslint.config.js` afterwards. When both exist, `bun lint` uses the oxlint config.

### 3. Update the scripts

```json
{
	"scripts": {
		"lint": "bun lint",
		"lint:fix": "bun lint --fix",
		"format": "bun fmt",
		"format:check": "bun fmt --check"
	}
}
```

A `lint` or `fmt` script that runs `eslint` or `prettier` takes over `bun lint` / `bun fmt`, so change those scripts too, including CI and Git hooks. `bun lint --staged --fix` and `bun fmt --staged` replace lint-staged.

### 4. Remove the old toolchain

Remove `eslint`, `prettier`, `typescript-eslint`, `@typescript-eslint/*`, `eslint-config-*`, `eslint-plugin-*`, and `eslint-import-resolver-*` from `devDependencies`, unless another tool in the project needs them. `typescript` is optional: Bun type checks with its own checker.

### 5. Fix the tsconfig

Bun's type checker behaves like TypeScript 7 and rejects `compilerOptions.baseUrl`. Write `paths` relative to the tsconfig:

```json
{
	"compilerOptions": {
		"paths": { "@/*": ["./*"] }
	}
}
```

### 6. API changes

- Factories return one oxlint config object instead of a flat-config array. Add project rules by pushing to `config.overrides` instead of spreading arrays.
- The focused-layer subpaths are removed: `agent-guardrails`, `app-guardrails`, `component-structure`, `deprecated-apis`, `feature-boundaries`, `native-ui`, `react-compiler`, `reanimated`, `semantic-colors`, `storybook`, and `worklets`. Use the `createConfig` option with the same name (`agentGuardrails` is part of `agent`).
- `createArchitectureConfig` takes `base` (the `createConfig` options) instead of `baseConfig` (a flat-config array), and returns the combined config.
- `createMobileAppRestrictedImportsConfig` is removed.
- The `eslint` and `prettier` bins are removed; `expo-magic-init-agent` is now `expo-magic-init`.
- `prettier: true` reports formatting with Bun's `bun/format` rule instead of `prettier/prettier`.

### 7. Expect a few different results

The repository's golden tests check that every rule still reports in the same files as 5.x. Some details differ; see [Behavior differences from 5.x](../README.md#behavior-differences-from-5x).
