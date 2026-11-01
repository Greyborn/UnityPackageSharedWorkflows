const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const { formatChangelog } = require('../actions/upm-version/lib/changelog');

const fixture = (name) => fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8');

test('formats conventional-changelog output into the Greyborn layout', () => {
	// changelog-upstream.md is the output of conventional-changelog 5.1.0 with the
	// conventionalcommits 7.0.2 preset for a package at v2.0.1, and
	// changelog-expected.md is the CHANGELOG.md that was released at that tag.
	assert.equal(formatChangelog(fixture('changelog-upstream.md')), fixture('changelog-expected.md'));
});

test('formatting a formatted changelog leaves it unchanged', () => {
	const formatted = formatChangelog(fixture('changelog-multi-section-upstream.md'));

	assert.equal(formatChangelog(formatted), formatted);
});

test('separates sections within a release by one blank line', () => {
	const formatted = formatChangelog(fixture('changelog-multi-section-upstream.md'));

	assert.doesNotMatch(formatted, /\n\n\n### /);
	assert.match(formatted, /\n\n### Bug Fixes\n\n- /);
});

test('converts release dates and list markers', () => {
	const formatted = formatChangelog('## [1.0.0](https://example.com) (2026-01-02)\n\n\n### Features\n\n* thing\n  * nested\n');

	assert.match(formatted, /^## \[1\.0\.0\]\(https:\/\/example\.com\) — 2026-01-02$/m);
	assert.match(formatted, /^- thing$/m);
	assert.match(formatted, /^ {2}- nested$/m);
});

test('handles Windows line endings', () => {
	const unix = fixture('changelog-upstream.md');

	assert.equal(formatChangelog(unix.replace(/\n/g, '\r\n')), formatChangelog(unix));
});
