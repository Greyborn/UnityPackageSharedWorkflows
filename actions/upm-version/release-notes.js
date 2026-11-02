// Formats the changelog entry produced by conventional-changelog-action for use
// as GitHub release notes, and writes it to the step output "notes".
// Reads the entry from the NOTES environment variable.

const crypto = require('crypto');
const fs = require('fs');

const { formatReleaseNotes } = require('./lib/changelog');

const notes = formatReleaseNotes(process.env.NOTES || '');
const delimiter = `NOTES_${crypto.randomBytes(16).toString('hex')}`;

fs.appendFileSync(process.env.GITHUB_OUTPUT, `notes<<${delimiter}\n${notes}\n${delimiter}\n`, 'utf8');
