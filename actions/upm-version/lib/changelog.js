// Reformats the CHANGELOG.md written by conventional-changelog (preset
// "conventionalcommits") into the Greyborn layout:
//
// - A "Keep a Changelog" header at the top of the file.
// - Release headings end with " — YYYY-MM-DD" instead of " (YYYY-MM-DD)".
// - List items use "-" instead of "*".
// - Three blank lines before each release heading and one blank line between
//   all other blocks.
//
// The changelog is regenerated from the full commit history on every release,
// so the formatting is applied to the whole file each time. Formatting an
// already formatted changelog leaves it unchanged.

const fs = require('fs');

const HEADER = [
	'# Changelog',
	'',
	'All notable changes to this project will be documented in this file.',
	'',
	'The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).',
];

const RELEASE_HEADING = /^#{1,2} \S/;
const RELEASE_DATE = /^(#{1,2} .+?) \((\d{4}-\d{2}-\d{2})\)$/;
const LIST_ITEM = /^(\s*)\* /;

function formatChangelog(text) {
	let lines = text.replace(/\r\n/g, '\n').split('\n').map((line) => line.trimEnd());

	// Drop a header added by a previous run, so it is not duplicated.
	if (lines[0] === HEADER[0]) {
		const firstRelease = lines.findIndex((line, i) => i > 0 && RELEASE_HEADING.test(line));
		lines = firstRelease === -1 ? [] : lines.slice(firstRelease);
	}

	lines = lines.map((line) => line.replace(RELEASE_DATE, '$1 — $2').replace(LIST_ITEM, '$1- '));

	// Split into blocks separated by blank lines, then rejoin with the Greyborn spacing.
	const blocks = [];
	let current = [];
	for (const line of lines) {
		if (line === '') {
			if (current.length > 0) {
				blocks.push(current);
				current = [];
			}
		} else {
			current.push(line);
		}
	}
	if (current.length > 0) {
		blocks.push(current);
	}

	let output = HEADER.join('\n');
	for (const block of blocks) {
		const separator = RELEASE_HEADING.test(block[0]) ? '\n\n\n\n' : '\n\n';
		output += separator + block.join('\n');
	}

	return output + '\n\n';
}

function formatChangelogFile(filePath) {
	if (!fs.existsSync(filePath)) {
		console.log(`> No changelog found at "${filePath}".`);
		return;
	}

	fs.writeFileSync(filePath, formatChangelog(fs.readFileSync(filePath, 'utf8')), 'utf8');
	console.log(`> Formatted "${filePath}".`);
}

module.exports = { formatChangelog, formatChangelogFile };
