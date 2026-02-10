# eslint-config-expo-magic

This package provides the flat ESLint configuration for Expo + React Native projects.

**Zero install:** ESLint and Prettier are included—your project does not need to install them. You only need `eslint-config-expo-magic`, flat config (`eslint.config.js`), and Node 20.19+ / 22.13+ / 24+.

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

Then run `bun run lint` (add `"lint": "eslint ."` to your `package.json` scripts).

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
