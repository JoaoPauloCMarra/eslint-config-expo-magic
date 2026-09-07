# Agent setup recipe

Use this setup when a project is frequently edited by AI agents and needs guardrails against broad suppressions, weakened types, skipped tests, snapshot churn, generated attribution strings, and mobile runtime regressions.

## Install

```bash
bun add --dev eslint-config-expo-magic typescript@^6.0.3
```

ESLint, Prettier, and the formatting, testing, and feature-boundary plugins ship with the package. Enable only the integrations selected by the config.

## ESLint config

For a production Expo app, use the shared mobile profile:

```js
module.exports = require('eslint-config-expo-magic/mobile-app');
```

For a library or gradual rollout, compose focused options:

```js
const { createConfig } = require('eslint-config-expo-magic');

module.exports = createConfig({
	appGuardrails: true,
	reactCompiler: true,
	worklets: true,
	deprecatedApis: true,
});
```

Prefer the bundled agent preset for new projects:

```js
const { createConfig } = require('eslint-config-expo-magic');

module.exports = createConfig({
	agent: true,
});
```

Or use the subpath:

```js
const agent = require('eslint-config-expo-magic/agent');

module.exports = [...agent];
```

## Recommended scripts

```json
{
	"scripts": {
		"lint": "eslint .",
		"typecheck": "tsc --noEmit",
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

The `agentMobileApp` preset expects PR text to include checkboxes for lint, typecheck, tests, runtime target, unrelated lockfile changes, skipped tests, and broad ignores.

## Init command

Preview recommended files:

```bash
bunx expo-magic-init
```

Write missing setup files and package scripts:

```bash
bunx expo-magic-init --write
```
