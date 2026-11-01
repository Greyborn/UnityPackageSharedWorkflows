const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const { generateReadme } = require('../actions/upm-version/lib/readme');

const PACKAGE_JSON = JSON.stringify({
	name: 'com.greyborn.example',
	displayName: 'Example',
	description: 'Costs $5 — really.',
	dependencies: { 'com.greyborn.other': '1.2.3' },
});

function makePackage(files) {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'upm-readme-'));
	for (const [relative, content] of Object.entries({ 'package.json': PACKAGE_JSON, ...files })) {
		fs.mkdirSync(path.dirname(path.join(root, relative)), { recursive: true });
		fs.writeFileSync(path.join(root, relative), content);
	}

	return root;
}

const readme = (root) => fs.readFileSync(path.join(root, 'README.md'), 'utf8');

test('fills in placeholders from package.json', (t) => {
	const root = makePackage({ '.github/README.template.md': '{{displayName}}|{{packageName}}|{{version}}|{{description}}\n{{dependencies}}\n{{coverage}}' });
	t.after(() => fs.rmSync(root, { recursive: true, force: true }));
	t.mock.method(console, 'log', () => {});

	generateReadme(root, '4.5.6');

	assert.equal(readme(root), 'Example|com.greyborn.example|4.5.6|Costs $5 — really.\n- 📦 **com.greyborn.other** — 1.2.3  \nNone');
});

test('prefers .github/ over .github/workflows/ for the template', (t) => {
	const root = makePackage({
		'.github/README.template.md': 'new location',
		'.github/workflows/README.template.md': 'old location',
	});
	t.after(() => fs.rmSync(root, { recursive: true, force: true }));
	t.mock.method(console, 'log', () => {});

	generateReadme(root, '1.0.0');

	assert.equal(readme(root), 'new location');
});

test('falls back to the default template', (t) => {
	const root = makePackage({});
	t.after(() => fs.rmSync(root, { recursive: true, force: true }));
	t.mock.method(console, 'log', () => {});

	generateReadme(root, '1.0.0');

	assert.match(readme(root), /^# Example\n/);
	assert.match(readme(root), /Package Version {2}1\.0\.0/);
});
