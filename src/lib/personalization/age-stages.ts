export type BnccStageConfig = {
  slug: string;
  stage: string;
  label: string;
  minAge: number;
  maxAge: number;
  childSummary: string;
  educatorSummary: string;
  competencies: string[];
  habilidades: string[];
  guidanceNote: string;
};

export const BNCC_STAGE_CONFIG: BnccStageConfig[] = [
  {
    slug: "educacao-infantil",
    stage: "Educação Infantil",
    label: "Exploradores do Faz de Conta",
    minAge: 4,
    maxAge: 5,
    childSummary:
      "Vamos aprender com histórias, músicas e movimentos. Cada atividade é curtinha e cheia de imaginação!",
    educatorSummary:
      "Campos de experiências com foco em oralidade, expressão corporal, musicalidade e convivência. Fortalece autonomia e identidade.",
    competencies: [
      "EI03CG05 - Manifestar curiosidade ao explorar sons, gestos e narrativas.",
      "EI03ET02 - Expressar-se com o corpo em brincadeiras e dramatizações.",
    ],
    habilidades: [
      "Planeje cantigas, jogos simbólicos e atividades sensoriais curtas.",
      "Inclua momentos de acolhimento para compartilhar emoções e conquistas.",
    ],
    guidanceNote:
      "Estudantes pequenos precisam de acompanhamento constante. Convide um familiar para participar das atividades e celebrar cada descoberta.",
  },
  {
    slug: "fundamental-anos-iniciais",
    stage: "Ensino Fundamental - Anos Iniciais",
    label: "Investigadores das Primeiras Descobertas",
    minAge: 6,
    maxAge: 10,
    childSummary:
      "Histórias, desafios de leitura e missões práticas vão ajudar você a ler, escrever e resolver problemas do dia a dia.",
    educatorSummary:
      "Consolidação da alfabetização, resolução de problemas cotidianos, investigação científica introdutória e produção de textos acompanhada.",
    competencies: [
      "EF01LP06 - Ler e compreender textos curtos do cotidiano.",
      "EF02MA05 - Resolver problemas de adição e subtração em diferentes contextos.",
    ],
    habilidades: [
      "Utilize jogos de palavras, leitura compartilhada e produção de bilhetes.",
      "Proponha experimentos simples com registros ilustrados ou tabelas.",
    ],
    guidanceNote:
      "Combine com a criança intervalos, leituras em voz alta e momentos de conversa sobre sentimentos ao aprender coisas novas.",
  },
  {
    slug: "fundamental-anos-finais",
    stage: "Ensino Fundamental - Anos Finais",
    label: "Inventores de Projetos",
    minAge: 11,
    maxAge: 14,
    childSummary:
      "Desafios investigativos, debates e projetos colaborativos para transformar ideias em impacto na comunidade.",
    educatorSummary:
      "Ampliação de repertório científico, pensamento crítico, produção de textos multimodais e protagonismo juvenil em projetos investigativos.",
    competencies: [
      "EF07CI02 - Investigar transformações em fenômenos naturais e sociais.",
      "EF69LP32 - Produzir textos multimodais para participar de debates e projetos.",
    ],
    habilidades: [
      "Planeje etapas de pesquisa com uso de fontes confiáveis e registros em diferentes formatos.",
      "Estimule argumentação e colaboração em atividades avaliativas diversificadas.",
    ],
    guidanceNote:
      "Ofereça roteiros com metas semanais e espaços de registro das ideias. Dialogue sobre segurança digital e convivência colaborativa.",
  },
  {
    slug: "ensino-medio",
    stage: "Ensino Médio",
    label: "Visionários de Impacto",
    minAge: 15,
    maxAge: 17,
    childSummary:
      "Projetos autorais, trilhas de aprofundamento e simulações para planejar o futuro com propósito.",
    educatorSummary:
      "Foco em itinerários formativos, resolução de problemas complexos, cultura digital, protagonismo e preparação para escolhas de vida acadêmica e profissional.",
    competencies: [
      "EM13MAT305 - Resolver problemas envolvendo dados e probabilidades na tomada de decisão.",
      "EM13CHS602 - Investigar questões socioambientais com múltiplas fontes e perspectivas.",
    ],
    habilidades: [
      "Estimule projetos interdisciplinares com tecnologia, prototipagem e comunicação pública.",
      "Proponha momentos de autoavaliação e definição de metas para o projeto de vida.",
    ],
    guidanceNote:
      "Negocie metas com o estudante, registre compromissos e incentive contato com mentores ou redes de apoio para orientar escolhas futuras.",
  },
];

export const LEARNING_STYLE_OPTIONS = [
  {
    id: "visual",
    title: "Visual e criativo",
    description: "Prefere mapas mentais, vídeos curtos, infográficos e desenho para aprender.",
  },
  {
    id: "auditivo",
    title: "Auditivo e musical",
    description: "Gosta de ouvir histórias, podcasts, ritmos e repetir conceitos em voz alta.",
  },
  {
    id: "cinestesico",
    title: "Mão na massa",
    description: "Aprende melhor construindo, experimentando e colocando o corpo em movimento.",
  },
  {
    id: "colaborativo",
    title: "Em equipe",
    description: "Se envolve mais quando aprende com colegas, debates e missões cooperativas.",
  },
  {
    id: "digital",
    title: "Explorador digital",
    description: "Gosta de simuladores, jogos e ferramentas interativas para testar ideias.",
  },
] as const;
