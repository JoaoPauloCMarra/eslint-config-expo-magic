#!/usr/bin/env node

const { parseArgs } = require('node:util');
const { writeReleaseNotesFile } = require('./lib/release-notes.js');

const { values } = parseArgs({
	options: {
		'previous-ref': {
			type: 'string',
		},
	},
});
writeReleaseNotesFile(undefined, {
	previousRef: values['previous-ref'],
})
	.then(() => {
		console.log('Updated docs/RELEASE_NOTES.next.md');
	})
	.catch((error) => {
		console.error(error.message);
		process.exit(1);
	});
