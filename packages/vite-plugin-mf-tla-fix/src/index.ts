import type { Plugin } from 'vite';

/**
 * Fixes TLA (Top-Level Await) deadlocks in `@module-federation/vite` production
 * builds when using Vite 8 (rolldown).
 *
 * ## Root cause
 *
 * Rolldown merges the `runtimeInit` virtual module into a `loadShare` chunk
 * that has browser-level TLA (`var o = await initPromise.then(…)`). Other
 * loadShare chunks and shared-module bundles import from this combined chunk,
 * creating circular static dependencies in the ES module evaluation graph.
 *
 * When any chunk's TLA calls `loadShare()` → `get()` → `import(sharedBundle)`,
 * the shared bundle's static deps lead back to loadShare chunks with pending
 * TLA — **deadlock**.
 *
 * ## Fixes (generic — not tied to any specific library)
 *
 * 1. **Remove side-effect imports** of the combined chunk from ALL other
 *    chunks (shared bundles, remoteEntry, etc.). These bare imports create
 *    circular TLA: combined chunk TLA → loadShare() → import(sharedBundle)
 *    → sharedBundle waits for combined chunk's TLA → deadlock.
 *
 * 2. **Convert hostInit to TLA** — The MF plugin's `hostInit` is
 *    fire-and-forget; adding `await` ensures `initPromise` is resolved before
 *    the main bundle starts loading.
 *
 * 3. **Break runtimeInit static imports** — In every chunk that imports the
 *    runtimeInit bindings (`a`, `i`, `r`) from the combined loadShare chunk,
 *    replace the static import with inline globalThis access. Once circular
 *    static dependencies are removed, browser-level TLA in loadShare chunks
 *    is safe — ES module evaluation naturally waits before dependent modules
 *    execute.
 *
 * 4. **Eagerly evaluate rolldown lazy-init** — Rolldown wraps loadShare
 *    chunks in a lazy evaluator `var X = n(async () => {...})`. Importing
 *    modules use `await X()` to trigger evaluation, but some code runs
 *    before any `await` call, accessing undefined exports. Adding
 *    `await X();` at module scope converts the lazy pattern to TLA,
 *    so exports are populated before dependent modules execute.
 *
 * 5. **Inline HTML scripts** with `await import()` (like dev mode).
 */
export const mfTlaFixPlugin = (): Plugin => {
  let outDir = '';

  return {
    name: 'mf-tla-fix',
    apply: 'build',
    enforce: 'post',

    configResolved(config) {
      outDir = config.build.outDir;
    },

    generateBundle(_options, bundle) {
      // =================================================================
      // Step 1: Find the combined runtimeInit + loadShare chunk
      // =================================================================
      let combinedChunkFileName = '';
      let globalKey = '';

      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type !== 'chunk') continue;

        if (chunk.code.includes('__mf_init__') && chunk.code.includes('await ')) {
          combinedChunkFileName = fileName;
          const keyMatch = chunk.code.match(/`(__mf_init__[^`]+)`/);
          if (keyMatch) globalKey = keyMatch[1]!;
        }
      }

      if (!combinedChunkFileName || !globalKey) return;

      const combinedBaseName = combinedChunkFileName.split('/').pop()!;

      // =================================================================
      // Fix 1: Remove ALL side-effect imports of the combined chunk
      //
      // Rolldown adds bare `import"./combined-chunk"` to shared bundles
      // (e.g. modern.js, development.js) and remoteEntry. These create
      // circular TLA dependencies: the combined chunk's TLA calls
      // loadShare() → import(sharedBundle) → sharedBundle waits for the
      // combined chunk's TLA → deadlock.
      // =================================================================
      const sideEffectImport = `import"./${combinedBaseName}";`;

      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type !== 'chunk') continue;
        if (fileName === combinedChunkFileName) continue;

        if (chunk.code.includes(sideEffectImport)) {
          chunk.code = chunk.code.replace(sideEffectImport, '');
        }
      }

      // =================================================================
      // Fix 2: Convert hostInit from fire-and-forget to TLA
      // =================================================================
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type !== 'chunk') continue;

        if (fileName.includes('hostInit') || fileName.includes('Init')) {
          const fireAndForget = /(?<!await )Promise\.resolve\((\w)\)\.then\(\w=>\s*Promise\.resolve\(\w\.__tla\)/;
          if (fireAndForget.test(chunk.code)) {
            chunk.code = chunk.code.replace(fireAndForget, m => `await ${m}`);
          }
        }
      }

      // =================================================================
      // Fix 3: Replace runtimeInit bindings from the combined chunk
      //         with inline globalThis access, preserving other bindings
      // =================================================================
      const RUNTIME_BINDINGS = new Set(['a', 'i', 'r']);

      const globalThisInit = [
        `var __gk=\`${globalKey}\`;`,
        `if(!globalThis[__gk]){`,
        `let __re,__rj;`,
        `var __p=new Promise(function(a,b){__re=a;__rj=b});`,
        `globalThis[__gk]={initPromise:__p,initResolve:__re,initReject:__rj}`,
        `}`,
      ].join('');

      const runtimeImportRegex = new RegExp(`import\\{([^}]+)\\}from"\\./${escapeRegex(combinedBaseName)}"`);

      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type !== 'chunk') continue;
        if (fileName === combinedChunkFileName) continue;

        const importMatch = runtimeImportRegex.exec(chunk.code);
        if (!importMatch) continue;

        const bindings = importMatch[1]!.split(',').map(b => {
          const parts = b.trim().split(/\s+as\s+/);
          return { imported: parts[0]!, local: parts[1] ?? parts[0]! };
        });

        const runtimeBindings = bindings.filter(b => RUNTIME_BINDINGS.has(b.imported));
        const otherBindings = bindings.filter(b => !RUNTIME_BINDINGS.has(b.imported));

        // Build globalThis var declarations for runtimeInit bindings
        const varDecls = runtimeBindings
          .map(b => {
            if (b.imported === 'a') return `var ${b.local}=function(){};`;
            if (b.imported === 'i') return `var ${b.local}=globalThis[__gk].initResolve;`;
            if (b.imported === 'r') return `var ${b.local}=globalThis[__gk].initPromise;`;
            return `var ${b.local};`;
          })
          .join('');

        // Keep the import statement for non-runtimeInit bindings
        const keptImport =
          otherBindings.length > 0
            ? `import{${otherBindings.map(b => (b.imported === b.local ? b.imported : `${b.imported} as ${b.local}`)).join(',')}}from"./${combinedBaseName}"`
            : '';

        chunk.code = chunk.code.replace(importMatch[0], `${keptImport ? `${keptImport};` : ''}${globalThisInit}${varDecls}`);
      }

      // =================================================================
      // Fix 4: Eagerly evaluate rolldown lazy-init in loadShare chunks
      //
      // Rolldown wraps loadShare chunks with `var X = n(async()=>{...})`.
      // The main bundle uses `await X()` to trigger evaluation, but some
      // code accesses exports before any await. Adding `await X();` at
      // module scope converts lazy-init to TLA, so ES module evaluation
      // ensures exports are populated before dependent modules run.
      // =================================================================
      // Matches both `var X=e((async()=>{` and `...,S=e((async()=>{`
      const lazyInitPattern = /(\w+)\s*=\s*\w+\(\(\s*async\s*\(\s*\)\s*=>\s*\{/;

      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type !== 'chunk') continue;
        if (!fileName.includes('__loadShare__')) continue;

        const match = lazyInitPattern.exec(chunk.code);
        if (!match) continue;

        const lazyVar = match[1]!; // e.g. "X" or "S"

        // Find the export statement and add `await LAZYVAR();` before it
        const exportIdx = chunk.code.lastIndexOf('export{');
        if (exportIdx < 0) continue;

        chunk.code = chunk.code.slice(0, exportIdx) + `await ${lazyVar}();` + chunk.code.slice(exportIdx);
      }
    },

    // =================================================================
    // Fix 5: Inline HTML scripts with await import()
    // =================================================================
    closeBundle: {
      order: 'post',
      sequential: true,
      async handler() {
        const { readFile, writeFile } = await import('node:fs/promises');
        const { resolve } = await import('node:path');

        const htmlPath = resolve(outDir, 'index.html');
        let html: string;

        try {
          html = await readFile(htmlPath, 'utf-8');
        } catch {
          return;
        }

        const result = inlineModuleScripts(html);
        if (result !== html) {
          await writeFile(htmlPath, result, 'utf-8');
        }
      },
    },
  };
};

// ---------------------------------------------------------------------------
// HTML post-processing
// ---------------------------------------------------------------------------

const inlineModuleScripts = (html: string): string => {
  const scriptRegex = /<script\s+type="module"\s+(?:crossorigin\s+)?src="([^"]+)"[^>]*><\/script>/g;
  const scripts: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(html)) !== null) {
    scripts.push(match[1]!);
  }

  if (scripts.length < 2) return html;

  const awaitImports = scripts.map(src => `await import("${src}");`).join('\n');
  const inlineScript = `<script type="module">\n${awaitImports}\n</script>`;

  let result = html.replace(scriptRegex, '');
  result = result.replace('</body>', `${inlineScript}\n</body>`);

  return result;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const escapeRegex = (str: string): string => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
