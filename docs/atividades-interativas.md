# Atividades interativas

Este guia descreve a arquitetura das atividades interativas (quizzes, quebra-cabeças e mini-jogos) e como estender o catálogo pedagógico alinhado à BNCC.

## Visão geral da arquitetura

A infraestrutura foi projetada para reutilizar lógica e apresentação entre diferentes modalidades de atividade:

- **Catálogo de conteúdo (`data/content/interactive-activities.json`)** – arquivo único que descreve cada experiência com metadados pedagógicos (BNCC, objetivos, tempo estimado) e a configuração específica de cada motor.
- **Camada de domínio (`src/lib/activities`)** – valida, carrega e avalia as atividades. Os módulos principais são:
  - `types.ts`: esquemas Zod e tipos TypeScript (quiz, puzzle, game).
  - `catalog.ts`: leitura do JSON, cache em memória e utilitários de busca.
  - `quiz.ts`, `puzzle.ts`, `game.ts`: motores puros responsáveis por pontuação, feedback e sugestão de dificuldade.
- **Camada de apresentação (`src/components/activities`)** – componentes React orientados a acessibilidade com feedback instantâneo, suporte a teclado e mensagens em português.
- **Instrumentação (`src/lib/analytics`)** – despacha eventos semânticos (`activity_started`, `activity_interaction`, `activity_completed`, `attempt_logged`) consumidos por relatórios e APIs de progresso.

Todas as strings exibidas aos estudantes são fornecidas em português diretamente pela fonte de conteúdo, facilitando a futura internacionalização.

## Fluxo de dados

1. Páginas e APIs chamam `loadInteractiveDataset()` ou `getInteractiveActivityBySlug()` para obter as definições.
2. Os componentes de UI recebem a definição já validada e instanciam o motor correspondente:
   - **Quiz**: aceita questões de múltipla escolha, verdadeiro ou falso e ordenação. O motor calcula pontuação percentual, sugere ajuste de dificuldade e emite feedback por questão.
   - **Puzzle**: atualmente implementa associação (drag & drop) com alternativa por teclado. Avalia combinações e retorna resumos pedagógicos.
   - **Game**: framework para mini-jogos sequenciais (ex.: desafios matemáticos) com vidas, tempo sugerido e mensagens adaptativas.
3. Ao final (ou durante interações significativas), o componente dispara eventos de analytics. O backend (`POST /api/attempts`) também emite `attempt_logged`, garantindo consistência dos dados de progresso.

## Adicionando novas atividades

1. **Cadastrar no JSON**: abra `data/content/interactive-activities.json` e inclua um novo objeto em `activities`. Campos obrigatórios:
   - `slug`, `title`, `type` (`"QUIZ"`, `"PUZZLE"` ou `"GAME"`).
   - `bnccCode`, `bnccDescription`, `contentModuleSlug`, `activitySlug` (mantêm o vínculo com a BNCC e com o módulo original).
   - `difficulty`, `estimatedTimeMinutes`, `instructions[]`, `objectives[]`.
   - Configuração específica do motor (`quiz`, `puzzle` ou `game`). Use os exemplos existentes como referência.
2. **Associar ao módulo**: caso a atividade já exista em `modules.json`, adicione `"interactiveSlug": "novo-slug"` dentro de `metadata`. O seed do Prisma persiste essa relação automaticamente.
3. **Validar estrutura**: execute `pnpm test` (ou aguarde a suíte automática) para garantir que os esquemas Zod aceitaram os novos dados.
4. **Criar interface customizada (opcional)**: se precisar de componentes específicos, adicione-os em `src/components/activities` e, se for um novo tipo, expanda os motores em `src/lib/activities`.

## Estendendo os motores

- **Quiz**: suporte adicional (ex.: perguntas abertas) deve seguir o padrão do discriminated union em `quizQuestionSchema`. Ajuste `evaluateQuizSubmission` para incorporar novas regras.
- **Puzzle**: adicione novos modos em `puzzleSchema` (ex.: sequência, labirinto) e atualize `evaluatePuzzleSubmission`. Para UI, crie componentes dedicados reaproveitando o container existente.
- **Game**: o motor trabalha com níveis lineares, pontuação percentual e vidas. Para dinâmicas mais complexas (ex.: tabuleiros), expanda o schema com os atributos necessários e adapte `evaluateGameSubmission`.

## Analytics e progresso

Os eventos emitidos pelo front-end seguem estrutura padrão:

- `activity_started`: usuário iniciou a atividade (contém `activitySlug` e `activityType`).
- `activity_interaction`: interação significativa (questão respondida, par combinado, nível jogado) com indicador de acerto.
- `activity_completed`: entrega do resultado final com `score` (0–100) e metadados usados pela API de progresso.
- `attempt_logged`: emitido pelo backend após registrar tentativa via `/api/attempts`.

Para consumir os eventos em outros módulos, use `subscribeToAnalytics()` disponível em `@/lib/analytics`.

## Boas práticas

- Sempre forneça **dicas, feedbacks e instruções em português** acolhedor, alinhados à faixa etária.
- Garanta **acessibilidade**: todas as interações de arrastar devem contar com alternativa via teclado ou seletor.
- Prefira **pontuações relativas (0–100)** para facilitar integração com relatórios.
- Documente novas mecânicas ou formatos adicionando seções extras neste arquivo.

Com essa base, novas experiências lúdicas podem ser prototipadas rapidamente, mantendo coerência pedagógica e rastreabilidade por BNCC.
