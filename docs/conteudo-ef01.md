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

## Catálogo EF01 de Língua Portuguesa

- **Brincando com Sons (EF01LP01–EF01LP02)**: desenvolve consciência fonológica com jogos de rima, aliteração e segmentação silábica apoiados por gestos, ritmos e interativos multimodais.
- **Família das Vogais (EF01LP03–EF01LP04)**: explora grafias e sons das vogais em diferentes suportes, articulando leitura, escrita e manipulação de palavras.
- **Palavras em Ação (EF01LP05–EF01LP06)**: amplia o repertório de leitura de palavras frequentes, conectando vocabulário do cotidiano a estratégias de decodificação.
- **Clubinho das Palavras (EF01LP06 + EF35LP20)**: promove leituras compartilhadas, produção de bilhetes e organização de pequenas mensagens para circulação real na comunidade escolar.
- **Frases Divertidas (EF01LP07–EF01LP08)**: fortalece a compreensão de frases curtas, inferindo intenções e reorganizando palavras para manter coesão e humor.
- **Bilhetes e Recados (EF01LP09–EF01LP10)**: orienta planejamento e revisão de textos funcionais breves, cuidando de cortesia, clareza e destinatário.
- **Histórias Rimadas (EF01LP11 + EF01LP01–EF01LP02)**: retoma jogos de linguagem com parlendas e poemas, expandindo a criação de versos rimados e aliterações em diferentes mídias.
- **Hora do Diálogo (EF01LP12–EF01LP13)**: trabalha escuta ativa, turnos de fala e relatos orais, simulando entrevistas, rodas de conversa e apresentações guiadas.
- **Palavras Compostas (EF01LP14–EF01LP15)**: amplia vocabulário com palavras compostas, campos semânticos e inferência de significados a partir de pistas contextuais.
- **Pontuação Animada (EF01LP16–EF01LP17)**: exercita leitura expressiva e escrita de frases com ponto final, interrogação e exclamação, relacionando sinal e entonação.
- **Jornal da Turma (EF01LP18–EF01LP24)**: percorre todo o ciclo de produção coletiva do jornal escolar, do planejamento e coleta à revisão, diagramação e divulgação.

### Tabela de habilidades por módulo

| Módulo                | Slug                    | BNCC (primária) | BNCC (secundárias)                                         |
| --------------------- | ----------------------- | --------------- | ---------------------------------------------------------- |
| Brincando com Sons    | `brincando-com-sons`    | EF01LP01        | EF01LP02                                                   |
| Família das Vogais    | `familia-das-vogais`    | EF01LP03        | EF01LP04                                                   |
| Palavras em Ação      | `palavras-em-acao`      | EF01LP05        | EF01LP06                                                   |
| Clubinho das Palavras | `clubinho-das-palavras` | EF01LP06        | EF35LP20                                                   |
| Frases Divertidas     | `frases-divertidas`     | EF01LP07        | EF01LP08                                                   |
| Bilhetes e Recados    | `bilhetes-e-recados`    | EF01LP09        | EF01LP10                                                   |
| Histórias Rimadas     | `historias-rimadas`     | EF01LP11        | EF01LP01, EF01LP02                                         |
| Hora do Diálogo       | `hora-do-dialogo`       | EF01LP12        | EF01LP13                                                   |
| Palavras Compostas    | `palavras-compostas`    | EF01LP14        | EF01LP15                                                   |
| Pontuação Animada     | `pontuacao-animada`     | EF01LP16        | EF01LP17                                                   |
| Jornal da Turma       | `jornal-da-turma`       | EF01LP18        | EF01LP19, EF01LP20, EF01LP21, EF01LP22, EF01LP23, EF01LP24 |

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

| Comando               | Descrição                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------ |
| `pnpm content:lint`   | Valida os arquivos em `data/content/raw`, checando schema, BNCC e unicidade.                                 |
| `pnpm content:assets` | Regenera as ilustrações e ícones EF01 em `public/assets/ef01` e atualiza `data/assets/ef01-manifest.json`.   |
| `pnpm content:build`  | Executa o lint, regenera os assets EF01 e gera `modules.json`, `interactive-activities.json` e `index.json`. |
| `pnpm check`          | Agora executa `content:lint`, `lint`, `content:build --no-write`, `type-check` e `test`.                     |

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

### Pipeline de assets EF01

- `pnpm content:assets` executa `scripts/generate-ef01-assets.ts`, produzindo SVGs (256×256) e PNGs (512×512) em `public/assets/ef01/{lingua-portuguesa|ciencias}/`.
- O manifest `data/assets/ef01-manifest.json` lista todos os assets com slug, tema, alt text em pt-BR, paleta utilizada e referência de licença (`public/assets/ef01/LICENSE.md`).
- O comando `pnpm content:build` carrega o manifest, valida se todos os arquivos existem e injeta automaticamente `altText`, `recommendedUsage`, hashes de cache busting e perfis de cor nos metadados das atividades/interativos sempre que um asset é referenciado por `slug` em `accessibility.assets`.
- Para usar um asset em uma atividade, basta adicionar algo como:

  ```yaml
  accessibility:
    assets:
      - slug: lp-silaba-ba
        type: IMAGEM
        title: "Sílabas para contação"
  ```

  O build preencherá os caminhos de SVG/PNG e o `altText` correspondente.

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
