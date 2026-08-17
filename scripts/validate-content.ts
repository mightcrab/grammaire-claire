import { courseSources, lessons } from "../app/courseData";

const errors: string[] = [];
const ids = new Set<string>();
const sourceKeys = new Set(courseSources.map((source) => source.key));
const levelRank = { Foundation: 0, A1: 1, A2: 2, B1: 3, B2: 4 } as const;

if (lessons.length !== 58) errors.push(`Expected 58 lessons; found ${lessons.length}.`);

for (const [index, lesson] of lessons.entries()) {
  if (ids.has(lesson.id)) errors.push(`Duplicate lesson id: ${lesson.id}`);
  ids.add(lesson.id);
  if (!lesson.title || !lesson.summary || !lesson.objective || !lesson.rule || !lesson.trap) errors.push(`${lesson.id}: missing teaching content.`);
  if (lesson.examples.length < 2) errors.push(`${lesson.id}: fewer than two examples.`);
  if (new Set(lesson.exercise.options).size !== lesson.exercise.options.length) errors.push(`${lesson.id}: duplicate exercise option.`);
  if (!lesson.exercise.options.includes(lesson.exercise.answer)) errors.push(`${lesson.id}: answer is not an option.`);
  if (!lesson.exercise.rationale) errors.push(`${lesson.id}: missing answer rationale.`);
  if (!lesson.sourceKeys.length || !lesson.sourceNote) errors.push(`${lesson.id}: missing source note.`);
  for (const key of lesson.sourceKeys) if (!sourceKeys.has(key)) errors.push(`${lesson.id}: unknown source key ${key}.`);
  for (const prerequisite of lesson.prerequisites) {
    const prerequisiteIndex = lessons.findIndex((item) => item.id === prerequisite);
    if (prerequisiteIndex < 0) errors.push(`${lesson.id}: missing prerequisite ${prerequisite}.`);
    else if (prerequisiteIndex >= index) errors.push(`${lesson.id}: prerequisite ${prerequisite} occurs later in the path.`);
    else if (levelRank[lessons[prerequisiteIndex].level] > levelRank[lesson.level]) errors.push(`${lesson.id}: prerequisite ${prerequisite} has a higher level.`);
  }
}

for (const level of ["Foundation", "A1", "A2", "B1", "B2"] as const) {
  if (!lessons.some((lesson) => lesson.level === level)) errors.push(`No lessons for ${level}.`);
}

const literary = lessons.find((lesson) => lesson.id === "b2-literary-past-recognition");
if (!literary?.recognitionOnly) errors.push("Literary past lesson must remain recognition-only.");

const highRisk = ["a1-11", "a2-03", "a2-06", "b1-past-participle-agreement", "b2-conjunctions-ne-expletif", "b2-pronominal-participle-agreement", "b2-dont-duquel-ce-complements"];
for (const id of highRisk) {
  const lesson = lessons.find((item) => item.id === id);
  if (!lesson) errors.push(`Missing high-risk lesson ${id}.`);
  else if (!lesson.sourceKeys.some((key) => key === "oqlf" || key === "academie")) errors.push(`${id}: high-risk rule lacks a normative source.`);
}

const combinedEnglish = lessons.flatMap((lesson) => [lesson.summary, lesson.objective, lesson.rule, lesson.trap, lesson.exercise.rationale, ...lesson.examples.map((example) => example.en)]).join(" ").toLowerCase();
for (const spelling of ["favourite", "neighbourhood", "travelling", "organise", "recognise", "programme"]) {
  if (combinedEnglish.includes(spelling)) errors.push(`Non-American English spelling found: ${spelling}.`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated ${lessons.length} lessons, ${courseSources.length} sources, and all prerequisite/exercise links.`);
