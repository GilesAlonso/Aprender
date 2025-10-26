# Conteúdo EF01: fluxo de autoria estruturada

Este guia descreve como organizar e validar o conteúdo pedagógico do 1º ano do Ensino Fundamental (EF01) utilizando o workspace de arquivos YAML/MDX localizado em `data/content/raw`. O mesmo formato atende módulos de outras etapas, mas aqui focamos na coleta de requisitos específicos para EF01.

## Estrutura do workspace

```
data/
└─ content/
   ├─ raw/
   │  ├─ _partials/              # Snippets reutilizáveis (acessibilidade, feedback etc.)
   │  ├─ ef01/
   │  │  └─ lingua-portuguesa/   # Módulos EF01 de Língua Portuguesa
   │  ├─ ef05/
   │  ├─ ef07/
   │  ├─ ef69/
   │  └─ em/
   ├─ modules.json               # Bundle consumido pela aplicação
   ├─ interactive-activities.json
   └─ index.json                 # Tabelas de lookup geradas automaticamente
```

Cada arquivo de módulo possui duas chaves principais:

- `module`: metadados do módulo (slug, título, estágio, componente curricular, BNCC, resultados de aprendizagem, tags).
- `activities`: lista de atividades com campos pedagógicos e técnicos. Os campos mais importantes são:
  - `difficulty`: usa a taxonomia em português `INICIAR | PRATICAR | DOMINAR`.
  - `bncc`: bloco com `code` e lista de `habilidades` alinhadas ao dataset BNCC em `data/bncc/standards.json`.
  - `accessibility`: orientações de hints, feedback, assets e pré-requisitos.
  - `interactive`: definição opcional de quiz/puzzle/game que será compilada para `interactive-activities.json`.

### Uso de partials

O diretório `_partials` concentra trechos reutilizáveis. Nas atividades, basta declarar `partial: ../../_partials/arquivo.yaml`. O CLI mescla os dados do partial com a atividade e concatena arrays de hints/assets.

## CLI de conteúdo

Três scripts foram adicionados ao `package.json`:

| Comando              | Descrição                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------- |
| `pnpm content:lint`  | Valida os arquivos em `data/content/raw`, checando schema, BNCC e unicidade.             |
| `pnpm content:build` | Executa o lint e gera `modules.json`, `interactive-activities.json` e `index.json`.      |
| `pnpm check`         | Agora executa `content:lint`, `lint`, `content:build --no-write`, `type-check` e `test`. |

Para fluxo diário:

```bash
pnpm content:lint          # garante que os YAML/MDX estão consistentes
pnpm content:build         # reidrata os bundles utilizados pela aplicação e pelo seed do Prisma
```

O comando `pnpm build` também executa `content:build` automaticamente, garantindo bundles atualizados antes do build do Next.js.

### Lint e validação de BNCC

O lint faz as seguintes verificações:

- Schema Zod de módulos/atividades/acessibilidade.
- Existência de códigos BNCC e habilidades listadas no dataset oficial.
- Unicidade de slugs de módulos/atividades/interativos.
- Garantia de pelo menos duas atividades por módulo e alinhamento de objetivos entre atividades e interativos.

Qualquer falha é exibida com o caminho do arquivo. Avisos indicam ajustes pedagógicos opcionais.

### Build determinístico

O build gera três artefatos determinísticos:

- `data/content/modules.json`: conjunto completo de módulos, incluindo metadados de acessibilidade e dificuldade.
- `data/content/interactive-activities.json`: catálogo dos interativos (quiz/puzzle/game).
- `data/content/index.json`: tabelas auxiliares para lookup por sujeito, estágio e dificuldade, além de hash de conteúdo.

Durante o build, os hashes são calculados via SHA-256 do conteúdo gerado. No ambiente de testes (`build.test.ts`), o relógio é fixado para manter snapshots estáveis.

## Testes

Foram criados testes Vitest em `src/lib/content/__tests__` que cobrem:

- Carregamento e validação do workspace (`schema.test.ts`).
- Execução do lint sem erros (`lint.test.ts`).
- Build determinístico com snapshot sanitizado (`build.test.ts`).

Execute-os com:

```bash
pnpm test --run
```

## Fluxo recomendado para novos módulos EF01

1. Duplicar um módulo existente em `data/content/raw/ef01/lingua-portuguesa`. Ajustar slugs, títulos e BNCC.
2. (Opcional) Criar novos partials em `_partials` para reutilizar dicas de acessibilidade.
3. Atualizar objetivos das atividades e, se houver interativo associado, garantir que `learningObjectives` e `interactive.objectives` permaneçam alinhados.
4. Rodar `pnpm content:lint` e corrigir qualquer alerta/erro.
5. Rodar `pnpm content:build` para gerar os JSONs consumidos pela aplicação e pelo seed do Prisma.
6. Executar `pnpm test` para assegurar que os snapshots continuam válidos.

Seguindo esse fluxo, o conteúdo EF01 permanece versionado, validado e pronto para uso em produção.
