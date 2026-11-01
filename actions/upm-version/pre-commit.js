// Pre-commit hook for TriPSs/conventional-changelog-action.
//
// The action calls `preCommit` after it has bumped the version in package.json
// and written CHANGELOG.md, and before it commits and tags the release. Every
// file changed here is included in the release commit.
//
// The action runs with the package repository as the working directory.

const { formatChangelogFile } = require('./lib/changelog');
const { generateReadme } = require('./lib/readme');
const { updateAssemblyInfoVersions } = require('./lib/assembly-info');

const path = require('path');

exports.preCommit = (props) => {
	const packageRoot = process.env.GITHUB_WORKSPACE || process.cwd();

	console.log('Formatting CHANGELOG.md...');
	formatChangelogFile(path.join(packageRoot, 'CHANGELOG.md'));

	console.log('Updating AssemblyInfo versions...');
	updateAssemblyInfoVersions(packageRoot, props.version);

	console.log('Generating README.md...');
	generateReadme(packageRoot, props.version);
};
