// Reformats the CHANGELOG.md written by conventional-changelog (preset
// "conventionalcommits") into the Greyborn layout:
//
// - A "Keep a Changelog" header at the top of the file.
// - Release headings end with " — YYYY-MM-DD" instead of " (YYYY-MM-DD)".
// - List items use "-" instead of "*".
// - Each list item is a single line. Commit messages are wrapped, and
//   conventional-changelog copies a breaking-change note's line breaks as is.
// - Git trailers such as "Co-Authored-By:" are removed. conventional-changelog
//   treats everything after "BREAKING CHANGE:" as the note, including trailers
//   at the end of the commit message.
// - Three blank lines before each release heading and one blank line between
//   all other blocks.
//
// The changelog is regenerated from the full commit history on every release,
// so the formatting is applied to the whole file each time. Formatting an
// already formatted changelog leaves it unchanged.
//
// `formatReleaseNotes` applies the same list item and trailer clean-up to the
// changelog entry used as the GitHub release notes.

const fs = require('fs');

const HEADER = [
	'# Changelog',
	'',
	'All notable changes to this project will be documented in this file.',
	'',
	'The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).',
];

const RELEASE_HEADING = /^#{1,2} \S/;
const HEADING = /^#/;
const RELEASE_DATE = /^(#{1,2} .+?) \((\d{4}-\d{2}-\d{2})\)$/;
const STAR_LIST_ITEM = /^(\s*)\* /;
const LIST_ITEM = /^\s*- /;
const TRAILER = /^(Co-Authored-By|Signed-off-by|Reviewed-by|Acked-by|Tested-by|Reported-by|Helped-by): /i;

// Splits text into blocks of non-blank lines, normalizing each line and
// joining wrapped lines onto the list item they continue.
function toBlocks(text) {
	const lines = text
		.replace(/\r\n/g, '\n')
		.split('\n')
		.map((line) => line.trimEnd().replace(RELEASE_DATE, '$1 — $2').replace(STAR_LIST_ITEM, '$1- '))
		.filter((line) => !TRAILER.test(line));

	const blocks = [];
	let current = [];
	for (const line of lines) {
		if (line === '') {
			if (current.length > 0) {
				blocks.push(current);
				current = [];
			}
		} else if (current.length > 0 && LIST_ITEM.test(current[0]) && !LIST_ITEM.test(line) && !HEADING.test(line)) {
			current[current.length - 1] += ` ${line.trim()}`;
		} else {
			current.push(line);
		}
	}
	if (current.length > 0) {
		blocks.push(current);
	}

	return blocks;
}

function formatChangelog(text) {
	// Drop a header added by a previous run, so it is not duplicated.
	let lines = text.replace(/\r\n/g, '\n').split('\n');
	if (lines[0].trimEnd() === HEADER[0]) {
		const firstRelease = lines.findIndex((line, i) => i > 0 && RELEASE_HEADING.test(line));
		lines = firstRelease === -1 ? [] : lines.slice(firstRelease);
	}

	let output = HEADER.join('\n');
	for (const block of toBlocks(lines.join('\n'))) {
		const separator = RELEASE_HEADING.test(block[0]) ? '\n\n\n\n' : '\n\n';
		output += separator + block.join('\n');
	}

	return output + '\n\n';
}

function formatReleaseNotes(text) {
	return toBlocks(text).map((block) => block.join('\n')).join('\n\n');
}

function formatChangelogFile(filePath) {
	if (!fs.existsSync(filePath)) {
		console.log(`> No changelog found at "${filePath}".`);
		return;
	}

	fs.writeFileSync(filePath, formatChangelog(fs.readFileSync(filePath, 'utf8')), 'utf8');
	console.log(`> Formatted "${filePath}".`);
}

module.exports = { formatChangelog, formatChangelogFile, formatReleaseNotes };
