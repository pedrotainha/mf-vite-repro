# Instruções

- Neste repositório quero que a cada iteração que faças alterações faças commit com descrição, valida se o git já existe, se não existir, inicia, com dev e master, cria uma branch chamada foundation a partir de dev para estes commits. Cria commit inclusive cada vez que as permissões ou algum ficheiro de claude muda.

- Usa playwright caso faça sentido para interagires com a app ou apps por forma a teres acesso ao browser, aos erros da consola afim de conseguires validar que as tuas alterações mais de fundo não partiram nada.

- Não quero update do types/node para 25 porque estou a usar o node 24.
- Qualquer sugestão de projeto novo é com node 24 e pnpm 10, bibliotecas sempre que possível as últimas versões, caso não seja alertar antes de continuar.
- Quando for para consumir pacotes fora deste repo temos de instalar via pnpm i _PATH_.
- Após instalar/update ou remover packages valida pnpm audit.
- Após finalizar uma iteração, verifica se é uma feature deste POC para poder registar.

- Uma nota muito importante sobre os testes, deves me pedir autorização sempre para alterar um teste ou unit test quando este antes já dava ok, portanto se já existia o teste então estava bem, se falhou com alguma iteração é importante ter certeza do meu lado que é intencional mudar o teste.

- Das bibliotecas internas @-label-/* que este projeto importa é importante referir que se algo não estiver de acordo com os requisitos que se tem aqui, deves sugerir investigação na biblioteca para sugerir alterações na biblioteca, através de confirmação minha.

- As alterações/edits que necessitares de fazer estão contidos no scope deste repositório apenas, a não ser que numa iteração eu te peça para fazer algo ao lado.

- Nunca apagues commits, nem este repositório. Histórico do código deve ser sempre mantido caso te desvies do objetivo.

## Skills recomendadas por contexto

- Ao criar/modificar package.json → usar `/r_package-json` para validação
- Ao configurar pipeline/scripts de build → usar `/r_pipeline-react`

## Plano de Migração

Este repositório segue o plano documentado em `../POC_MFE_csr/docs/MIGRATION_PLAN_MF_VITE.md`.

O objetivo é replicar o POC_MFE_csr usando `@module-federation/vite` + Federation Runtime para carregamento dinâmico de MFEs via endpoint, em vez de `@originjs/vite-plugin-federation`.

Ficheiros de contexto disponíveis em `../POC_MFE_csr/docs/`:
- `ANALYSIS_CURRENT_POC.md` — análise completa do POC actual (features, patterns, stack)
- `ANALYSIS_FEDERATION_SPEC.md` — especificação técnica da arquitectura de federation actual
- `ANALYSIS_DEV_PATTERNS.md` — dev patterns a replicar (lint, prettier, hooks, changesets)
- `MIGRATION_PLAN_MF_VITE.md` — plano com 17 TODOs + tabela de rastreabilidade

## Gotchas (descobertos no TODO-01)

- **@-label-/lint-config exports:** usar `fullReactConfigs` para apps React, `defaultConfigs` para packages sem React. NÃO existe `fullConfigs`.
- **Arrow functions obrigatórias:** lint rule `prefer-arrow-functions` — usar sempre `export const foo = () => ...`, nunca `export function foo() { ... }`.
- **tsconfig.json obrigatório na root:** lint-config precisa de `tsconfig.json` (não apenas `tsconfig.base.json`) para import resolution.
- **Markdown code blocks:** todos os fenced blocks precisam de language specifier (```text, ```bash, etc.), nunca bare ```.

## Versionamento & Publish

Segue o workflow de changesets. Comando de publish: `pnpm publish:packages`.
