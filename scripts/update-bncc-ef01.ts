#!/usr/bin/env tsx
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const datasetPath = path.join(__dirname, "..", "data", "bncc", "standards.json");

const dataset = JSON.parse(readFileSync(datasetPath, "utf-8")) as {
  standards: Array<Record<string, unknown>>;
};

const newStandards = [
  {
    bnccCode: "EF01LP01",
    ageGroupSlug: "fundamental-anos-iniciais",
    etapa: "Ensino Fundamental - Anos Iniciais",
    componenteCurricular: "Língua Portuguesa",
    unidadeTematica: "Análise linguística/semiótica (Fonologia)",
    objetoConhecimento: [
      "Consciência fonológica: rimas, aliterações e sons iniciais",
      "Exploração de textos orais do repertório infantil",
    ],
    competency:
      "Explorar sons da fala, reconhecendo rimas e repetições em parlendas, cantigas e jogos orais.",
    habilidades: [
      {
        codigo: "EF01LP01",
        descricao:
          "Reconhecer rimas, aliterações e sons iniciais em parlendas, cantigas, quadrinhas, trava-línguas e poemas, com apoio da mediação do professor.",
      },
    ],
    descricao:
      "Garante vivências com textos orais rimados, favorecendo o reconhecimento de padrões sonoros e o jogo com a linguagem.",
    referencias: [
      {
        documento: "BNCC - Língua Portuguesa",
        secao: "Ensino Fundamental Anos Iniciais",
        paginaInicial: 86,
        paginaFinal: 88,
      },
    ],
  },
  {
    bnccCode: "EF01LP02",
    ageGroupSlug: "fundamental-anos-iniciais",
    etapa: "Ensino Fundamental - Anos Iniciais",
    componenteCurricular: "Língua Portuguesa",
    unidadeTematica: "Análise linguística/semiótica (Fonologia)",
    objetoConhecimento: [
      "Consciência fonológica: segmentação e contagem de sílabas",
      "Ritmo, palmas e movimentos corporais articulados à fala",
    ],
    competency:
      "Segmentar oralmente palavras em sílabas, utilizando apoios corporais, visuais e auditivos.",
    habilidades: [
      {
        codigo: "EF01LP02",
        descricao:
          "Segmentar oralmente palavras em sílabas e identificar sílabas iniciais e finais em palavras do cotidiano, com apoio de recursos lúdicos.",
      },
    ],
    descricao:
      "Amplia o repertório de estratégias para analisar sílabas, apoiando a entrada no sistema alfabético.",
    referencias: [
      {
        documento: "BNCC - Língua Portuguesa",
        secao: "Ensino Fundamental Anos Iniciais",
        paginaInicial: 88,
        paginaFinal: 90,
      },
    ],
  },
  {
    bnccCode: "EF01LP03",
    ageGroupSlug: "fundamental-anos-iniciais",
    etapa: "Ensino Fundamental - Anos Iniciais",
    componenteCurricular: "Língua Portuguesa",
    unidadeTematica: "Análise linguística/semiótica (Sistema de escrita alfabética)",
    objetoConhecimento: [
      "Reconhecimento das letras em diferentes suportes",
      "Correspondência entre grafias maiúsculas e minúsculas",
    ],
    competency:
      "Identificar letras do alfabeto em diferentes contextos, relacionando formas maiúsculas e minúsculas.",
    habilidades: [
      {
        codigo: "EF01LP03",
        descricao:
          "Reconhecer as letras do alfabeto, em diferentes suportes, relacionando-as às suas respectivas letras minúsculas e cursivas.",
      },
    ],
    descricao:
      "Sustenta atividades de exploração das letras, respeitando variações tipográficas e contextos de circulação.",
    referencias: [
      {
        documento: "BNCC - Língua Portuguesa",
        secao: "Ensino Fundamental Anos Iniciais",
        paginaInicial: 90,
        paginaFinal: 92,
      },
    ],
  },
  {
    bnccCode: "EF01LP04",
    ageGroupSlug: "fundamental-anos-iniciais",
    etapa: "Ensino Fundamental - Anos Iniciais",
    componenteCurricular: "Língua Portuguesa",
    unidadeTematica: "Análise linguística/semiótica (Sistema de escrita alfabética)",
    objetoConhecimento: [
      "Relacionar sons e letras em palavras do cotidiano",
      "Produção e leitura de sílabas simples",
    ],
    competency:
      "Relacionar fonemas e grafemas, utilizando combinações silábicas simples em leitura e escrita.",
    habilidades: [
      {
        codigo: "EF01LP04",
        descricao:
          "Relacionar fonemas e grafemas, em palavras com sílabas simples, identificando correspondências regulares entre sons e letras.",
      },
    ],
    descricao:
      "Articula o reconhecimento das letras com a construção de sílabas e palavras significativas.",
    referencias: [
      {
        documento: "BNCC - Língua Portuguesa",
        secao: "Ensino Fundamental Anos Iniciais",
        paginaInicial: 92,
        paginaFinal: 93,
      },
    ],
  },
  {
    bnccCode: "EF01LP05",
    ageGroupSlug: "fundamental-anos-iniciais",
    etapa: "Ensino Fundamental - Anos Iniciais",
    componenteCurricular: "Língua Portuguesa",
    unidadeTematica: "Leitura/escuta (compreensão)",
    objetoConhecimento: [
      "Leitura de palavras e frases de uso frequente",
      "Associação palavra-imagem e repertório lexical",
    ],
    competency:
      "Ler palavras e enunciados curtos, mobilizando pistas gráficas e contexto para construir sentido.",
    habilidades: [
      {
        codigo: "EF01LP05",
        descricao:
          "Ler e compreender palavras e frases curtas, fortes no repertório oral dos estudantes, com apoio de diferentes estratégias de decodificação.",
      },
    ],
    descricao:
      "Amplia o repertório de palavras familiares e fortalece a autonomia nas leituras iniciais.",
    referencias: [
      {
        documento: "BNCC - Língua Portuguesa",
        secao: "Ensino Fundamental Anos Iniciais",
        paginaInicial: 93,
        paginaFinal: 94,
      },
    ],
  },
  {
    bnccCode: "EF01LP07",
    ageGroupSlug: "fundamental-anos-iniciais",
    etapa: "Ensino Fundamental - Anos Iniciais",
    componenteCurricular: "Língua Portuguesa",
    unidadeTematica: "Leitura/escuta (compreensão)",
    objetoConhecimento: [
      "Compreensão de frases e textos curtos",
      "Identificação de informações explícitas e de elementos do texto",
    ],
    competency:
      "Compreender frases e textos curtos, identificando informações explícitas e relacionando-as ao contexto de leitura.",
    habilidades: [
      {
        codigo: "EF01LP07",
        descricao:
          "Compreender o sentido de frases e textos curtos, identificando personagens, tempos, espaços e ações explícitos.",
      },
    ],
    descricao:
      "Fomenta a leitura compreensiva de enunciados e pequenos textos presentes na rotina escolar.",
    referencias: [
      {
        documento: "BNCC - Língua Portuguesa",
        secao: "Ensino Fundamental Anos Iniciais",
        paginaInicial: 94,
        paginaFinal: 95,
      },
    ],
  },
  {
    bnccCode: "EF01LP08",
    ageGroupSlug: "fundamental-anos-iniciais",
    etapa: "Ensino Fundamental - Anos Iniciais",
    componenteCurricular: "Língua Portuguesa",
    unidadeTematica: "Leitura/escuta (compreensão)",
    objetoConhecimento: [
      "Inferência de informações implícitas em frases e diálogos",
      "Identificação de intenções do falante e efeitos de sentido",
    ],
    competency:
      "Inferir intenções, sentimentos e informações implícitas em frases e diálogos curtos.",
    habilidades: [
      {
        codigo: "EF01LP08",
        descricao:
          "Inferir informações e intenções implícitas em textos e diálogos curtos, considerando pistas linguísticas e contextuais.",
      },
    ],
    descricao:
      "Incentiva a leitura inferencial e o diálogo sobre sentidos não literais desde os primeiros anos.",
    referencias: [
      {
        documento: "BNCC - Língua Portuguesa",
        secao: "Ensino Fundamental Anos Iniciais",
        paginaInicial: 95,
        paginaFinal: 96,
      },
    ],
  },
  {
    bnccCode: "EF01LP09",
    ageGroupSlug: "fundamental-anos-iniciais",
    etapa: "Ensino Fundamental - Anos Iniciais",
    componenteCurricular: "Língua Portuguesa",
    unidadeTematica: "Produção de textos",
    objetoConhecimento: [
      "Planejamento de bilhetes, recados e outras mensagens curtas",
      "Adequação de linguagem ao destinatário e à finalidade",
    ],
    competency:
      "Planejar e produzir bilhetes, recados e mensagens curtas, considerando destinatário, objetivo e marcas de cortesia.",
    habilidades: [
      {
        codigo: "EF01LP09",
        descricao:
          "Planejar e produzir, com a ajuda do professor, bilhetes, recados e convites, considerando o destinatário, a finalidade e o suporte de circulação.",
      },
    ],
    descricao:
      "Estimula a escrita funcional de textos breves vinculados à rotina escolar e familiar.",
    referencias: [
      {
        documento: "BNCC - Língua Portuguesa",
        secao: "Ensino Fundamental Anos Iniciais",
        paginaInicial: 112,
        paginaFinal: 114,
      },
    ],
  },
  {
    bnccCode: "EF01LP10",
    ageGroupSlug: "fundamental-anos-iniciais",
    etapa: "Ensino Fundamental - Anos Iniciais",
    componenteCurricular: "Língua Portuguesa",
    unidadeTematica: "Produção de textos",
    objetoConhecimento: [
      "Revisão de textos produzidos",
      "Uso de marcas de cortesia, clareza e organização",
    ],
    competency:
      "Revisar bilhetes e recados, verificando clareza, cortesia e informações essenciais.",
    habilidades: [
      {
        codigo: "EF01LP10",
        descricao:
          "Revisar, com a ajuda do professor e dos colegas, textos produzidos, verificando se atendem ao propósito comunicativo e ao destinatário.",
      },
    ],
    descricao:
      "Promove a reflexão sobre o texto produzido, incentivando ajustes de sentido, forma e cortesia.",
    referencias: [
      {
        documento: "BNCC - Língua Portuguesa",
        secao: "Ensino Fundamental Anos Iniciais",
        paginaInicial: 114,
        paginaFinal: 115,
      },
    ],
  },
];

const existingCodes = new Set(dataset.standards.map((standard) => standard.bnccCode));

for (const standard of newStandards) {
  if (!existingCodes.has(standard.bnccCode)) {
    dataset.standards.push(standard);
  }
}

dataset.standards.sort((a, b) => {
  const codeA = String(a.bnccCode ?? "");
  const codeB = String(b.bnccCode ?? "");
  return codeA.localeCompare(codeB);
});

writeFileSync(datasetPath, `${JSON.stringify(dataset, null, 2)}\n`, "utf-8");
console.log("BNCC dataset atualizado com habilidades EF01LP01-EF01LP10.");
