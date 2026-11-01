// Generates README.md from a template, replacing placeholders with values from
// the package's package.json:
//
//   {{displayName}}   package.json "displayName"
//   {{packageName}}   package.json "name"
//   {{version}}       the version being released
//   {{description}}   package.json "description"
//   {{dependencies}}  package.json "dependencies", as a list
//   {{coverage}}      a code coverage table, or "None"
//
// The template is the package's own `.github/README.template.md`, or
// `.github/workflows/README.template.md`, falling back to the default template
// shipped with this action. Code coverage is read from
// `PackageCoverageReport.json` in the same folders, when present.

const fs = require('fs');
const path = require('path');

const DEFAULT_TEMPLATE = path.join(__dirname, '..', 'templates', 'README.template.md');

function findFirst(candidates) {
	return candidates.find((candidate) => fs.existsSync(candidate));
}

function formatDependencies(dependencies) {
	if (!dependencies || Object.keys(dependencies).length === 0) {
		return '- 📦 None';
	}

	return Object.entries(dependencies)
		.map(([pkg, version]) => `- 📦 **${pkg}** — ${version}  `)
		.join('\n');
}

// Inserts zero-width spaces before dots so long names can wrap.
function escapeZeroWidth(name) {
	return name.replace(/\./g, '&ZeroWidthSpace;.');
}

function splitNamespaceAndClass(fullName) {
	const lastDotIndex = fullName.lastIndexOf('.');
	if (lastDotIndex === -1) {
		return { namespace: '', className: fullName };
	}

	return {
		namespace: fullName.substring(0, lastDotIndex + 1),
		className: fullName.substring(lastDotIndex + 1),
	};
}

function formatCoverage(coveragePath) {
	if (!coveragePath) {
		return 'None';
	}

	const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
	const summary = coverageData.Summary;
	const assemblies = coverageData.Coverage.Assemblies;
	const numberFormatter = new Intl.NumberFormat('en-US');

	let table = `| | <small>Coverage</small> | <small>Covered</small> | <small>Coverable</small> | <small>Total</small> |\n`;
	table += `|---|---:|---:|---:|---:|\n`;

	table += `| 📦 ${escapeZeroWidth(summary.PackageName)} | ![${Math.floor(summary.LineCoverage * 100)}%](https://geps.dev/progress/${Math.floor(summary.LineCoverage * 100)}) | ${numberFormatter.format(summary.LinesCovered)} | ${numberFormatter.format(summary.LinesCoverable)} | ${numberFormatter.format(summary.LinesTotal)} |\n`;

	for (const assembly of assemblies) {
		table += `| &nbsp;&nbsp;&nbsp;⚙️&nbsp;${escapeZeroWidth(assembly.Name)} | ![${Math.floor(assembly.LineCoverage)}%](https://geps.dev/progress/${Math.floor(assembly.LineCoverage)}) | ${numberFormatter.format(assembly.LinesCovered)} | ${numberFormatter.format(assembly.LinesCoverable)} | ${numberFormatter.format(assembly.LinesTotal)} |\n`;
		for (const cls of assembly.ClassesInAssembly) {
			const { namespace, className } = splitNamespaceAndClass(cls.Name);
			table += `| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;📄&nbsp;<small style="opacity:0.5">${escapeZeroWidth(namespace)}</small>${escapeZeroWidth(className)} | ![${Math.floor(cls.LineCoverage)}%](https://geps.dev/progress/${Math.floor(cls.LineCoverage)}) | ${numberFormatter.format(cls.LinesCovered)} | ${numberFormatter.format(cls.LinesCoverable)} | ${numberFormatter.format(cls.LinesTotal)} |\n`;
		}
	}

	return table;
}

function generateReadme(packageRoot, version) {
	const packageJson = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
	const githubFolders = [path.join(packageRoot, '.github'), path.join(packageRoot, '.github', 'workflows')];
	const templatePath = findFirst([...githubFolders.map((folder) => path.join(folder, 'README.template.md')), DEFAULT_TEMPLATE]);
	const coveragePath = findFirst(githubFolders.map((folder) => path.join(folder, 'PackageCoverageReport.json')));

	// Replacement functions are used so that "$" in package.json values is inserted literally.
	const readme = fs.readFileSync(templatePath, 'utf8')
		.replace(/{{displayName}}/g, () => packageJson.displayName)
		.replace(/{{packageName}}/g, () => packageJson.name)
		.replace(/{{version}}/g, () => version)
		.replace(/{{description}}/g, () => packageJson.description)
		.replace(/{{dependencies}}/g, () => formatDependencies(packageJson.dependencies))
		.replace(/{{coverage}}/g, () => formatCoverage(coveragePath));

	fs.writeFileSync(path.join(packageRoot, 'README.md'), readme, 'utf8');
	console.log(`> Generated README.md for version ${version} from "${path.relative(packageRoot, templatePath) || templatePath}".`);
}

module.exports = { generateReadme };
