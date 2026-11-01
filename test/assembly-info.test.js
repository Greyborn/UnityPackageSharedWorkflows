const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const { updateAssemblyInfoVersions } = require('../actions/upm-version/lib/assembly-info');

const ASSEMBLY_INFO = '[assembly: AssemblyTitle("Example")]\n[assembly: AssemblyFileVersion("1.0.0")]\n';

function makePackage(files) {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'upm-version-'));
	for (const [relative, content] of Object.entries(files)) {
		fs.mkdirSync(path.dirname(path.join(root, relative)), { recursive: true });
		fs.writeFileSync(path.join(root, relative), content);
	}

	return root;
}

const read = (root, relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('updates AssemblyInfo.cs and *.AssemblyInfo.cs files', (t) => {
	const root = makePackage({
		'Runtime/AssemblyInfo.cs': ASSEMBLY_INFO,
		'Editor/Example.Editor.AssemblyInfo.cs': ASSEMBLY_INFO,
		'Tests/Editor/AssemblyInfo.cs': ASSEMBLY_INFO,
	});
	t.after(() => fs.rmSync(root, { recursive: true, force: true }));
	t.mock.method(console, 'log', () => {});

	updateAssemblyInfoVersions(root, '2.3.4');

	for (const file of ['Runtime/AssemblyInfo.cs', 'Editor/Example.Editor.AssemblyInfo.cs', 'Tests/Editor/AssemblyInfo.cs']) {
		assert.match(read(root, file), /AssemblyFileVersion\("2\.3\.4"\)/, file);
		assert.match(read(root, file), /AssemblyTitle\("Example"\)/, file);
	}
});

test('ignores files in .git, .github, and node_modules', (t) => {
	const root = makePackage({
		'.github/AssemblyInfo.cs': ASSEMBLY_INFO,
		'node_modules/x/AssemblyInfo.cs': ASSEMBLY_INFO,
	});
	t.after(() => fs.rmSync(root, { recursive: true, force: true }));
	t.mock.method(console, 'log', () => {});

	updateAssemblyInfoVersions(root, '2.3.4');

	assert.equal(read(root, '.github/AssemblyInfo.cs'), ASSEMBLY_INFO);
	assert.equal(read(root, 'node_modules/x/AssemblyInfo.cs'), ASSEMBLY_INFO);
});

test('leaves files unchanged for pre-release versions', (t) => {
	const root = makePackage({ 'Runtime/AssemblyInfo.cs': ASSEMBLY_INFO });
	t.after(() => fs.rmSync(root, { recursive: true, force: true }));
	t.mock.method(console, 'log', () => {});

	updateAssemblyInfoVersions(root, '2.3.4-rc.0');

	assert.equal(read(root, 'Runtime/AssemblyInfo.cs'), ASSEMBLY_INFO);
});
