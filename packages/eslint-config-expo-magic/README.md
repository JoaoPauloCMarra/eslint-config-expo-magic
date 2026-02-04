# eslint-config-expo-magic

This package provides the flat ESLint configuration for Expo + React Native projects.

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
