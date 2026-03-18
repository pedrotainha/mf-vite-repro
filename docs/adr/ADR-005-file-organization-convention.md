# ADR-005: File Organization — Folder + Explicit Name (sem barrel exports)

## Status

Aceite

## Contexto

Num monorepo com múltiplas apps e packages, é necessária uma convenção consistente de organização de ficheiros para facilitar navegação, refactoring e code review.

Duas abordagens comuns:

1. **Barrel exports** (`index.ts` re-exports) — cada pasta tem um `index.ts` que re-exporta. Facilita imports curtos (`import { Foo } from './components'`) mas causa problemas de tree-shaking, circular dependencies e dificulta "go to definition".
2. **Folder + explicit name** — cada componente tem pasta própria com ficheiro nomeado explicitamente. Imports referenciam o ficheiro directamente.

## Decisão

Adoptar **folder + explicit name** sem barrel exports:

```text
src/
  Layout/
    Layout.tsx
  pages/
    Home/
      Home.tsx
    NotFound/
      NotFound.tsx
  MfeErrorBoundary/
    MfeErrorBoundary.tsx
```

- Pastas em `PascalCase` para componentes React.
- Ficheiro principal com o mesmo nome da pasta (`Layout/Layout.tsx`).
- Sem `index.ts` barrel files nas pastas de componentes.
- Ficheiros root (`main.tsx`, `index.css`, `App.tsx`) directamente em `src/`.

## Razões

- **Tree-shaking fiável** — sem barrels, o bundler sabe exactamente o que é importado.
- **Zero circular dependencies** — barrels são a causa mais comum de cycles em monorepos.
- **"Go to definition" funciona** — IDEs navegam directamente para o ficheiro, não para um re-export.
- **Grepping** — `grep Layout.tsx` encontra exactamente o ficheiro, não um barrel.
- **Consistência com shadcn** — a convenção de shadcn v3 também usa ficheiros explícitos.

## Riscos

- **Imports mais longos** — `import Home from './pages/Home/Home'` vs `import Home from './pages/Home'`. Aceitável dado os benefícios.

## Consequências

- Novos componentes seguem a convenção `Folder/Folder.tsx`.
- Packages internos exportam via `src/index.ts` (o único barrel permitido é o entry point do package).
- Linters podem ser configurados para prevenir `index.ts` em pastas de componentes.
