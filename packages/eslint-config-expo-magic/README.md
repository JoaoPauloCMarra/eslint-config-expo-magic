# eslint-config-expo-magic

This package provides the flat ESLint configuration for Expo + React Native projects.

**Zero install:** ESLint and Prettier are included—your project does not need to install them. You only need `eslint-config-expo-magic`, flat config (`eslint.config.js`), and Node 18+.

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

### No-Prettier preset

If you run Prettier separately and do not want lint-time formatting errors:

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
