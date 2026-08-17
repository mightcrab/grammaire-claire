import { foundationA1A2Lessons } from "./courseDataA";
import { b1B2Lessons } from "./courseDataB";
import { courseMethodology, courseSources } from "./courseSources";
import type { Lesson, Level } from "./courseTypes";

export type { Lesson, Level } from "./courseTypes";
export { courseMethodology, courseSources };

export const lessons: Lesson[] = [...foundationA1A2Lessons, ...b1B2Lessons];

export const levelMeta: Record<Level, { short: string; title: string; description: string }> = {
  Foundation: {
    short: "How French works",
    title: "See the machinery of a French sentence",
    description: "Learn the few grammatical ideas that make every later rule easier: subject, finite verb, infinitive, gender, number, and agreement.",
  },
  A1: {
    short: "Build clear sentences",
    title: "Build correct, useful simple sentences",
    description: "Identify, describe, ask, negate, locate, quantify, give instructions, and talk about routines, immediate plans, and completed events.",
  },
  A2: {
    short: "Connect your ideas",
    title: "Control time, reference, and connected ideas",
    description: "Narrate ordinary past events, contrast background with events, replace repeated nouns, compare, and link clauses accurately.",
  },
  B1: {
    short: "Explain and narrate",
    title: "Narrate, explain, report, and hypothesize",
    description: "Manage viewpoint across a story, express advice and imagined situations, report speech, and build coherent complex sentences.",
  },
  B2: {
    short: "Express real nuance",
    title: "Control complex syntax and register",
    description: "Argue precisely, report viewpoints, express counterfactuals, choose moods by meaning, and shift between conversational and formal French.",
  },
};
