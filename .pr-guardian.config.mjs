import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export default {
  resolveFixed: true,
  rules: {
    'no-console': {
      enabled: true,
      ignores: ['**/profiler/**/*.*'],
    },
  },
  customRules: [
    {
      id: 'css-source-directive-for-ui-packages',
      description:
        'Apps that depend on @-label-/ui-internal-* must have matching @source directives in their CSS files. Without this, Tailwind v4 will not generate the classes used by those UI packages.',
      severity: 'warning',
      check: (addedLines, _context, allFiles) => {
        const violations = [];
        const appDirectories = new Set();

        for (const f of allFiles ?? []) {
          if (f.endsWith('/package.json') && (f.startsWith('apps/') || f.startsWith('packages/'))) {
            appDirectories.add(path.dirname(f));
          }
        }

        for (const appDirectory of appDirectories) {
          const packagePath = path.resolve(appDirectory, 'package.json');
          if (!existsSync(packagePath)) continue;

          let packageJson;
          try {
            packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
          } catch {
            continue;
          }

          const allDependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
          const uiPackages = Object.keys(allDependencies).filter(d => d.startsWith('@-label-/ui-internal-'));
          if (uiPackages.length === 0) continue;

          for (const cssFile of ['src/components.css', 'src/index.css']) {
            const cssPath = path.join(appDirectory, cssFile);
            if (!existsSync(cssPath)) continue;

            const cssContent = readFileSync(cssPath, 'utf8');
            for (const uiPackage of uiPackages) {
              const expectedSource = `node_modules/${uiPackage}/src`;
              if (!cssContent.includes(expectedSource)) {
                violations.push({
                  file: cssPath,
                  line: 1,
                  message: `Missing @source directive for ${uiPackage} in ${cssFile}. Add: @source "../node_modules/${uiPackage}/src";`,
                });
              }
            }
          }
        }

        return violations;
      },
    },
    {
      id: 'federation-singleton-prefixes',
      description:
        'vite.config.ts files that call generateShared must not remove @-label-/ui- from singletonPrefixes. Removing it causes duplicate JS instances of UI packages in federation mode (e.g. Sonner toast state split).',
      severity: 'error',
      check: addedLines =>
        addedLines
          .filter(
            l => l.file.endsWith('vite.config.ts') && /singletonPrefixes\s*:\s*\[/.test(l.content) && !l.content.includes('@-label-/ui-'),
          )
          .map(l => ({
            file: l.file,
            line: l.line,
            message: 'singletonPrefixes must include "@-label-/ui-" to prevent duplicate UI package instances in federation mode.',
          })),
    },
    {
      id: 'browserslistrc-required-for-apps',
      description:
        'Every package named app-* or mfe-* must have a .browserslistrc file so that Tailwind CSS (Lightning CSS) targets the correct browsers.',
      severity: 'warning',
      check: (_addedLines, _context, allFiles) => {
        const violations = [];

        const packageFiles = (allFiles ?? []).filter(f => f.endsWith('/package.json'));

        for (const packageFile of packageFiles) {
          const directory = path.dirname(packageFile);
          const packagePath = path.resolve(packageFile);
          if (!existsSync(packagePath)) continue;

          let packageJson;
          try {
            packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
          } catch {
            continue;
          }

          const name = (packageJson.name ?? '').replace(/^@[^/]+\//, '');
          if (!name.startsWith('app-') && !name.startsWith('mfe-')) continue;

          const browserslistPath = path.join(directory, '.browserslistrc');
          if (!existsSync(browserslistPath)) {
            violations.push({
              file: packageFile,
              line: 1,
              message: `Missing .browserslistrc in ${directory}. Packages named app-* or mfe-* must define browser targets for CSS output.`,
            });
          }
        }

        return violations;
      },
    },
  ],
};
