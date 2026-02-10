# Oxlint + Oxfmt vs ESLint + Prettier — Analysis & Recommendation

This document compares replacing ESLint and Prettier with **Oxlint** and **Oxfmt** ([Oxc](https://oxc.rs/docs/guide/introduction.html)) for `eslint-config-expo-magic`, and gives options plus a recommendation.

---

## 1. What This Package Currently Enforces

| Area | Source | Key rules / behavior |
|------|--------|----------------------|
| **TypeScript** | @typescript-eslint | type-only imports, no-explicit-any, no-floating-promises, no-unused-vars, naming-convention, consistent-type-definitions, etc. |
| **React** | eslint-plugin-react | jsx-key, self-closing-comp, jsx-no-leaked-render, jsx-no-useless-fragment, no-children-prop, no-danger-with-children, no-unknown-property |
| **React Hooks** | eslint-plugin-react-hooks | exhaustive-deps |
| **React Native** | eslint-plugin-react-native | no-unused-styles, split-platform-components, no-single-element-style-arrays |
| **React 19** | eslint-plugin-react-19-upgrade | no-default-props, no-prop-types, no-legacy-context, no-string-refs, no-factories |
| **Imports** | eslint-plugin-import-x + unused-imports | first, order (groups: builtin → external → internal, path groups for react/react-native/expo/@/**), no-cycle, no-unresolved, no-unused-imports (remove line) |
| **Jest** | eslint-plugin-jest | no-disabled-tests, no-focused-tests, prefer-hooks-on-top, valid-describe-callback, valid-title, expect-expect, no-done-callback, etc. |
| **Testing Library** | eslint-plugin-testing-library | await-async-queries, no-await-sync-queries, no-debugging-utils, no-dom-import |
| **Expo** | eslint-config-expo | expo/prefer-box-shadow, env/globals, base config |
| **App / infra** | app.js | no-console, no-restricted-imports (e.g. SafeAreaView from react-native), no-unused-vars |
| **Formatting** | Prettier | prettier/prettier via eslint-plugin-prettier |

---

## 2. Oxlint / Oxfmt Coverage

### 2.1 Oxlint — What’s covered well

- **ESLint core**: no-console, no-restricted-imports, eqeqeq, no-unused-vars, no-dupe-keys, no-undef, no-unreachable, no-var, no-with, etc.
- **TypeScript**: await-thenable, consistent-type-definitions, consistent-type-imports, no-explicit-any, no-floating-promises, no-non-null-assertion, no-unused-vars, no-confusing-void-expression, no-import-type-side-effects, no-useless-constructor, no-wrapper-object-types, triple-slash-reference, prefer-optional-chain, no-meaningless-void-operator, no-misused-promises, etc. (including type-aware rules).
- **React**: jsx-key, jsx-no-useless-fragment, self-closing-comp, no-children-prop, no-danger-with-children, no-string-refs, display-name, jsx-no-comment-textnodes, jsx-no-duplicate-props, jsx-no-undef, no-unknown-property (🚧), exhaustive-deps (react/exhaustive-deps), rules-of-hooks.
- **Import**: no-amd, no-anonymous-default-export, no-cycle, no-duplicates, no-named-as-default, no-named-as-default-member, no-webpack-loader-syntax; `import/first` (fix 🚧). **No** `import/order` (grouped order with path groups). **No** `import/no-unresolved` in the rules list.
- **Jest**: expect-expect, no-disabled-tests, no-focused-tests, no-done-callback, no-conditional-expect, valid-describe-callback, valid-title, prefer-hooks-on-top, no-export, no-jasmine-globals, no-identical-title, etc.
- **Sorting**: `eslint/sort-imports` (alphabetical), not the same as import-x’s grouped order.

### 2.2 Oxlint — Gaps for this package

| Gap | Impact |
|-----|--------|
| **React Native** | No plugin. Missing: `no-unused-styles`, `split-platform-components`, `no-single-element-style-arrays`. These are central to “mobile-first” and bundle size. |
| **React 19 upgrade** | No plugin. Missing: `no-default-props`, `no-prop-types`, `no-legacy-context`, `no-factories` (no-string-refs exists in react). |
| **Expo** | No plugin. Missing: `expo/prefer-box-shadow` and any expo-specific rules. |
| **Testing Library** | No plugin. Missing: `await-async-queries`, `no-await-sync-queries`, `no-debugging-utils`, `no-dom-import`. |
| **Import order** | No equivalent to import-x `order` (builtin → external → internal, path groups for react, react-native, expo, `@/`, `./`). Only `eslint/sort-imports` (simpler). |
| **Unused imports (remove line)** | No direct equivalent to `unused-imports/no-unused-imports`. no-unused-vars flags the binding; auto-removing the import line is different. |
| **import/no-unresolved** | Not present in the Oxlint rules list (resolution may be handled differently or not). |
| **jsx-no-leaked-render** | Not found in Oxlint rules (important for React Native to avoid rendering `0`/`NaN` outside `<Text>`). |

### 2.3 Oxfmt — Formatting

- **Prettier-compatible**: Targets same behavior as Prettier; ~95% of Prettier’s JS/TS tests pass; remaining gaps treated as bugs.
- **Built-in**: Import sorting, Tailwind class sorting, package.json field sorting (can reduce need for import order in the linter if you rely on formatter for order).
- **Status**: Alpha; project recommends joining the discussion for the formatter.
- **Performance**: Documented as much faster than Prettier.

---

## 3. Options

### Option A — Full switch to Oxlint + Oxfmt

- **Lint**: Oxlint only (with `.oxlintrc.json`, possibly `@oxlint/migrate` + hand-edits).
- **Format**: Oxfmt only.
- **Pros**: Single stack, fastest runs, no ESLint/Prettier deps.
- **Cons**: You **lose** React Native, React 19 upgrade, Expo, and Testing Library rules; import order and unused-import removal are not like-for-like. Quality and “mobile-first” guarantees would be weaker unless you re-add ESLint for gaps (see Option B).

**Verdict**: Not recommended if you want to **keep the same quality and scope** as the current package.

---

### Option B — Hybrid: Oxlint + Oxfmt first, ESLint for gaps

- **Lint**: Run Oxlint first (all supported rules), then ESLint with overlapping rules disabled via `eslint-plugin-oxlint`, so ESLint only runs rules Oxlint doesn’t cover.
- **Format**: Oxfmt (or keep Prettier if you prefer stability).
- **Pros**: Much faster than “ESLint only” (Oxlint is 50–100× faster in benchmarks); you keep React Native, React 19, Expo, Testing Library, import order, and unused-imports via ESLint.
- **Cons**: Two configs (Oxlint + ESLint), two tools in CI and editor; migration and maintenance effort.

**Verdict**: Good if the main goal is **speed** while preserving **full rule coverage**. The package would become a “Oxlint config + ESLint config for Expo/RN” rather than “ESLint-only config”.

---

### Option C — Stay on ESLint + Prettier (current)

- **Lint**: ESLint only (current setup).
- **Format**: Prettier only.
- **Pros**: Full coverage for TypeScript, React, React Native, React 19, Expo, Jest, Testing Library, imports, and formatting; single mental model; no migration.
- **Cons**: Slower than Oxlint; more dependencies.

**Verdict**: Best if **consistent quality and mobile/Expo-specific rules** matter more than raw lint speed.

---

### Option D — Oxlint via ESLint (eslint-plugin-oxlint) + Prettier

- **Lint**: Keep ESLint as the only linter, but run Oxlint inside ESLint via `eslint-plugin-oxlint` and disable overlapping ESLint rules so Oxlint does the heavy lifting.
- **Format**: Keep Prettier.
- **Pros**: One config (ESLint), one CLI; faster than plain ESLint; same rule set as today.
- **Cons**: Still need ESLint and Prettier; integration and versioning of the plugin to validate.

**Verdict**: Reasonable if you want **speed gains without changing the “one ESLint config” surface** and without adopting Oxfmt.

---

## 4. Recommendation

**Recommendation: Option C — Stay on ESLint + Prettier for this package.**

Reasons:

1. **This package’s value is mobile/Expo-specific rules.** React Native (unused styles, split platform components), React 19 upgrade, Expo, and Testing Library are not covered by Oxlint. Replacing ESLint+Prettier with Oxlint+Oxfmt alone would lower quality and change the product.
2. **Import discipline and dead code.** Your import-x `order` and `unused-imports/no-unused-imports` are part of the “zero-config, performance-oriented” story. Oxlint doesn’t offer the same import grouping or automatic removal of unused import lines.
3. **Stability and support.** Oxfmt is still alpha. For a shared config used by many projects, sticking with Prettier is the safer default.
4. **Migration cost.** A full or hybrid migration would require a new config surface (e.g. `.oxlintrc.json`), new docs, and possibly a different package name or a second package (e.g. `oxlint-config-expo-magic`), which may not be worth it unless speed becomes a blocking issue.

**If you later want speed without losing rules:**

- Prefer **Option B** (Oxlint first + ESLint for gaps) over a full switch, and document that the “full” preset still depends on ESLint for React Native, React 19, Expo, and Testing Library.
- Alternatively, try **Option D** (Oxlint inside ESLint via plugin) so you keep a single ESLint config and gain performance where Oxlint overlaps.

---

## 5. Summary Table

| Option | Lint | Format | Same quality as today? | Speed | Complexity |
|--------|------|--------|------------------------|-------|------------|
| **A** Full Oxlint+Oxfmt | Oxlint only | Oxfmt | No (big gaps) | Highest | Low |
| **B** Hybrid | Oxlint + ESLint (gaps) | Oxfmt or Prettier | Yes | High | High |
| **C** Stay (current) | ESLint | Prettier | Yes | Current | Low |
| **D** Oxlint in ESLint | ESLint + oxlint plugin | Prettier | Yes | Better than C | Medium |

**Bottom line:** To cover all rules you need (or equivalent quality), you either stay with ESLint+Prettier (Option C) or add Oxlint in front of or inside ESLint (Options B or D). A direct replacement of ESLint and Prettier with only Oxlint and Oxfmt (Option A) would not achieve the same quality for this package.
