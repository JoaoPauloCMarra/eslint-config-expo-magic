#!/usr/bin/env node

const { writeReleaseNotesFile } = require('./lib/release-notes.js');

writeReleaseNotesFile();
console.log('Updated docs/RELEASE_NOTES.next.md');
