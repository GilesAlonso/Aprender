# Personalização por faixa etária e estilo de aprendizagem

Este documento descreve como o Aprender coleta a idade do estudante, associa a etapa da BNCC correspondente e filtra conteúdos de acordo com a faixa etária. Também traz orientações para educadores e administradores ajustarem as faixas etárias e as mensagens exibidas ao público.

## Visão geral do fluxo

1. **Onboarding infantil**
   - A página `/onboarding` conduz responsáveis e estudantes por três passos: idade, estilo de aprendizagem e revisão.
   - O formulário combina um seletor lúdico de faixas etárias, entrada numérica (4–17 anos) e um campo para estilo de aprendizagem preferido.
   - Há um aviso permanente para responsáveis, além de um espaço para educadores aplicarem **ajuste manual** da etapa BNCC em turmas multisseriadas.

2. **Persistência**
   - A rota `POST /api/onboarding` valida o payload com Zod e utiliza `resolveStudentAgeGroup` para identificar a etapa BNCC.
   - Sempre que um `userId` é informado, o campo `ageGroupId` do usuário é atualizado via Prisma.
   - O endpoint grava cookies (`ageGroupSlug`, `studentAge`, `learningStyle`) válidos por 30 dias. Esses cookies alimentam as próximas requisições, mesmo sem login.

3. **Conteúdo adaptativo**
   - A rota `GET /api/modules` lê idade, usuário, override ou cookies para determinar o **age group do estudante**.
   - Quando a etapa solicitada difere da etapa indicada para o estudante, os módulos são marcados como `access: "locked"` e acompanhados de uma mensagem amigável. Ao mesmo tempo, módulos compatíveis são retornados em `recommendedModules`.
   - O contexto completo é retornado em `context` (etapa solicitada, etapa do estudante, origem da resolução e mensagem final para UI).

## Mapeamento oficial de idades para BNCC

| Slug                        | Etapa BNCC                                      | Idades (inclusive) | Competências em destaque                                                                 |
| -------------------------- | ----------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------- |
| `educacao-infantil`        | Educação Infantil                               | 4 – 5              | EI03ET04, EI03CG05 – expressão corporal, musicalidade e curiosidade nas interações      |
| `fundamental-anos-iniciais`| Ensino Fundamental – Anos Iniciais              | 6 – 10             | EF01LP06, EF02MA05 – alfabetização, leitura de textos curtos e resolução de problemas    |
| `fundamental-anos-finais`  | Ensino Fundamental – Anos Finais                | 11 – 14            | EF07CI02, EF69LP32 – investigações científicas, comunicação multimodal e protagonismo    |
| `ensino-medio`             | Ensino Médio                                    | 15 – 17            | EM13MAT305, EM13CHS602 – análise de dados, projeto de vida e impactos socioambientais    |

> Os textos completos (resumo para crianças, nota para responsáveis, competências e habilidades) estão centralizados em `src/lib/personalization/age-stages.ts`.

## Como funciona o bloqueio/desbloqueio de conteúdo

- Se o estudante pede módulos de outra faixa etária, a API marca o item com `access: "locked"` e inclui a mensagem: “Combine com um educador para desbloquear quando fizer sentido.”
- Os módulos adequados ao estudante são retornados em `recommendedModules`, garantindo que a interface sempre ofereça um caminho seguro para continuar aprendendo.
- A lógica de fallback considera, em ordem: override manual, perfil do usuário, cookie de sessão, idade informada e, por fim, o menor grupo cadastrado.

## Ajustando faixas etárias e textos

1. **Atualize a configuração de etapas**
   - Edite `src/lib/personalization/age-stages.ts` para alterar intervalos, textos para famílias, competências e habilidades.
   - Caso adicione uma nova etapa, inclua `slug`, faixa etária, mensagens e opções de estilo de aprendizagem.

2. **Repovoe os dados de referência**
   - Execute `pnpm db:seed` (ou o comando equivalente no ambiente) para recriar registros em `AgeGroup`, `LearningPath`, `CurriculumStandard`, `ContentModule` e `Activity` alinhados ao novo mapeamento.

3. **Verifique os testes automatizados**
   - Rode `pnpm test`. Os testes `age-groups.test.ts` e `learning-api.test.ts` garantem que o mapeamento 4–17 anos continua correto e que o bloqueio amigável permanece funcionando.

4. **Atualize documentação adicional e histórias**
   - Ajuste conteúdos no Storybook (`DashboardShell.stories.tsx`, `AgeSelector.stories.tsx`) para refletir novas faixas.
   - Comunique a mudança à equipe pedagógica, pois relatórios e trilhas podem depender do slug do `AgeGroup`.

## Boas práticas para administradores

- Prefira **incrementos graduais** ao alterar faixas. Salve versões antigas da configuração antes de publicar novos intervalos.
- Ao usar o ajuste manual no onboarding, combine com a equipe docente para definir critérios transparentes (ex.: aceleração ou apoio individualizado).
- Utilize o campo “guia para responsáveis” para orientar famílias sobre rotinas, tempos de tela e participação comunitária.
- Revise mensagens no dashboard para garantir coerência entre etapa, competências e recomendações personalizadas.

Com esse fluxo, o Aprender mantém um onboarding amigável para crianças, garante supervisão adulta e entrega conteúdos alinhados à BNCC, preservando flexibilidade para educadores personalizarem a jornada. 
