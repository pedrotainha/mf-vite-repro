import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

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
      check(addedLines, _ctx, allFiles) {
        const violations = [];
        const appDirs = new Set();

        for (const f of allFiles ?? []) {
          if (f.endsWith('/package.json') && (f.startsWith('apps/') || f.startsWith('packages/'))) {
            appDirs.add(dirname(f));
          }
        }

        for (const appDir of appDirs) {
          const pkgPath = resolve(appDir, 'package.json');
          if (!existsSync(pkgPath)) continue;

          let pkg;
          try {
            pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
          } catch {
            continue;
          }

          const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
          const uiPackages = Object.keys(allDeps).filter(d => d.startsWith('@-label-/ui-internal-'));
          if (uiPackages.length === 0) continue;

          for (const cssFile of ['src/components.css', 'src/index.css']) {
            const cssPath = join(appDir, cssFile);
            if (!existsSync(cssPath)) continue;

            const cssContent = readFileSync(cssPath, 'utf8');
            for (const uiPkg of uiPackages) {
              const expectedSource = `node_modules/${uiPkg}/src`;
              if (!cssContent.includes(expectedSource)) {
                violations.push({
                  file: cssPath,
                  line: 1,
                  message: `Missing @source directive for ${uiPkg} in ${cssFile}. Add: @source "../node_modules/${uiPkg}/src";`,
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
      check(addedLines) {
        return addedLines
          .filter(
            l => l.file.endsWith('vite.config.ts') && /singletonPrefixes\s*:\s*\[/.test(l.content) && !l.content.includes('@-label-/ui-'),
          )
          .map(l => ({
            file: l.file,
            line: l.line,
            message: 'singletonPrefixes must include "@-label-/ui-" to prevent duplicate UI package instances in federation mode.',
          }));
      },
    },
    {
      id: 'browserslistrc-required-for-apps',
      description:
        'Every package named app-* or mfe-* must have a .browserslistrc file so that Tailwind CSS (Lightning CSS) targets the correct browsers.',
      severity: 'warning',
      check(_addedLines, _ctx, allFiles) {
        const violations = [];

        const pkgFiles = (allFiles ?? []).filter(f => f.endsWith('/package.json'));

        for (const pkgFile of pkgFiles) {
          const dir = dirname(pkgFile);
          const pkgPath = resolve(pkgFile);
          if (!existsSync(pkgPath)) continue;

          let pkg;
          try {
            pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
          } catch {
            continue;
          }

          const name = (pkg.name ?? '').replace(/^@[^/]+\//, '');
          if (!name.startsWith('app-') && !name.startsWith('mfe-')) continue;

          const browserslistPath = join(dir, '.browserslistrc');
          if (!existsSync(browserslistPath)) {
            violations.push({
              file: pkgFile,
              line: 1,
              message: `Missing .browserslistrc in ${dir}. Packages named app-* or mfe-* must define browser targets for CSS output.`,
            });
          }
        }

        return violations;
      },
    },
  ],
};
