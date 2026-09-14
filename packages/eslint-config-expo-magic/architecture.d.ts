import type { Linter } from 'eslint';
import type { NativeUiRestriction } from './types';

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
	group: string[];
	message: string;
};

export type ArchitectureOptions = {
	/** Layer vocabulary. Defaults to the Expo lane. */
	layers?: Partial<ArchitectureLayers>;
	/** Source root. Defaults to `src`. */
	srcRoot?: string;
	/** Token module path used by the semantic-colour selectors. */
	tokenModule?: string;
	/** Logger module allowed to call `console.*`. */
	loggerModule?: string;
	/** Files permitted to import raw native primitives. */
	nativeWrappers?: string[];
	/** Extra `no-restricted-imports` paths merged into every layer block. */
	extraNativeUiRestrictions?: NativeUiRestriction[];
	/** Extra `no-restricted-imports` patterns merged into every layer block. */
	extraNativeLibPatterns?: RestrictedImportPattern[];
};

export declare const DEFAULT_LAYERS: Readonly<ArchitectureLayers>;

export declare function createArchitectureConfig(
	options?: ArchitectureOptions,
): Linter.Config[];
