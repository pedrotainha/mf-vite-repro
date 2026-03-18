# ADR-004: CSS Architecture para Module Federation

## Status

Aceite

## Contexto

Numa arquitectura de micro-frontends com Module Federation, cada MFE é compilado independentemente e carregado em runtime no host. Isto cria desafios para CSS:

1. **Design System partilhado** — todos os MFEs usam `@-label-/ui-internal-core` (shadcn v3 + Tailwind v4), que exporta tokens, componentes e globals.
2. **Tailwind v4 com `@source`** — o scanner de classes precisa de saber onde procurar para gerar as utilities certas.
3. **Isolamento vs consistência** — os MFEs devem ter aparência consistente mas sem conflitos de CSS.

No POC_MFE_csr original (com `@originjs/vite-plugin-federation`), cada MFE tinha dois CSS: `index.css` (full DS) para standalone e `components.css` (utilities only) para quando carregado no host.

## Decisão

Adoptar uma arquitectura de CSS simplificada com Tailwind v4:

- **Host:** importa `@-label-/ui-internal-core/globals.css` (tokens + reset + base) e usa `@source` para scan de componentes partilhados.
- **Remotes:** importam apenas `tailwindcss` — quando carregados via Module Federation, herdam os globals do host.
- **`@source` directive** — cada app aponta para os seus próprios ficheiros e para os packages de UI partilhados.

## Razões

- **Tailwind v4 elimina a duplicação** — o engine detecta automaticamente quais classes são usadas via `@source`, sem necessidade de purge manual.
- **Globals centralizados** — um único ponto de importação para tokens do design system (`globals.css`).
- **Sem CSS-in-JS** — zero runtime CSS overhead, tudo resolvido em build time.
- **Simplicidade** — não é necessário manter dois CSS por MFE como no POC anterior.

## Riscos

- **Ordem de carregamento** — se um remote carrega antes do host completar o CSS, pode haver FOUC. Mitigado pelo facto do host montar antes de carregar remotes.
- **Tailwind version mismatch** — host e remotes devem usar a mesma versão do Tailwind para garantir que as utilities geradas são compatíveis.

## Consequências

- Cada app tem um único `index.css` no root de `src/`.
- Updates ao design system propagam-se automaticamente via `@source`.
- MFEs em standalone (dev isolado) funcionam com o seu próprio `index.css`.
