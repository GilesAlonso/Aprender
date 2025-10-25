# Fluxo de alinhamento BNCC

Este guia descreve como o repositório organiza, valida e publica conteúdos alinhados à Base Nacional Comum Curricular (BNCC). O processo foi desenhado para ser reproduzível por equipes pedagógicas e de produto, permitindo manter o acervo consistente à medida que novos padrões são adicionados.

## 1. Fontes e referências consultadas

Os códigos e descrições foram extraídos manualmente do arquivo oficial da BNCC disponível em `docs/BNCC_EI_EF_110518_versaofinal_site.pdf`. A tabela a seguir registra os trechos utilizados durante a curadoria inicial:

| Código BNCC   | Componente / Etapa                                       | Páginas de referência |
| ------------- | -------------------------------------------------------- | --------------------- |
| EI03ET04      | Campos de experiência – Traços, Sons, Cores e Formas     | 45–47                 |
| EF01LP06      | Língua Portuguesa – Leitura/escuta (Anos Iniciais)       | 93–95                 |
| EF35LP20      | Língua Portuguesa – Produção de textos (3º ao 5º ano)    | 118–121               |
| EF05MA08      | Matemática – Números (Anos Iniciais)                     | 282–284               |
| EF07MA16      | Matemática – Probabilidade e Estatística (Anos Finais)   | 307–309               |
| EF69LP28      | Língua Portuguesa – Práticas de linguagem (Anos Finais)  | 160–163               |
| EF07CI02      | Ciências – Terra e Universo (Anos Finais)                | 343–345               |
| EM13MAT305    | Matemática e suas Tecnologias – Itinerários formativos   | 526–529               |

> **Nota:** O PDF disponibiliza texto em fluxos comprimidos, o que inviabiliza a extração automática direta. A curadoria envolveu leitura pontual das seções listadas e transcrição fiel dos trechos relevantes.

## 2. Estrutura dos dados

- `data/bncc/standards.json`: catálogo estruturado de competências BNCC. Cada item contém código, componente curricular, unidade temática, objetos de conhecimento, habilidades relacionadas e bibliografia (páginas consultadas).
- `data/content/modules.json`: definição pedagógica de módulos e atividades. Inclui faixa etária (ageGroupSlug), código BNCC primário, resultados de aprendizagem (`learningOutcomes`) e objetivos específicos por atividade.
- `prisma/seed.ts`: orquestra a leitura dos arquivos acima e popula o banco usando o cliente Prisma. Qualquer alteração nos arquivos JSON é refletida quando o script de seed é executado novamente.

## 3. Processo de mapeamento

1. **Selecionar foco pedagógico** – definir disciplina, faixa etária e resultados desejados.
2. **Consultar a BNCC** – localizar o código e o trecho correspondente no PDF, registrando página inicial e final.
3. **Cadastrar o padrão** – adicionar uma entrada em `data/bncc/standards.json`, preenchendo `componenteCurricular`, `unidadeTematica`, `objetoConhecimento`, `habilidades` e `referencias`.
4. **Planejar o módulo** – descrever o módulo em `data/content/modules.json`, informando `primaryBnccCode`, `learningOutcomes` e as atividades vinculadas.
5. **Detalhar atividades** – para cada atividade, definir `learningObjectives`, `bnccCode` (pode coincidir com o primário ou trazer habilidades complementares), além de metadados operacionais (tempo estimado, materiais, etc.).
6. **Executar a validação** – garantir que os códigos inseridos existem para a faixa etária correta e que objetivos de aprendizagem foram declarados.

## 4. Validação automatizada

Um script TypeScript verifica consistência entre padrões BNCC e conteúdo:

```bash
pnpm bncc:validate
```

A rotina sinaliza:
- códigos ausentes da base BNCC segundo a faixa etária informada;
- módulos sem resultados de aprendizagem;
- atividades sem objetivos de aprendizagem ou com códigos inválidos;
- duplicidade de slugs de módulos/atividades.

Somente após a validação passar sem erros é recomendável executar o seed ou abrir PR.

## 5. Seed e sincronização com o banco

O comando abaixo aplica os dados no banco SQLite local:

```bash
pnpm db:seed
```

O seed executa as etapas:
1. Limpa registros antigos para evitar resíduos.
2. Cadastra faixas etárias a partir de `BNCC_STAGE_CONFIG`.
3. Insere trilhas de aprendizagem (`learningPathsData`).
4. Persiste padrões BNCC conforme `standards.json`, armazenando objetos de conhecimento e referências em campos JSON.
5. Cria módulos e atividades com base em `modules.json`, vinculando cada item ao código BNCC correspondente.
6. Populariza usuários de demonstração, progresso, tentativas e recompensas.

## 6. Conteúdos exemplo disponíveis

- **Matemática**
  - *Rota das Operações* (Fundamental Anos Iniciais – EF05MA08)
  - *Oficina Modelagem de Dados* (Fundamental Anos Finais – EF07MA16)
  - *Estúdio de Dados Solidários* (Ensino Médio – EM13MAT305)
- **Língua Portuguesa**
  - *Clubinho das Palavras* (Fundamental Anos Iniciais – EF01LP06 / EF35LP20)
  - *Trilhas Narrativas Digitais* (Fundamental Anos Finais – EF69LP28)
- **Educação Infantil**
  - *Histórias em Movimento* (EI03ET04)
- **Ciências da Natureza**
  - *Laboratório da Natureza* (EF07CI02)

Cada módulo possui descrições, resultados esperados e atividades com objetivos específicos e badges BNCC expostos na API/UX.

## 7. Como estender o catálogo

1. Acrescente novos padrões em `data/bncc/standards.json`, mantendo a estrutura existente e citando as páginas consultadas.
2. Crie (ou atualize) módulos em `data/content/modules.json`, apontando o `primaryBnccCode` e relacionando as atividades.
3. Rode `pnpm bncc:validate` para garantir integridade.
4. Execute `pnpm db:seed` para atualizar o banco local ou aguarde a pipeline executar o seed em ambientes gerenciados.
5. Ao abrir PR, inclua no resumo as novas páginas/trechos da BNCC utilizados.

## 8. Padrões de nomenclatura e organização

- Usar `kebab-case` para slugs (`rota-das-operacoes`).
- `ageGroupSlug` deve corresponder a um item da configuração BNCC (`educacao-infantil`, `fundamental-anos-iniciais`, etc.).
- Objetivos de aprendizagem são textos curtos e avaliáveis, iniciados por verbo no infinitivo.
- Metadados extras das atividades permanecem em português claro para facilitar uso pedagógico.

---

Seguindo este fluxo, a equipe mantém um registro auditável da origem de cada competência e garante que os conteúdos publicados tragam objetivos, códigos e descrições alinhados à BNCC.
