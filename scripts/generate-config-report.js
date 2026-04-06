#!/usr/bin/env node

const { writeConfigReportFiles } = require('./lib/config-report.js');

writeConfigReportFiles();
console.log('Updated docs/config-diff.json and docs/CONFIG_DIFF.md');
