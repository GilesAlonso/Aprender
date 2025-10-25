# Guia de deploy na Vercel (pt-BR)

## Visão geral

Este documento descreve o processo completo para colocar o Aprender em produção utilizando a plataforma Vercel. O fluxo cobre:

1. Vincular o repositório GitHub ao projeto na Vercel.
2. Configurar as variáveis de ambiente exigidas pela aplicação.
3. Provisionar um banco de dados PostgreSQL gerenciado (Vercel Postgres recomendado).
4. Aplicar migrações e popular os dados pedagógicos (BNCC) com o Prisma.
5. Configurar domínios, monitoramento e logs.
6. Solucionar problemas comuns de build e banco de dados.

> ⚠️ **Importante**: mantenha o arquivo `.env.example` atualizado com os valores mínimos necessários. Utilize-o como referência ao configurar os ambientes `Development`, `Preview` e `Production` na Vercel.

---

## Pré-requisitos

- Conta ativa na [Vercel](https://vercel.com/signup) com acesso ao time/projeto que hospedará o Aprender.
- Repositório GitHub com permissão de leitura (idealmente escrita) para a conta Vercel.
- Node.js 20+, pnpm 8+ instalados localmente caso deseje executar comandos via CLI.
- Uma instância de banco de dados PostgreSQL acessível pela Vercel (Postgres gerenciado, Supabase, Neon ou PlanetScale\*).
- Conhecimento básico em Prisma (`prisma migrate`, `prisma db seed`).

\* PlanetScale utiliza MySQL; caso opte por ele, será necessário ajustar `schema.prisma` para `provider = "mysql"` antes de gerar as migrações destinadas ao ambiente de produção.

---

## 1. Vínculo do repositório com a Vercel

1. Acesse o [dashboard da Vercel](https://vercel.com/dashboard) e clique em **Import Project**.
2. Escolha **Continue with GitHub** e autorize o acesso ao repositório `aprender` (ou ao fork correspondente).
3. Selecione a branch principal (`main`/`master`) como origem e confirme o diretório raiz do projeto (mantém `/`).
4. A Vercel detectará automaticamente o framework **Next.js**.
5. Não altere o comando de build sugerido ainda; o `vercel.json` presente no repositório cuidará da execução correta.
6. Confirme a criação do projeto. A primeira implantação ficará aguardando as variáveis de ambiente para finalizar com sucesso.

---

## 2. Variáveis de ambiente obrigatórias

Utilize o arquivo `.env.example` como referência. As variáveis mínimas necessárias são:

| Variável       | Descrição                                                                                 | Ambiente Vercel      | Exemplo de valor                                                           |
| -------------- | ----------------------------------------------------------------------------------------- | -------------------- | -------------------------------------------------------------------------- |
| `NODE_ENV`     | Define o modo de execução. A Vercel define como `production` automaticamente em produção. | Preview / Production | `production`                                                               |
| `DATABASE_URL` | String de conexão utilizada pela aplicação (via Prisma Client).                           | Preview / Production | `postgresql://user:pass@host:5432/aprender?pgbouncer=true&sslmode=require` |
| `DIRECT_URL`   | Conexão direta **sem pool** para executar migrações com `prisma migrate deploy`.          | Preview / Production | `postgresql://user:pass@host:5432/aprender?sslmode=require`                |

### Como registrar as variáveis na Vercel

- **Via Dashboard**: acesse o projeto → **Settings > Environment Variables** → adicione cada chave para `Production` e `Preview`.
- **Via CLI**:

  ```bash
  vercel login
  vercel link               # associa o diretório local ao projeto na Vercel
  vercel env add database-url production
  vercel env add database-url preview
  vercel env add direct-url production
  vercel env add direct-url preview
  vercel env add NODE_ENV production
  vercel env add NODE_ENV preview
  ```

  Ao rodar `vercel env add`, será solicitado o valor correspondente; cole a string de conexão fornecida pelo provedor do banco.

- Para sincronizar localmente, execute `vercel env pull .env.production.local`. O arquivo gerado pode ser utilizado para conectar-se ao banco remoto ao rodar migrações ou seeds.

> 💡 Se utilizar ambientes diferentes para QA ou staging, repita o processo para as variáveis de `Preview`.

---

## 3. Configuração do banco de dados em produção

### 3.1 Vercel Postgres (recomendado)

1. No dashboard da Vercel, acesse **Storage > Create Database > Postgres**.
2. Escolha o projeto Aprender e selecione a região mais próxima do público-alvo.
3. Após criar o banco, copie os seguintes valores:
   - `POSTGRES_URL` → atribua à secret `database-url`.
   - `POSTGRES_URL_NON_POOLING` → atribua à secret `direct-url`.
4. Repita o processo para os ambientes `Preview` (se desejar instâncias isoladas) ou reutilize o mesmo banco com cuidado.
5. Garanta que o usuário tenha permissões de criação de tabelas (default na Vercel Postgres).

### 3.2 Alternativas (Supabase, Neon, PlanetScale)

- **Supabase / Neon (Postgres)**:
  1. Crie o projeto e habilite SSL.
  2. Copie a conexão padrão para `DATABASE_URL` e a conexão direta (sem pool) para `DIRECT_URL`.
  3. Libere o IP de saída da Vercel se a plataforma exigir allow-list.

- **PlanetScale (MySQL)**:
  1. Ajuste `provider` e dialeto em `prisma/schema.prisma` para `mysql` antes de gerar migrações específicas.
  2. Gere novas migrações (`pnpm prisma migrate dev`) e valide em um branch dedicado antes de enviar para produção.
  3. Configure `DATABASE_URL` e `DIRECT_URL` utilizando as strings fornecidas pelo PlanetScale.

> ✅ Para ambientes de desenvolvimento local, continue utilizando SQLite (`file:./prisma/dev.db`). A estratégia híbrida (SQLite local + Postgres remoto) é suportada pelo Prisma.

---

## 4. Migrações com `prisma migrate deploy`

- O arquivo `vercel.json` define o comando de build como `pnpm prisma migrate deploy && pnpm run build`. Assim, todas as migrações presentes em `prisma/migrations` são aplicadas automaticamente antes do build do Next.js.
- Durante o build, a configuração injeta `DIRECT_URL` como `DATABASE_URL` para garantir que as migrações usem a conexão **sem pool** (evitando limitações do PgBouncer).
- Certifique-se de que qualquer nova migração esteja versionada no repositório antes de fazer push para `main`.

### Execução manual (primeira vez ou manutenção)

1. Puxe as variáveis de ambiente remotas:

   ```bash
   vercel env pull .env.production.local
   source .env.production.local
   ```

2. Execute as migrações contra o banco remoto:

   ```bash
   pnpm prisma migrate deploy
   ```

3. Caso precise aplicar uma migração específica, utilize `pnpm prisma migrate resolve --applied <nome_da_migracao>` antes de `migrate deploy`.

> 💬 Erros comuns (ex.: `P3006` – "Migração já aplicada" ou divergências em checksum) indicam que o banco pode ter sido alterado manualmente. Utilize `prisma migrate diff` para inspecionar diferenças.

---

## 5. Popular dados BNCC em produção (`prisma db seed`)

A seed oficial (`prisma/seed.ts`) cria faixas etárias, trilhas, atividades, recompensas e progresso de exemplo.

1. Garanta que `DATABASE_URL` (ou `DIRECT_URL`) aponta para o banco de produção.
2. Execute a seed localmente uma única vez após as migrações:

   ```bash
   vercel env pull .env.production.local
   source .env.production.local
   pnpm prisma db seed
   ```

3. Verifique os registros através do Prisma Studio (`pnpm prisma studio`) ou conecte-se via ferramenta SQL de sua preferência.

> ⚠️ Evite rodar a seed no processo de build da Vercel para não alongar a pipeline. Realize-a manualmente quando necessário (ex.: ambiente limpo ou dados resetados).

---

## 6. Deploy inicial e atualizações contínuas

1. Após configurar variáveis e banco, faça um push para a branch monitorada (`main`).
2. A Vercel iniciará o build automático:
   - `pnpm install --frozen-lockfile`
   - `pnpm prisma migrate deploy`
   - `pnpm prisma generate && next build`
3. Quando o build finalizar, valide a aplicação utilizando a URL provisória (`https://aprender.vercel.app` ou equivalente).
4. Novos commits/pull requests gerarão **Deploy Previews**; ao aprovar e mesclar em `main`, a Vercel promoverá automaticamente o deploy para produção.

---

## 7. Configuração de domínios

1. No dashboard da Vercel, abra o projeto → **Settings > Domains**.
2. Adicione o domínio customizado (ex.: `aprender.escola.br`).
3. Atualize a zona DNS no provedor com um registro `CNAME` apontando para o subdomínio da Vercel (`cname.vercel-dns.com`).
4. Aguarde a propagação (até 48h). A Vercel provisionará automaticamente o certificado TLS.
5. Caso utilize subdomínios (ex.: `app.aprender.escola.br`), repita o processo para cada entrada.

---

## 8. Monitoramento, métricas e logs

- **Logs em tempo real**: `vercel logs aprender --prod` ou via dashboard em **Observability > Functions**.
- **Alertas**: configure integrações com Slack/Email na seção **Notifications** para receber falhas de build ou erros 5xx.
- **Métricas de performance**: utilize o painel **Speed Insights** da Vercel e ativações opcionais como Web Analytics.
- **Prisma**: habilite logs adicionais definindo `PRISMA_LOG_LEVEL=info` caso queira inspeções temporárias (não se esqueça de remover após o diagnóstico).

---

## 9. Fluxo pós-deploy e boas práticas

- Antes de enviar um PR com novas migrações, execute `pnpm prisma migrate dev` localmente para validar o schema.
- Utilize `pnpm check` (lint + type-check + testes) antes do merge.
- Ao atualizar seeds ou dados base, documente o passo adicional na descrição do PR para garantir que o time execute `pnpm prisma db seed` em produção quando apropriado.
- Mantenha o `.vercelignore` sincronizado para evitar upload de arquivos pesados (PDFs da BNCC, storybooks estáticos, etc.).

---

## Troubleshooting (Problemas comuns)

| Sintoma                                                               | Possível causa                                                 | Como resolver                                                                                                           |
| --------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `P1001: Can't reach database server`                                  | Variáveis incorretas ou IP bloqueado                           | Revise `DATABASE_URL`, confirme SSL obrigatório no provedor e libere o IP da Vercel (quando aplicável).                 |
| `P3006` ou `The migration ... failed to apply cleanly`                | Divergência entre o estado do banco e as migrações versionadas | Execute `pnpm prisma migrate resolve --applied/--rolled-back` conforme o caso e rode `pnpm prisma migrate deploy`.      |
| Build falha com `Error: Pnpx prisma generate` ou client ausente       | Prisma Client não gerado antes do build                        | Verifique o log de `postinstall`/`build`. O `package.json` já executa `prisma generate`; revise se houve erro anterior. |
| Build falha informando `Environment variable not found: DATABASE_URL` | Secret não configurada na Vercel                               | Cadastre `database-url` e `direct-url` para todos os ambientes necessários; rode um novo deploy após salvar.            |
| Seed (`pnpm prisma db seed`) trava ou estoura limite de conexões      | Uso de conexão via pool (PgBouncer)                            | Aponte `DIRECT_URL` para a string sem pool e exporte-a antes de rodar o seed: `export DATABASE_URL="$DIRECT_URL"`.      |
| Deploy demora devido ao upload de assets grandes (ex.: PDF da BNCC)   | Arquivos pesados enviados no bundle                            | Confirme que `.vercelignore` contém `docs/` e arquivos auxiliares fora do build necessário.                             |

---

## Recursos adicionais

- [Documentação oficial da Vercel sobre Postgres](https://vercel.com/docs/storage/vercel-postgres/quickstart)
- [Guia do Prisma para deploy no Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Referência do comando `vercel env`](https://vercel.com/docs/cli/env)

Com os passos acima, o Aprender estará pronto para um fluxo de CI/CD contínuo na Vercel, com banco de dados gerenciado, migrações automatizadas e dados pedagógicos consistentes em produção.
