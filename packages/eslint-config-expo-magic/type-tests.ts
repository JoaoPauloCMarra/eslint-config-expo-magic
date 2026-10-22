import config, {
	createArchitectureConfig,
	createConfig,
	createMobileAppConfig,
} from './index';
import type { CreateConfigOptions, OxlintConfig } from './index';
import architecture from './architecture';
import base from './base';
import mobileApp, {
	createMobileAppConfig as createMobileAppFromSubpath,
} from './mobile-app';
import prGuardrails from './pr-guardrails';
import prettier from './prettier';

const options: CreateConfigOptions = {
	preset: 'fast',
	testing: true,
	inlineStyles: 'warn',
	semanticColors: { tokenModule: 'uikit/tokens/colors' },
	agent: { reanimated: false },
};

const configs: OxlintConfig[] = [
	config,
	base,
	mobileApp,
	createConfig(options),
	createMobileAppConfig({ preset: 'fast' }),
	createMobileAppFromSubpath(),
	createArchitectureConfig({
		base: { prettier: true },
		layers: { routes: 'app', ui: 'uikit' },
		nativeUi: true,
	}),
];

configs[0].overrides.push({
	files: ['scripts/**'],
	rules: { 'no-console': 'off' },
});

const layers: string = architecture.DEFAULT_LAYERS.routes;
const valid: boolean = prGuardrails.validateGuardrails({
	eventName: 'pull_request',
	prBody: '',
	labels: [],
	changedFiles: [],
	changedPatch: '',
}).passed;
const formatter: Readonly<Record<string, unknown>> = prettier;

// @ts-expect-error baseConfig was replaced by base in 6.0.
createArchitectureConfig({ baseConfig: [] });

// @ts-expect-error unknown preset
createConfig({ preset: 'strict' });

export { configs, formatter, layers, valid };
