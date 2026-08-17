import type { CourseSource } from "./courseTypes";

export const courseSources: CourseSource[] = [
  {
    key: "cei",
    name: "Conseil de l’Europe — CECRL, volume complémentaire",
    url: "https://www.coe.int/fr/web/common-european-framework-reference-languages/cefr-companion-volume-and-its-language-versions",
    use: "Official framework for A1–B2 communicative outcomes; it defines abilities, not an exhaustive grammar syllabus.",
  },
  {
    key: "fei",
    name: "France Éducation international — Inventaire linguistique du CECRL",
    url: "https://www.france-education-international.fr/document/cecrl",
    use: "Primary reference for mapping grammar, functions, and discourse by level; its selective inventory still requires context.",
  },
  {
    key: "delf",
    name: "France Éducation international — DELF tout public",
    url: "https://www.france-education-international.fr/diplome/delf-tout-public?langue=fr",
    use: "Official expectations, tasks, and examples used to check that grammar can be mobilized in communication.",
  },
  {
    key: "eduscol",
    name: "Éduscol — La grammaire du français",
    url: "https://eduscol.education.gouv.fr/4809/ressources-d-accompagnement-du-programme-de-francais-aux-cycles-2-et-3-etude-de-la-langue?menu_id=323",
    use: "French Ministry grammar terminology and definitions, restated here in learner-accessible language.",
  },
  {
    key: "academie",
    name: "Académie française — Questions de langue",
    url: "https://www.academie-francaise.fr/questions-de-langue",
    use: "Metropolitan standard, constructions, and usage difficulties; used to verify agreement, mood, articles, prepositions, and register.",
  },
  {
    key: "oqlf",
    name: "OQLF — Banque de dépannage linguistique",
    url: "https://vitrinelinguistique.oqlf.gouv.qc.ca/banque-de-depannage-linguistique",
    use: "Detailed rules and exceptions from a government source; Quebec-specific usage is identified when relevant.",
  },
  {
    key: "tv5",
    name: "TV5MONDE — Apprendre le français",
    url: "https://apprendre.tv5monde.com/fr/aides/grammaire",
    use: "Teaching models, authentic French, and spoken variation; a usage source rather than the sole normative authority.",
  },
];

export const courseMethodology =
  "This course is CEFR-aligned without claiming to be an official syllabus or certification. Its sequence uses the FEI/Eaquals inventory, Council of Europe communicative descriptors, and institutional references for rules, exceptions, register, and variation; concepts are introduced, revisited, and progressively consolidated.";
