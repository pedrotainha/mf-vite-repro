# ADR-001: Escolha de @module-federation/vite sobre @originjs/vite-plugin-federation

## Status

Aceite

## Contexto

O POC_MFE_csr original utiliza `@originjs/vite-plugin-federation` v1.4.1 para Module Federation com Vite. Este plugin, apesar de funcional, tem limitações conhecidas:

1. **Singleton flag não implementada no runtime** — apenas existe nos type definitions, não no código executado. Workaround: `requiredVersion: "*"` para forçar semver check a passar.
2. **Dummy remote obrigatório no host** — o plugin só inicializa o shareScope quando `remotes` é não-vazio. É necessário um placeholder que nunca é fetched.
3. **React Compiler incompatível** — requer plugin de runtime fix que faz patch a chunks de federation (Proxy para flattenModule + rewrite de compiler-runtime para usar `importShared`).
4. **Sem runtime API oficial** — usa internals não documentados (`__federation_method_setRemote`, `__federation_method_getRemote`).
5. **Plugin da comunidade** — manutenção mais lenta, sem garantias de compatibilidade com versões futuras do Vite.

## Decisão

Usar `@module-federation/vite` (plugin oficial do Module Federation core team) com `@module-federation/runtime` para carregamento dinâmico.

## Razões

- **Runtime API oficial**: `init`, `registerRemotes`, `loadRemote` — API estável e documentada.
- **Singleton flag funcional**: implementada nativamente no runtime.
- **Sem dummy remote**: o plugin inicializa shareScope sem necessidade de placeholder.
- **Mantido pelo core team**: alinhamento com a evolução do Module Federation (webpack, rspack, vite).
- **`mf-manifest.json`**: alternativa ao `remoteEntry.js` com metadata adicional.
- **`type: 'module'`**: suporte explícito a ESM (Vite output format).

## Riscos

- **React Compiler**: pode ter issues semelhantes ao @originjs (hooks dispatcher em federation boundaries). Será avaliado no TODO-16.
- **Maturidade**: plugin mais recente, potencialmente menos battle-tested com Vite 7.
- **Breaking changes**: API pode mudar entre minor versions.

## Consequências

- O `packages/mfe-loader` será reescrito para usar `registerRemotes` + `loadRemote` em vez de `__federation_method_*`.
- O `packages/federation-config` pode simplificar (o plugin pode ter built-in shared config).
- O `packages/vite-plugin-federation-runtime-fix` pode não ser necessário (a avaliar).
- ADR-004 do POC original (dummy remote) torna-se obsoleto.
