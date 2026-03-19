# ADR-006: Desactivar DTS plugin do Module Federation (`dts: false`)

## Status

Aceite

## Contexto

O `@module-federation/vite` inclui um sub-plugin de DTS (`@module-federation/dts-plugin`) que:

1. Gera type definitions (`.d.ts`) para os módulos expostos por cada remote.
2. Em dev mode, levanta um servidor WebSocket/HTTP em cada remote para servir type hints ao host em tempo real.
3. O host tenta ligar-se aos DTS servers dos remotes para obter tipos dinâmicos.

Na prática, nesta arquitectura:

- Os **remotes são carregados dinamicamente** via `@-label-/mfe-loader` + `@module-federation/runtime` (`loadRemote`). Não existem imports estáticos dos módulos remotos no código do host.
- Os tipos dos contratos entre host e remotes são definidos no package `@-label-/contracts`, partilhado via monorepo — não dependem do DTS plugin.
- O DTS plugin gera erros na consola do browser em dev mode (`dynamic-remote-type-hints-plugin`, `net::ERR_CONNECTION_REFUSED`, `WebSocket is already in CLOSING or CLOSED state`) sempre que algum remote não está a correr localmente.
- O bug conhecido com `__dirname` em ESM (`@module-federation/dts-plugin`) gera warnings adicionais no build.

## Decisão

Desactivar o DTS plugin em todas as apps com `dts: false` na configuração do `federation()`.

## Razões

- **Sem valor real**: os imports de MFEs são dinâmicos — não há autocompleção de tipos remotos em dev, mesmo com o plugin activo.
- **Tipos partilhados via `@-label-/contracts`**: os contratos (props, config, etc.) já têm tipagem forte no monorepo.
- **Elimina ruído**: remove 3 filtros de erros do fixture de e2e e limpa a consola de dev.
- **Menos dependências em runtime**: o DTS plugin puxa `@module-federation/dts-plugin` que inclui WebSocket server, HTTP client, e lógica de compilação TS desnecessária.
- **Bug `__dirname` em ESM**: o plugin tem um bug conhecido que gera warnings — desactivar evita-o.

## Alternativas Consideradas

### Configurar as portas do DTS plugin correctamente

- **Pro**: type hints em dev.
- **Contra**: requer todos os remotes a correr em simultâneo; porta extra por remote; falha em CI/e2e; manutenção por cada novo remote; benefício limitado dado que os imports são dinâmicos.
- **Decisão**: não compensa o custo para esta arquitectura.

## Consequências

- Os erros `dynamic-remote-type-hints-plugin`, `net::ERR_CONNECTION_REFUSED` e `WebSocket is already in CLOSING or CLOSED state` desaparecem da consola.
- Os filtros correspondentes no fixture de e2e (`e2e/fixtures.ts`) foram removidos.
- Se no futuro houver imports estáticos de remotes (e.g., `import type { X } from 'fleet/...'`), esta decisão deve ser reavaliada.
