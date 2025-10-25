# Arquitetura de dados e APIs

## Visão geral

A plataforma utiliza **Prisma ORM** com **SQLite** em desenvolvimento (configurado via `DATABASE_URL`) e foi projetada para migração simples para PostgreSQL em ambientes remotos. O modelo de domínio cobre usuários, trilhas de aprendizagem, módulos, atividades, progresso e recompensas. As rotas de API são implementadas com o App Router do Next.js e expõem operações de leitura e atualização necessárias para o MVP pedagógico.

O diagrama lógico simplificado é o seguinte:

- **AgeGroup** → segmenta aprendizes por faixa etária, controlando filtros de conteúdo.
- **LearningPath** → trilhas alinhadas a um AgeGroup; usuários se inscrevem via **LearningPathEnrollment**.
- **CurriculumStandard** → referência direta a códigos, competências e habilidades da BNCC para cada AgeGroup.
- **ContentModule** → unidades temáticas ligadas ao AgeGroup e a um CurriculumStandard. Servem como agrupador de atividades.
- **Activity** → jogos, quizzes e desafios lúdicos vinculados a ContentModule e CurriculumStandard.
- **Attempt** → registro de tentativas do estudante, com metadados opcionais (tempo, desempenho etc.).
- **Progress** → acompanha status agregado por ContentModule, consolidando tentativas e porcentagem de conclusão.
- **Reward** → badges concedidas ao usuário com critérios educacionais.

As chaves estrangeiras impõem coerência entre as camadas (por exemplo, uma Activity não pode existir sem um módulo e um padrão BNCC associados). Os campos `createdAt`/`updatedAt` suprimem necessidades futuras de auditoria.

## Integração com a BNCC

O documento oficial da BNCC em `docs/BNCC_EI_EF_110518_versaofinal_site.pdf` serviu de base para selecionar códigos representativos. Cada `CurriculumStandard` armazena:

- `bnccCode`: código original (ex.: `EF01LP06`).
- `competency`: texto principal da competência.
- `habilidades`: JSON serializado com uma lista `{ codigo, habilidade }`, preservando o vocabulário da BNCC.
- `description`: contextualização pedagógica opcional.

Essa abordagem permite consultar rapidamente quais competências cada módulo e atividade reforça, mantendo rastreabilidade para relatórios pedagógicos.

## Rotas de API

| Rota                            | Método  | Função                                                                                                          |
| ------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------- |
| `/api/modules?ageGroupSlug=...` | `GET`   | Lista módulos filtrados pela faixa etária, incluindo padrão BNCC e atividades com metadados.                    |
| `/api/attempts`                 | `POST`  | Registra uma tentativa de atividade, atualiza o progresso e retorna resumo da tentativa + progresso atualizado. |
| `/api/progress`                 | `PATCH` | Atualiza ou cria o progresso de um usuário em um módulo (percentual, status e tentativas).                      |
| `/api/rewards?userId=...`       | `GET`   | Recupera recompensas desbloqueadas por um usuário.                                                              |

Todas as entradas são validadas com **Zod**, garantindo coerência de dados antes de interagir com o banco.

## Estratégia de seed

`prisma/seed.ts` popula o banco com:

- Faixas etárias de referência (Educação Infantil, Fundamental I e II).
- Trilhas e módulos alinhados às competências escolhidas.
- Atividades lúdicas com diferentes níveis de dificuldade para cada módulo.
- Usuários de demonstração com progresso, tentativas e recompensas.

O script pode ser executado via `pnpm db:seed` e serve como referência para ampliar o catálogo mantendo a taxonomia BNCC.

## Como estender o modelo

1. **Adicionar novos padrões BNCC**
   - Inserir os códigos, competências e habilidades em `prisma/seed.ts` (ou via UI/admin futura).
   - Certificar-se de que `ageGroupSlug` corresponda a um grupo existente ou criar um novo `AgeGroup`.

2. **Criar novos módulos e atividades**
   - Associar o módulo (`ContentModule`) a um `CurriculumStandard` e `LearningPath`.
   - Para cada atividade, definir `activityType` (`GAME`, `PUZZLE`, `QUIZ`) e `difficulty` (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`).
   - Guardar metadados pedagógicos em `metadata` (objeto serializado) para descrever materiais, duração, etc.

3. **Ampliar recompensas e critérios**
   - Novas badges podem ser criadas relacionando objetivos pedagógicos às métricas de progresso (número mínimo de tentativas, conclusão de módulos, etc.).

4. **Preparar para PostgreSQL**
   - Ajustar `DATABASE_URL` e `DIRECT_URL` no `.env` conforme o provedor.
   - Executar `pnpm db:migrate` para aplicar as migrações no novo ambiente.

## Convenções e validação

- IDs utilizam `cuid()` para compatibilidade com múltiplos bancos.
- As enums de domínio são representadas como strings no banco para manter compatibilidade com SQLite; o código aplica validações com Zod (`activityType`, `difficulty`, `progressStatus`).
- JSON variável (`metadata`, `habilidades`) é serializado manualmente para garantir suporte nos diferentes providers.

## Fluxo de testes automatizados

A suíte `vitest` usa um banco SQLite isolado (`file:./test.db`). O arquivo `vitest.setup.ts` executa `prisma migrate deploy` e `prisma db seed` antes dos testes, garantindo que os dados de referência estejam sempre disponíveis. Os testes cobrem:

- Resposta da rota de módulos com filtros BNCC.
- Registro de tentativas e atualização automática do progresso.

Essa base facilita adicionar novos cenários garantindo estabilidade na evolução do backend.
