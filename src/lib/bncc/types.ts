export type BnccHabilidade = {
  codigo: string;
  descricao: string;
};

export type BnccReferencia = {
  documento: string;
  secao?: string;
  paginaInicial?: number;
  paginaFinal?: number;
};

export type BnccStandard = {
  bnccCode: string;
  ageGroupSlug: string;
  etapa: string;
  componenteCurricular: string;
  unidadeTematica: string;
  objetoConhecimento: string[];
  competency: string;
  habilidades: BnccHabilidade[];
  descricao?: string;
  referencias?: BnccReferencia[];
};

export type BnccDataset = {
  generatedAt: string;
  source: string;
  standards: BnccStandard[];
};
