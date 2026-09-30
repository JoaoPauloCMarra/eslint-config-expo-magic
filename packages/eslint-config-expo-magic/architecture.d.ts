import type { Linter } from 'eslint';
import type { NativeUiOptions, NativeUiRestriction } from './types';

export type ArchitectureLayers = {
	/** Route or navigation-host folder under `srcRoot`. Expo: `app`. Bare: `core`. */
	routes: string;
	/** UI layer folder. Expo: `uikit`. Bare: `shared`. */
	ui: string;
	/** Design-token folder. Expo: `uikit/tokens`. Bare: `shared/theme`. */
	tokens: string;
	/** Owned-primitive folder. Expo: `uikit/components`. Bare: `shared/ui`. */
	components: string;
};

export type RestrictedImportPattern = {
	group?: string[];
	regex?: string;
	message?: string;
};

export type ArchitectureOptions = {
	/** Layer vocabulary. Defaults to the Expo lane. */
	layers?: Partial<ArchitectureLayers>;
	/** Source root. Defaults to `src`. */
	srcRoot?: string;
	/** Import alias prefix for `src`. Defaults to `@`. */
	aliasPrefix?: string;
	/**
	 * Colour token module path, as in `semanticColors` (`uikit/tokens/colors`).
	 * The layer directory form (`layers.tokens`) resolves to its `colors` module.
	 */
	tokenModule?: string;
	/** Logger module allowed to call `console.*`. */
	loggerModule?: string;
	/** Files permitted to import raw native primitives. */
	nativeWrappers?: string[];
	/** Extra `no-restricted-imports` paths merged into every layer block. */
	extraNativeUiRestrictions?: NativeUiRestriction[];
	/** Extra `no-restricted-imports` patterns merged into every layer block. */
	extraNativeLibPatterns?: RestrictedImportPattern[];
	/**
	 * The same `nativeUi` options passed to `createConfig`. Restrictions are
	 * restated in every layer block and `allowFiles` are treated as wrappers.
	 */
	nativeUi?: boolean | NativeUiOptions;
	/**
	 * The config the architecture blocks are appended to. Its
	 * `no-restricted-imports` and `no-restricted-syntax` entries are restated
	 * inside every overlapping architecture block, so no layer drops them.
	 */
	baseConfig?: readonly Linter.Config[];
};

export declare const DEFAULT_LAYERS: Readonly<ArchitectureLayers>;

export declare function createArchitectureConfig(
	options?: ArchitectureOptions,
): Linter.Config[];
