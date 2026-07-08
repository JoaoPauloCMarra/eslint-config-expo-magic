# Agent setup recipe

Use this setup when a project is frequently edited by AI agents and needs guardrails against broad suppressions, weakened types, skipped tests, snapshot churn, generated attribution strings, and mobile runtime regressions.

## Install

```bash
bun add --dev eslint-config-expo-magic
```

## ESLint config

```js
const { createConfig } = require('eslint-config-expo-magic');

module.exports = createConfig({
	prettier: false,
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
	prettier: false,
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
bunx expo-magic-init-agent
```

Write missing setup files and package scripts:

```bash
bunx expo-magic-init-agent --write
```
