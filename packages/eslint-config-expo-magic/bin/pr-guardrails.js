#!/usr/bin/env node

require('../pr-guardrails.js')
	.runCli()
	.catch((error) => {
		console.error(
			`PR guardrails failed: ${error instanceof Error ? error.message : String(error)}`,
		);
		process.exitCode = 1;
	});
