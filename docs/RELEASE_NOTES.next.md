# Changes

- Package version: `2.5.0`
- Expo base version: `56.0.4`
- Base preset vs Expo: 1 rule added, 0 rules changed, 40 rules removed.
  - Added: `expo/prefer-box-shadow`
  - Removed: `react-hooks/component-hook-factories`, `react-hooks/config`, `react-hooks/error-boundaries`, `react-hooks/exhaustive-deps`, `react-hooks/gating`, `react-hooks/globals`, `react-hooks/immutability`, `react-hooks/incompatible-library`, and 32 more
- Default preset vs Expo: 432 rules added, 13 rules changed, 0 rules removed.
  - Added: `@babel/object-curly-spacing`, `@babel/semi`, `@stylistic/array-bracket-newline`, `@stylistic/array-bracket-spacing`, `@stylistic/array-element-newline`, `@stylistic/arrow-parens`, `@stylistic/arrow-spacing`, `@stylistic/block-spacing`, and 424 more
  - Changed: `@typescript-eslint/array-type`, `@typescript-eslint/consistent-type-assertions`, `@typescript-eslint/no-unused-vars`, `import/export`, `import/first`, `import/namespace`, `import/no-duplicates`, `import/no-named-as-default`, and 5 more
- no-prettier preset delta: `@babel/object-curly-spacing`, `@babel/semi`, `@stylistic/array-bracket-newline`, `@stylistic/array-bracket-spacing`, `@stylistic/array-element-newline`, `@stylistic/arrow-parens`, `@stylistic/arrow-spacing`, `@stylistic/block-spacing`, and 351 more
- typed preset delta: `@typescript-eslint/adjacent-overload-signatures`, `@typescript-eslint/array-type`, `@typescript-eslint/ban-ts-comment`, `@typescript-eslint/ban-tslint-comment`, `@typescript-eslint/class-literal-property-style`, `@typescript-eslint/consistent-generic-constructors`, `@typescript-eslint/consistent-indexed-object-style`, `@typescript-eslint/consistent-type-assertions`, and 78 more
- strict preset delta: `@typescript-eslint/no-misused-promises`, `@typescript-eslint/no-non-null-assertion`
- Production app hardening vs default: 3 rules added, 3 rules changed, 0 rules removed.
  - Added: `@typescript-eslint/ban-ts-comment`, `no-restricted-syntax`, `no-warning-comments`
  - Changed: `@typescript-eslint/no-non-null-assertion`, `no-console`, `no-restricted-imports`
- Upgrade notes:
  - Review `docs/CONFIG_DIFF.md` before publishing.
  - If a new rule is too aggressive, recommend `base`, `no-prettier`, or `createConfig(...)` overrides.
