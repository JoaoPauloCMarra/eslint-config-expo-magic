# eslint-config-expo-magic

This package provides the flat ESLint configuration for Expo + React Native projects.

ESLint and Prettier are bundled with the config package. Consumer projects still need the peer dependencies for Expo, React, React Test Renderer, and TypeScript.

Validation coverage:

- Full fixture-app validation on Expo SDK 55.0.9 / React Native 0.83.4 / React 19.2.0
- Packed-consumer smoke validation on Expo SDK 54.0.33 and 55.0.9

### Compatibility

- Node.js `>=18`
- Expo `54.x` and `55.x`
- React `19.1.x || 19.2.x`
- React Test Renderer `19.1.x || 19.2.x`
- TypeScript `5.9.3+`

React Native support follows stable Expo SDK releases. Newer standalone RN versions should be treated as preview-only until the corresponding Expo SDK is stable.
Preview smoke coverage is available for Expo canary via `bun run smoke:preview`.

### Install

```bash
bun add -d eslint-config-expo-magic
```

No need to add `eslint` or `prettier`; they are provided by this package.

### Use

Create `eslint.config.js` in your project root:

```js
module.exports = require('eslint-config-expo-magic');
```

ESM (`eslint.config.mjs`) also works directly:

```js
import expoMagic from 'eslint-config-expo-magic';

export default [...expoMagic];
```

Then run `bun run lint` (add `"lint": "eslint ."` to your `package.json` scripts).

### Strict preset

For stricter enforcement (e.g. `no-console: error`, stricter TypeScript rules):

```js
const { strict } = require('eslint-config-expo-magic');
module.exports = [...strict];
```

### Typed preset

For opt-in type-aware rules from `typescript-eslint`'s maintained type-checked configs:

```js
const typed = require('eslint-config-expo-magic/typed');

module.exports = [...typed];
```

This preset enables `parserOptions.projectService = true`, so it expects a reachable `tsconfig.json`.

### No-Prettier preset

If you run Prettier separately and do not want lint-time formatting errors, use this as the preferred preset:

```js
const noPrettier = require('eslint-config-expo-magic/no-prettier');

module.exports = [...noPrettier];
```

## Path alias support

Path aliases are resolved automatically through `eslint-import-resolver-typescript`, which reads `./tsconfig.json` from your project root without extra ESLint overrides. This resolver is included as a dependency of the package.

```ts
import UserCard from '@/components/UserCard';
```

Ensure you have an alias configured in `tsconfig.json`:

```json
{
	"compilerOptions": {
		"baseUrl": ".",
		"paths": {
			"@/*": ["*"]
		}
	}
}
```
