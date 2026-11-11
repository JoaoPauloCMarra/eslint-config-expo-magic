# Agent setup recipe

Use this setup when a project is frequently edited by AI agents and needs guardrails against broad suppressions, weakened types, skipped tests, snapshot churn, generated attribution strings, and mobile runtime regressions.

## Install

```bash
bun add --dev eslint-config-expo-magic@next
```

The package has no dependencies. Linting runs on `bun lint` and formatting on `bun fmt`.

## Lint config

Put the config in `oxlint.config.ts`. For a production Expo app, use the shared mobile profile:

```ts
import { createMobileAppConfig } from 'eslint-config-expo-magic/mobile-app';

export default createMobileAppConfig();
```

For a library or gradual rollout, compose focused options:

```ts
import { createConfig } from 'eslint-config-expo-magic';

export default createConfig({
	appGuardrails: true,
	reactCompiler: true,
	worklets: true,
	deprecatedApis: true,
});
```

Prefer the bundled agent preset for new projects:

```ts
import { createConfig } from 'eslint-config-expo-magic';

export default createConfig({
	agent: true,
});
```

Or use the subpath:

```ts
import agent from 'eslint-config-expo-magic/agent';

export default agent;
```

## Format config

Create `.prettierrc.js`, which `bun fmt` reads:

```js
module.exports = require('eslint-config-expo-magic/prettier');
```

## Recommended scripts

```json
{
	"scripts": {
		"lint": "bun lint",
		"lint:fix": "bun lint --fix",
		"format": "bun fmt",
		"format:check": "bun fmt --check",
		"validate:pr-guardrails": "expo-magic-pr-guardrails"
	}
}
```

## PR guardrails

Create `expo-magic.pr-guardrails.cjs`:

```js
module.exports = {
	preset: 'agentMobileApp',
};
```

The `agentMobileApp` preset expects PR text to include checkboxes for lint, typecheck, tests, runtime target, unrelated lockfile changes, skipped tests, and broad ignores. It also requires every checkbox from the `mobileApp` preset.

A broad ignore is a rule-less `eslint-disable` or `oxlint-disable` directive, any file-level `eslint-disable` or `oxlint-disable` comment, `@ts-ignore`, or `@ts-nocheck`. `-disable-line` and `-disable-next-line` comments that name a rule are allowed. The runtime target counts only when prose or a checked custom checklist item names the simulator, emulator, or device. Each changed screen or component file also needs a changed test or story in the same directory, its `__tests__` or `__stories__` folder, or the same feature root. See [RECIPES.md](RECIPES.md#pr-guardrails-cli) for CI setup.

## Init command

Preview recommended files:

```bash
bunx expo-magic-init
```

Write missing setup files and package scripts:

```bash
bunx expo-magic-init --write
```
