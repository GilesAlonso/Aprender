# Sistema de Design Aprender Kids & Teens

Este guia descreve os fundamentos visuais e de interação da plataforma Aprender para crianças e adolescentes brasileiros, alinhado às diretrizes da BNCC e às boas práticas de acessibilidade digital.

## Princípios de experiência

1. **Afetuoso e inclusivo:** linguagem acolhedora, cores vibrantes com alto contraste e elementos que representem diferentes infâncias brasileiras.
2. **Clareza progressiva:** a interface apresenta informações em blocos curtos, com apoio de ícones e microtextos em português simples.
3. **Controle compartilhado:** estudantes, famílias e educadores encontram controles claros para adaptar ritmo, acessibilidade e ludicidade.
4. **Diversão com propósito:** animações suaves, conquistas colaborativas e metáforas lúdicas reforçam o senso de jornada e comunidade.

## Tokens de design (Tailwind CSS)

Os tokens estão definidos em `tailwind.config.ts` por meio de `theme.extend`. Eles podem ser usados diretamente nas classes Tailwind e nos componentes do design system.

### Paleta de cores

| Token                        | Uso                                    | Escala                                       |
| ---------------------------- | -------------------------------------- | -------------------------------------------- |
| `primary`                    | Ações principais, cabeçalhos ativos    | `50 #f1f5ff` – `500 #3773f6` – `900 #122652` |
| `secondary`                  | Destaques calorosos, CTAs secundários  | `50 #fff6eb` – `500 #f57300` – `900 #401b00` |
| `accent`                     | Recompensas, gamificação, badges       | `50 #ffeef9` – `500 #ff2eb7` – `900 #42052d` |
| `calm`                       | Feedback informativo, planos de fundo  | `50 #ecfcff` – `500 #0095dd` – `900 #012b3f` |
| `surface`                    | Fundos neutros e cartões               | `50 #fdfdfd` – `300 #e4ecf5`                 |
| `success`, `warning`, `info` | Estados do sistema e mensagens rápidas | escalas completas definidas no tema          |

> **Contraste:** todos os textos críticos passam o critério WCAG AA (≥ 4.5:1). Utilize as variações `500` – `700` para textos sobre superfícies claras.

### Tipografia

- `font-display`: Baloo 2, usada em títulos (`text-display-*`).
- `font-sans`: Nunito, aplicada em textos corridos (`text-body-*`).

Escala tailwind customizada:

| Token              | Tamanho & uso                      |
| ------------------ | ---------------------------------- |
| `text-display-2xl` | 68px – banners hero                |
| `text-display-lg`  | 48px – títulos de página           |
| `text-display-sm`  | 34px – seções e cartões principais |
| `text-body-lg`     | 20px – parágrafos de destaque      |
| `text-body-md`     | 17px – textos padrão               |
| `text-label-sm`    | 12px – legendas, badges            |

### Espaçamento e raio

- `px-gutter`, `px-gutter-lg`: margens horizontais responsivas.
- `py-section-sm`, `py-section-lg`: respiro vertical em telas grandes.
- `rounded-pill`, `rounded-4xl`: cantos generosos para reforçar a identidade amigável.

### Animações e movimento

- `animate-float`, `animate-wiggle`, `animate-sparkle-pop` oferecem transições suaves e repetição limitada.
- O utilitário `motion-safe:` é usado nos componentes interativos. Para usuários com preferência de movimento reduzido, o CSS global e o controle `reduceMotion` em Storybook garantem experiências equivalentes.

## Componentes disponíveis

Todos os componentes React ficam em `src/components/ui`.

| Componente                                         | Destaques                                                                                        |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `Button` (`primary`, `secondary`, `game`, `ghost`) | Grandes alvos de toque, suporte a ícones, estado de carregamento, foco visível                   |
| `Card`                                             | Variante `highlight`, `calm`, `neutral`; estrutura com `CardHeader`, `CardContent`, `CardFooter` |
| `Modal`                                            | Fechamento por ESC/overlay, foco preso no conteúdo, ações principais e secundárias               |
| `Tabs`                                             | Navegação por teclado (setas, Home, End), estados com semântica WAI-ARIA                         |
| `ProgressBar`                                      | Percentual automático, rótulos textuais e `aria-valuenow`                                        |
| `Badge` e `RewardChip`                             | Indicadores de status e gamificação com cores acessíveis                                         |
| `AgeSelector`                                      | Grupo de botões com `role="radiogroup"`, opções em português e atalhos Home/End                  |
| `ResponsiveNav`                                    | Navegação mobile-first com menu dialog, travamento de rolagem e CTAs configuráveis               |

### Layouts de referência

Disponíveis em `src/components/layouts`:

- `DashboardShell`: shell responsivo com navegação, área principal e painéis de acompanhamento.
- `ActivityDetailLayout`: estrutura para missões investigativas com abas e objetivos claros.
- `GameCanvasContainer`: canvas para jogos colaborativos com painel lateral e feed de eventos.
- `OnboardingFlow`: fluxo de configuração com etapas guiadas e suporte para famílias.

## Ilustrações e ícones

- Ícones vetoriais simples (`SparkIcon`, `RocketIcon`, `PuzzleIcon`, `StarIcon`) estão em `src/components/ui/icons.tsx`.
- Ilustrações temporárias (`public/illustrations/*.svg`) possuem paleta consistente e gradientes suaves.
- Licenciamento sugerido: publicar como **CC0** em produção ou substituir por artes originais aprovadas com consentimento explícito. Cada SVG inclui formas básicas para facilitar a troca futura.

### Diretrizes para novas artes

1. Utilize linhas arredondadas e volumes suaves para manter o tom amigável.
2. Combine cores primárias com neutros claros para preservar o contraste.
3. Inclua representações diversas (tons de pele, contextos regionais brasileiros).
4. Documente a fonte e a licença de cada arte na pasta `public/illustrations` quando adicionar arquivos oficiais.

## Acessibilidade

Checklist incorporado aos componentes e layouts:

- **Contraste:** tokens já validados com WCAG AA; utilize `text-neutral-900` sobre superfícies claras.
- **Foco visível:** todas as interações contam com `ring-offset` e `ring-primary`.
- **Teclado:** navegação garantida em `ResponsiveNav`, `Tabs`, `Modal` e `AgeSelector`.
- **Semântica:** atributos ARIA configurados (`role="dialog"`, `aria-modal`, `aria-current`, `aria-describedby`).
- **Movimento reduzido:** animações respeitam `prefers-reduced-motion` e podem ser testadas pelo controle global do Storybook.

## Storybook e regressão visual

1. **Instalação:** `pnpm install`
2. **Executar localmente:** `pnpm storybook`
3. **Gerar build estática:** `pnpm storybook:build`
4. **Testes automáticos (interações e acessibilidade):** `pnpm storybook:test`

O projeto utiliza `@storybook/test-runner`. Integre a etapa `storybook:test` no pipeline CI/CD ou em uma rotina diária para capturar regressões visuais e violações de acessibilidade.

## Boas práticas de implementação

- Prefira importar componentes do índice (`@/components/ui`) para manter consistência.
- Reaproveite tokens Tailwind (`bg-primary-500`, `text-body-md`, `px-gutter`) em vez de valores fixos.
- Evite textos em caixa alta exceto em badges; use português claro e inclusivo.
- Teste responsividade a partir de 320px: componentes foram validados para telas pequenas com touch targets ≥ 44px.

## Próximos passos sugeridos

- Criar variantes escuras (modo noturno) com tokens adicionais.
- Adicionar componentes de formulário (inputs, switches) compatíveis com acessibilidade.
- Conectar Storybook ao Chromatic ou Percy para capturas visuais automatizadas.
- Produzir uma biblioteca real de ilustrações com licenciamento definido e coautoria de estudantes.
