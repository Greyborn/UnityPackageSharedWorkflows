// Sets the AssemblyFileVersion attribute in every AssemblyInfo.cs file in the
// package to the version being released. Files named `AssemblyInfo.cs` and
// `*.AssemblyInfo.cs` are both updated.

const fs = require('fs');
const path = require('path');

const SKIPPED_FOLDERS = new Set(['.git', '.github', 'node_modules']);
const FILE_VERSION = /\[assembly: AssemblyFileVersion\("\d+\.\d+\.\d+"\)\]/;

function isAssemblyInfo(fileName) {
	return fileName === 'AssemblyInfo.cs' || fileName.endsWith('.AssemblyInfo.cs');
}

function findAssemblyInfoFiles(folder) {
	const found = [];
	for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
		const entryPath = path.join(folder, entry.name);
		if (entry.isDirectory()) {
			if (!SKIPPED_FOLDERS.has(entry.name)) {
				found.push(...findAssemblyInfoFiles(entryPath));
			}
		} else if (isAssemblyInfo(entry.name)) {
			found.push(entryPath);
		}
	}

	return found;
}

function updateAssemblyInfoVersions(packageRoot, version) {
	// AssemblyFileVersion only accepts numeric versions, so pre-release versions are skipped.
	if (!/^\d+\.\d+\.\d+$/.test(version)) {
		console.log(`> Version "${version}" is not numeric; AssemblyInfo files were not changed.`);
		return;
	}

	const files = findAssemblyInfoFiles(packageRoot);
	if (files.length === 0) {
		console.log('> No AssemblyInfo files found.');
		return;
	}

	for (const file of files) {
		const relative = path.relative(packageRoot, file);
		const content = fs.readFileSync(file, 'utf8');
		if (FILE_VERSION.test(content)) {
			fs.writeFileSync(file, content.replace(FILE_VERSION, () => `[assembly: AssemblyFileVersion("${version}")]`), 'utf8');
			console.log(`> Set AssemblyFileVersion in "${relative}" to "${version}".`);
		} else {
			console.log(`> No AssemblyFileVersion attribute found in "${relative}".`);
		}
	}
}

module.exports = { findAssemblyInfoFiles, updateAssemblyInfoVersions };
