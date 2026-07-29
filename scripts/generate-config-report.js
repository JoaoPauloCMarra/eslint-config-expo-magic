#!/usr/bin/env node

const { writeConfigReportFiles } = require('./lib/config-report.js');

writeConfigReportFiles()
	.then(() => {
		console.log('Updated docs/config-diff.json and docs/CONFIG_DIFF.md');
	})
	.catch((error) => {
		console.error(error.message);
		process.exit(1);
	});
