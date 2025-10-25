# Sistema de recompensas e progressão

Este documento descreve o desenho funcional do sistema de recompensas do projeto **Aprender**, explicando regras de desbloqueio, métricas de progressão e como personalizar conteúdos para diferentes perfis (estudantes, familiares e educadores).

## Visão geral

O novo serviço de progresso consolida dados de tentativas, domínio BNCC e engajamento para gerar:

- **Atualização automática de métricas** por módulo e competência (maestria, streaks, tempo médio, precisão).
- **Distribuição de XP** proporcional ao desempenho, mantendo uma curva de progressão suave.
- **Níveis e marcos** com feedback imediato (toasts acessíveis + animações suaves).
- **Recompensas colecionáveis** categorizadas (badges, itens, níveis e marcos de XP).
- **Dashboards diferenciados**: visão do estudante e digest para educadores/família.

Os dados são persistidos via Prisma nos modelos `Progress`, `CompetencyProgress`, `Reward` e campos adicionais do `User` (XP, nível, streaks).

## Categorias de recompensa

| Categoria     | Quando ocorre                                          | Exemplo de uso                       |
| ------------- | ------------------------------------------------------ | ------------------------------------ |
| `XP`          | Ao cruzar múltiplos de 500 XP acumulados               | Incentivar consistência de estudo    |
| `LEVEL`       | Ao subir de nível                                      | Reconhecer marcos de evolução global |
| `BADGE`       | Ao concluir módulo, manter streaks ou atingir maestria | Medalhas temáticas alinhadas à BNCC  |
| `COLLECTIBLE` | Conquistas raras (ex.: maestria 95%+)                  | Itens especiais para coleção digital |

Cada recompensa registra:

- `code` único por usuário (`userId + code`).
- `category`, `rarity` (`COMMON`, `RARE`, `EPIC`, `LEGENDARY`).
- `xpAwarded` e `levelAchieved` (quando aplicável).
- `metadata` JSON para personalização (ex.: slug do módulo, BNCC, itens colecionáveis).

## Regras de desbloqueio

1. **Conclusão de módulo**: maestria/percentual ≥ 100% → badge `module:{moduleId}:completion` (raridade épica).
2. **Sequências de acertos**: thresholds em 3, 5 e 10 tentativas consecutivas → badges `module:{moduleId}:streak:${threshold}` com raridade crescente.
3. **Domínio BNCC**:
   - ≥ 80% → badge `competency:{standardId}:mastery80` (épico).
   - ≥ 95% → colecionável `competency:{standardId}:mastery95` (lendário).
4. **Níveis e marcos de XP**:
   - Subir de nível após atingir o limiar (base 1000 XP + 500 XP por nível adicional).
   - A cada 500 XP acumulados, o marco `xp:{total}` é registrado.

Todas as regras são aplicadas dentro de `applyProgressUpdate`, garantindo consistência transacional com os dados de tentativa.

## Progressão de nível

- **Curva base**: nível 1 → 1000 XP / nível seguinte adiciona 500 XP.
- `computeLevelFromXp` calcula dinamicamente `level` e `nextLevelAt`.
- Campos por usuário:
  - `xp`, `level`, `nextLevelAt`: acompanham o estado atual.
  - `currentStreak`, `longestStreak`: usados para bônus de XP e feedback.

### Distribuição de XP

`computeXpGain` considera:

- Tentativa bem-sucedida (base 80 XP) ou não (25 XP mínimos).
- `score`, `accuracy` e tempo gasto (intervalo ideal entre 60s e 360s).
- Bônus adicional para streaks ≥ 3.

A resposta do endpoint `/api/attempts` devolve o XP ganho, progresso do módulo, domínio BNCC e recompensas desbloqueadas.

## APIs

- `POST /api/attempts`: registra tentativa e retorna resumo completo (tentativa, progresso de módulo/competência, XP atualizado, recompensas).
- `GET /api/progress/summary?userId=...`: fornece visão consolidada para o dashboard do estudante.
- `GET /api/progress/digest?userId=...`: gera digest simplificado para familiares/educadores.

Todas utilizam validação Zod (`progressSummaryQuerySchema`, `logAttemptSchema`).

## Dashboards & UI

- **/progresso/[userId]**: visão do estudante com cartões de progresso, metas, coleção de recompensas e toasts animados para novas conquistas.
- **/progresso/[userId]/educador**: digest para educadores, com destaques BNCC, focos prioritários e recomendações práticas.
- **RewardToastLayer**: camada acessível (`aria-live`) + áudio curto via Web Audio API.
- Componentes reutilizáveis (`ProgressOverview`, `UpcomingGoals`, `RewardShelf`, `CompetencyHighlights`, `EducatorDigestPanel`).

Os estilos seguem o design system existente (`Card`, `Badge`, `ProgressBar`), mantendo consistência com o restante da aplicação.

## Personalização

- **Curvas de nível**: alterar constantes `LEVEL_BASE_THRESHOLD` e `LEVEL_STEP` em `src/lib/progress/engine.ts`.
- **Thresholds de streak**: `STREAK_REWARD_THRESHOLDS` exportado do mesmo arquivo.
- **Regras de recompensas**: centralizadas em `evaluateRewards`; edite mensagens, categorias ou raridades conforme necessário.
- **Metas sugeridas**: função `buildUpcomingGoals` pode receber novos critérios (ex.: badges específicos, habilidades socioemocionais).

## Testes

- `src/lib/progress/__tests__/engine.test.ts`: cobre cálculo de nível e desbloqueio de recompensas.
- `src/app/api/__tests__/learning-api.test.ts`: garante integração do endpoint `/api/attempts` com analytics e persistência Prisma.

## Próximos passos sugeridos

1. Ajustar copywriting dos toasts conforme identidade sonora/visual definitiva.
2. Incluir filtros por faixa etária e trilha na API de resumo quando houver personas adicionais.
3. Integrar notificações com um hub central (ex.: WebSocket) para sessões simultâneas.
4. Expandir colecionáveis com raridades configuráveis e temporadas temáticas.
