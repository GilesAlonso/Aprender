# Aprender

> Plataforma educacional em português que utiliza inteligência artificial para apoiar estudantes brasileiros com trilhas alinhadas à Base Nacional Comum Curricular (BNCC).

## Visão do projeto

Aprender nasce com a missão de oferecer experiências de aprendizagem calorosas, seguras e personalizadas. A aplicação combina curadoria pedagógica, inteligência artificial e um design acolhedor para ajudar crianças, famílias e educadores a percorrerem jornadas conectadas à BNCC.

## Stack principal

- **Next.js 14 (App Router) + TypeScript em modo estrito** para experiências híbridas (SSR/CSR) e rotas de API.
- **pnpm** com suporte a workspace (`pnpm-workspace.yaml`).
- **Tailwind CSS 3** com tokens de cores, tipografia infantil amigável e animações suaves.
- **Internacionalização** via `next-intl`, configurada por padrão para `pt-BR` com arquivos de tradução em `src/i18n/messages`.
- **Vitest + Testing Library** para testes unitários e de componentes.
- **ESLint + Prettier** integrados ao fluxo de desenvolvimento.
- **Husky + lint-staged** garantindo lint e formatação automática antes dos commits.

## Pré-requisitos

- Node.js 20+
- pnpm 8+

Ative o Corepack, caso necessário:

```bash
corepack enable
```

## Primeiros passos

```bash
pnpm install
pnpm dev
```

A aplicação ficará disponível em `http://localhost:3000`.

## Scripts disponíveis

| Comando           | Descrição                                                           |
| ----------------- | ------------------------------------------------------------------- |
| `pnpm dev`        | Inicializa o servidor de desenvolvimento com Turbopack.             |
| `pnpm build`      | Gera o build de produção.                                           |
| `pnpm start`      | Executa o build produzido em modo de produção.                      |
| `pnpm lint`       | Roda o ESLint (`--max-warnings 0`).                                 |
| `pnpm lint:fix`   | Aplica correções automáticas do ESLint.                             |
| `pnpm format`     | Formata o repositório com Prettier.                                 |
| `pnpm type-check` | Garante que o TypeScript esteja saudável (sem emissão de arquivos). |
| `pnpm test`       | Executa a suíte de testes com Vitest (modo `--run`).                |
| `pnpm test:watch` | Executa os testes em modo observador.                               |
| `pnpm check`      | Executa `lint`, `type-check` e `test` em sequência.                 |

## Estrutura de pastas

```
├─ docs/                # Materiais de referência (BNCC etc.)
├─ public/              # Assets estáticos
├─ src/
│  ├─ app/              # Rotas App Router (landing page em pt-BR)
│  │  └─ __tests__/     # Exemplos de testes de página
│  ├─ i18n/             # Configurações e mensagens de tradução
│  └─ ...               # Espaço para futuras features
├─ tailwind.config.ts   # Tema base e tokens de design
├─ vitest.config.ts     # Configuração de testes
└─ pnpm-workspace.yaml  # Habilita workspace pnpm
```

## Estilos e design system

- Paleta de cores e animações suaves definidas em `tailwind.config.ts`.
- Classes utilitárias globais e componentes base (botões, badge) em `src/app/globals.css`.
- Fontes acessíveis e amigáveis às crianças (Baloo 2 + Nunito) carregadas via `next/font`.

## Internacionalização

- Locale padrão configurado como `pt-BR` (`next.config.ts`).
- Arquivos de tradução localizados em `src/i18n/messages/` (inclui exemplo em inglês para futuras expansões).
- Provider do `next-intl` ativado no layout global (`src/app/layout.tsx`).
- Funções auxiliares em `src/i18n/get-dictionary.ts` para carregar e tipar mensagens.

## Qualidade de código

- ESLint com regras para Next.js, Testing Library e Vitest.
- Prettier com formatação consistente (80+ colunas, aspas duplas).
- Husky e lint-staged executam lint/format nos arquivos staged antes de cada commit (`pnpm prepare` instala os ganchos após `pnpm install`).

## Testes

A suíte de testes utiliza Vitest + Testing Library com ambiente `jsdom`.

```bash
pnpm test       # roda a suíte completa uma vez
pnpm test:watch # acompanha alterações em modo observador
```

## Contribuição

1. Faça o fork/clone do repositório e crie uma nova branch a partir de `chore/init-aprender-next14-ts-tailwind-i18n-ptbr`.
2. Instale as dependências com `pnpm install`.
3. Desenvolva suas alterações seguindo o padrão de código e traduções centralizadas.
4. Antes de abrir PR, execute `pnpm check` para garantir lint, type-check e testes verdes.
5. Descreva claramente o impacto das mudanças e anexos relevantes (prints, logs, etc.).

## Deploy na Vercel

O passo a passo completo para configurar CI/CD, banco de dados gerenciado e domínios está documentado em [`docs/deployment-vercel.md`](./docs/deployment-vercel.md).

---

**Referências:**

- Documento BNCC disponível em [`docs/BNCC_EI_EF_110518_versaofinal_site.pdf`](./docs/BNCC_EI_EF_110518_versaofinal_site.pdf)
