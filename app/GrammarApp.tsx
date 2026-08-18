"use client";

import { ChangeEvent, RefObject, useEffect, useMemo, useRef, useState } from "react";
import { courseMethodology, courseSources, lessons, levelMeta } from "./courseData";
import type { Lesson, Level } from "./courseTypes";
import { parseProgressPayload, type Progress, type RecordState } from "./progressData";
import { syncStatusLabel, useProgressSync, type ProgressConflict, type SyncStatus } from "./useProgressSync";

type View = "today" | "learn" | "practice" | "reference" | "progress" | "quality";

const levels: Level[] = ["Foundation", "A1", "A2", "B1", "B2"];
const intervals = [1, 3, 7, 14, 30, 60, 90];

function scrollToTop() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
}

function futureDate(days: number) {
  const result = new Date();
  result.setDate(result.getDate() + days);
  return result.toISOString();
}

function lessonStatus(record?: RecordState) {
  if (!record) return "Not started";
  if (record.nextReview && new Date(record.nextReview) <= new Date()) return "Review due";
  if (record.strength >= 3) return "Stable";
  return record.completed ? "Learning" : "Practicing";
}

function percentFor(level: Level, progress: Progress) {
  const group = lessons.filter((lesson) => lesson.level === level);
  return Math.round((group.filter((lesson) => progress[lesson.id]?.completed).length / group.length) * 100) || 0;
}

export function GrammarApp() {
  const [view, setView] = useState<View>("today");
  const [level, setLevel] = useState<Level>("Foundation");
  const [lessonId, setLessonId] = useState<string | null>(null);
  const {
    progress,
    status: syncStatus,
    conflict: progressConflict,
    updateProgress,
    replaceProgress,
    retrySync,
    adoptSyncedCopy,
    keepDeviceCopy,
  } = useProgressSync();
  const [now, setNow] = useState(0);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setNow(Date.now()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const dueTimes = Object.values(progress).map((item) => item.nextReview ? Date.parse(item.nextReview) : Number.POSITIVE_INFINITY).filter((time) => time > Date.now());
    const nextMidnight = new Date();
    nextMidnight.setHours(24, 0, 0, 100);
    const nextRefresh = Math.min(nextMidnight.getTime(), dueTimes.length ? Math.min(...dueTimes) + 100 : Number.POSITIVE_INFINITY);
    const delay = Math.min(Math.max(1000, nextRefresh - Date.now()), 2_147_000_000);
    const timer = window.setTimeout(refresh, delay);
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearTimeout(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", onVisible); };
  }, [progress, now]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setView("reference");
        setLessonId(null);
        scrollToTop();
        setTimeout(() => searchRef.current?.focus(), 20);
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);

  const selected = lessons.find((lesson) => lesson.id === lessonId) ?? null;
  const completed = lessons.filter((lesson) => progress[lesson.id]?.completed).length;
  const stable = lessons.filter((lesson) => {
    const record = progress[lesson.id];
    return (record?.strength ?? 0) >= 3 && (!record?.nextReview || Date.parse(record.nextReview) > now);
  }).length;
  const due = lessons.filter((lesson) => now > 0 && progress[lesson.id]?.nextReview && Date.parse(progress[lesson.id].nextReview!) <= now);
  const next = lessons.find((lesson) => !progress[lesson.id]?.completed) ?? lessons[0];

  function changeView(nextView: View) {
    setView(nextView);
    setLessonId(null);
    scrollToTop();
  }

  function openLesson(lesson: Lesson) {
    setView("learn");
    setLevel(lesson.level);
    setLessonId(lesson.id);
    scrollToTop();
  }

  function openLevel(nextLevel: Level) {
    setLevel(nextLevel);
    changeView("learn");
  }

  function closeLesson(id: string) {
    setLessonId(null);
    window.setTimeout(() => document.querySelector<HTMLButtonElement>(`[data-lesson-id="${id}"]`)?.focus(), 20);
  }

  function answerLesson(id: string, isCorrect: boolean, scheduledReview = false, expectedReview?: string) {
    updateProgress((current) => {
      const previous = current[id] ?? { strength: 0, attempts: 0, correct: 0 };
      const earnsScheduledCredit = scheduledReview && Boolean(expectedReview) && previous.nextReview === expectedReview && Date.parse(expectedReview!) <= Date.now();
      const strength = earnsScheduledCredit ? (isCorrect ? Math.min(7, previous.strength + 1) : Math.max(0, previous.strength - 1)) : previous.strength;
      const nextReview = earnsScheduledCredit ? futureDate(isCorrect ? intervals[Math.max(0, strength - 1)] : 1) : previous.nextReview ?? futureDate(1);
      return { ...current, [id]: { ...previous, strength, attempts: previous.attempts + 1, correct: previous.correct + Number(isCorrect), nextReview, lastStudied: new Date().toISOString() } };
    });
  }

  function completeLesson(id: string) {
    updateProgress((current) => {
      const previous = current[id] ?? { strength: 0, attempts: 0, correct: 0 };
      return { ...current, [id]: { ...previous, completed: true, nextReview: previous.nextReview ?? futureDate(1), lastStudied: new Date().toISOString() } };
    });
  }

  function speak(text: string) {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/→/g, ". "));
    utterance.lang = "fr-FR";
    utterance.rate = 0.88;
    speechSynthesis.speak(utterance);
  }

  function exportProgress() {
    const body = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), progress }, null, 2);
    const link = document.createElement("a");
    const url = URL.createObjectURL(new Blob([body], { type: "application/json" }));
    link.href = url;
    link.download = `grammaire-claire-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function importProgress(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const imported = parseProgressPayload(parsed);
        if (!imported) throw new Error();
        if (!confirm("Import this backup and replace the synced progress on all your devices? A safety export will download first.")) return;
        exportProgress();
        replaceProgress(imported.progress);
      } catch { alert("That file is not a valid Grammaire Claire backup."); }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  return (
    <main className="app-shell">
      <Sidebar view={view} due={due.length} completed={completed} syncStatus={syncStatus} onView={changeView} />
      <section className="workspace">
        <Topbar view={view} onSearch={() => { changeView("reference"); setTimeout(() => searchRef.current?.focus(), 20); }} />
        {view === "today" && <Today now={now} next={next} due={due} progress={progress} completed={completed} stable={stable} onLesson={openLesson} onView={changeView} onLevel={openLevel} />}
        {view === "learn" && !selected && <Learn level={level} progress={progress} onLevel={setLevel} onLesson={openLesson} />}
        {view === "learn" && selected && <LessonPage key={selected.id} lesson={selected} progress={progress} onBack={() => closeLesson(selected.id)} onLesson={openLesson} onAnswer={answerLesson} onComplete={completeLesson} onSpeak={speak} />}
        {view === "practice" && <Practice due={due} progress={progress} onAnswer={answerLesson} onLesson={openLesson} />}
        {view === "reference" && <Reference query={query} setQuery={setQuery} searchRef={searchRef} onLesson={openLesson} />}
        {view === "progress" && <ProgressPage progress={progress} completed={completed} stable={stable} due={due.length} syncStatus={syncStatus} conflict={progressConflict} onExport={exportProgress} onImport={importProgress} onRetrySync={retrySync} onUseSyncedCopy={() => { exportProgress(); adoptSyncedCopy(); }} onKeepDeviceCopy={() => { exportProgress(); keepDeviceCopy(); }} onReset={() => { if (confirm("Reset synced progress on all your devices? Export a backup first if you may want it later.")) replaceProgress({}); }} />}
        {view === "quality" && <Quality onLesson={openLesson} />}
      </section>
      <MobileNav view={view} due={due.length} onView={changeView} />
    </main>
  );
}

function Sidebar({ view, due, completed, syncStatus, onView }: { view: View; due: number; completed: number; syncStatus: SyncStatus; onView: (view: View) => void }) {
  const items: [View, string, string][] = [["today", "⌂", "Today"], ["learn", "◫", "Learn"], ["practice", "✎", "Practice"], ["reference", "⌕", "Reference"], ["progress", "↗", "Progress"]];
  return <aside className="sidebar">
    <button className="brand brand-button" onClick={() => onView("today")}><span className="brand-mark">ç</span><span className="brand-copy"><strong>Grammaire Claire</strong><small>French, step by step</small></span></button>
    <nav className="primary-nav" aria-label="Primary navigation">{items.map(([key, icon, name]) => <button key={key} className={view === key ? "active" : ""} onClick={() => onView(key)} aria-current={view === key ? "page" : undefined}><span className="nav-icon">{icon}</span><span>{name}</span>{key === "practice" && due > 0 && <b className="nav-count">{due}</b>}</button>)}</nav>
    <button className={`quality-link ${view === "quality" ? "active" : ""}`} onClick={() => onView("quality")}><span>✓</span><span>Quality &amp; sources</span></button>
    <div className="sidebar-note"><span className="eyebrow light">Course coverage</span><strong>{completed} of {lessons.length} lessons</strong><div className="mini-progress"><i style={{ width: `${(completed / lessons.length) * 100}%` }} /></div><small className={`sync-label sync-${syncStatus}`} role="status" aria-live="polite">{syncStatusLabel(syncStatus)}</small></div>
  </aside>;
}

function Topbar({ view, onSearch }: { view: View; onSearch: () => void }) {
  const titles: Record<View, [string, string]> = { today: ["Your daily plan", "Learn one thing well."], learn: ["Systematic A1–B2 course", "Build French that holds together."], practice: ["Retrieval and repair", "Turn weak points into strengths."], reference: ["Grammar reference", "Find the rule behind the sentence."], progress: ["Your learning evidence", "Completion is not mastery."], quality: ["Editorial standard", "Accuracy before volume."] };
  return <header className="topbar"><div><span className="eyebrow">{titles[view][0]}</span><h1>{titles[view][1]}</h1></div><button className="quiet-button" onClick={onSearch}>Search grammar <kbd>⌘ K</kbd></button></header>;
}

function Today({ now, next, due, progress, completed, stable, onLesson, onView, onLevel }: { now: number; next: Lesson; due: Lesson[]; progress: Progress; completed: number; stable: number; onLesson: (lesson: Lesson) => void; onView: (view: View) => void; onLevel: (level: Level) => void }) {
  const attempts = Object.values(progress).reduce((sum, item) => sum + item.attempts, 0);
  const correct = Object.values(progress).reduce((sum, item) => sum + item.correct, 0);
  const date = now ? new Intl.DateTimeFormat("en-US", { weekday: "long", day: "numeric", month: "long" }).format(new Date(now)) : "Today";
  return <div className="view-stack">
    <div className="today-date"><span>{date}</span><span>{due.length ? `${due.length} review${due.length === 1 ? "" : "s"} due` : "Review queue clear"}</span></div>
    <section className="hero-grid">
      <article className="continue-card"><div className="continue-copy"><span className={`level-badge level-${next.level.toLowerCase()}`}>{next.level}</span><span className="eyebrow">Recommended next</span><h2>{next.title}</h2><p>{next.summary}</p><div className="objective"><span>Can-do</span>{next.objective}</div><button className="primary-button" onClick={() => onLesson(next)}>{completed ? "Continue course" : "Begin the course"} →</button></div><div className="pattern-card"><small>Today&apos;s pattern</small><p lang="fr">{next.examples[0].fr}</p><span>{next.examples[0].en}</span><div className="pattern-lines"><i /><i /><i /></div></div></article>
      <aside className="daily-card"><span className="eyebrow">A focused session</span><h2>About 20 minutes</h2><ol className="plan-list"><li className={due.length ? "current" : "complete"}><span>{due.length ? "1" : "✓"}</span><div><strong>Review due</strong><small>{due.length ? `${due.length} checks` : "Nothing overdue"}</small></div><time>5 min</time></li><li className="current"><span>{due.length ? "2" : "1"}</span><div><strong>One new lesson</strong><small>{next.title}</small></div><time>12 min</time></li><li><span>+</span><div><strong>Mixed practice</strong><small>Optional retrieval</small></div><time>5 min</time></li></ol><button className="text-button" onClick={() => onView("practice")}>Open practice queue →</button></aside>
    </section>
    <section className="metric-grid"><article><span className="metric-icon teal">✓</span><div><strong>{completed}</strong><small>Lessons completed</small></div></article><article><span className="metric-icon coral">◇</span><div><strong>{stable}</strong><small>Stable after review</small></div></article><article><span className="metric-icon yellow">%</span><div><strong>{attempts ? `${Math.round(correct / attempts * 100)}%` : "—"}</strong><small>Practice accuracy</small></div></article><button className="quality-mini" onClick={() => onView("quality")}><span>Editorial promise</span><strong>Scoped rules and named sources</strong><small>See the standard →</small></button></section>
    <section className="path-overview"><div className="section-heading"><div><span className="eyebrow">The full path</span><h2>From foundations to B2 nuance</h2></div><button className="text-button" onClick={() => onView("learn")}>Explore all {lessons.length} lessons →</button></div><div className="level-overview-grid">{levels.map((item) => <button key={item} className="level-overview-card" onClick={() => onLevel(item)}><span>{item === "Foundation" ? "F" : item}</span><div><strong>{levelMeta[item].short}</strong><small>{lessons.filter((lesson) => lesson.level === item).length} lessons</small></div><b>{percentFor(item, progress)}%</b></button>)}</div></section>
  </div>;
}

function Learn({ level, progress, onLevel, onLesson }: { level: Level; progress: Progress; onLevel: (level: Level) => void; onLesson: (lesson: Lesson) => void }) {
  const scoped = lessons.filter((lesson) => lesson.level === level);
  const units = [...new Set(scoped.map((lesson) => lesson.unit))];
  return <div className="view-stack"><div className="level-tabs" aria-label="Course level">{levels.map((item) => <button key={item} aria-pressed={level === item} className={level === item ? "active" : ""} onClick={() => onLevel(item)}><span>{item === "Foundation" ? "F" : item}</span><small>{levelMeta[item].short}</small></button>)}</div>
    <section className="level-intro"><div><span className={`level-badge level-${level.toLowerCase()}`}>{level}</span><h2>{levelMeta[level].title}</h2><p>{levelMeta[level].description}</p></div><div className="level-stat"><strong>{percentFor(level, progress)}%</strong><span>completed</span><div className="progress-track"><i style={{ width: `${percentFor(level, progress)}%` }} /></div></div></section>
    <div className="unit-list">{units.map((unit, unitIndex) => { const group = scoped.filter((lesson) => lesson.unit === unit); return <section className="unit-card" key={unit}><div className="unit-heading"><span>{String(unitIndex + 1).padStart(2, "0")}</span><div><small>Unit {unitIndex + 1}</small><h3>{unit}</h3></div><b>{group.filter((lesson) => progress[lesson.id]?.completed).length}/{group.length}</b></div><div className="lesson-list">{group.map((lesson, index) => { const status = lessonStatus(progress[lesson.id]); return <button className="lesson-row" data-lesson-id={lesson.id} key={lesson.id} onClick={() => onLesson(lesson)}><span className={`lesson-number ${status.toLowerCase().replaceAll(" ", "-")}`}>{progress[lesson.id]?.completed ? "✓" : index + 1}</span><div><strong>{lesson.title}</strong><small>{lesson.summary}</small></div>{lesson.recognitionOnly && <span className="recognition-label">Recognition</span>}<span className={`status-label ${status.toLowerCase().replaceAll(" ", "-")}`}>{status}</span><span>›</span></button>; })}</div></section>; })}</div>
  </div>;
}

function LessonPage({ lesson, progress, onBack, onLesson, onAnswer, onComplete, onSpeak }: { lesson: Lesson; progress: Progress; onBack: () => void; onLesson: (lesson: Lesson) => void; onAnswer: (id: string, correct: boolean, scheduledReview?: boolean, expectedReview?: string) => void; onComplete: (id: string) => void; onSpeak: (text: string) => void }) {
  const [shown, setShown] = useState<Record<number, boolean>>({});
  const [answer, setAnswer] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const answerListRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => headingRef.current?.focus(), 20);
    return () => window.clearTimeout(timer);
  }, []);
  const correct = answer === lesson.exercise.answer;
  const index = lessons.findIndex((item) => item.id === lesson.id);
  const next = lessons[index + 1];
  return <article className="lesson-view"><button className="back-button" onClick={onBack}>← Back to {lesson.level}</button>
    <header className="lesson-title-block"><div><div className="lesson-kicker"><span className={`level-badge level-${lesson.level.toLowerCase()}`}>{lesson.level}</span><span>{lesson.unit}</span>{lesson.recognitionOnly && <span className="recognition-label">Recognition only</span>}</div><h2 ref={headingRef} tabIndex={-1}>{lesson.title}</h2><p>{lesson.summary}</p></div><div className="lesson-duration"><strong>{lesson.recognitionOnly ? 8 : 12}</strong><span>minutes</span></div></header>
    <section className="can-do-card"><span>By the end, you can</span><strong>{lesson.objective}</strong></section>
    <LessonSection number="01" eyebrow="See it in context" title="Meaning before terminology"><div className="example-grid">{lesson.examples.map((example, i) => <div className="example-card" key={example.fr}><div><button className="audio-button" onClick={() => onSpeak(example.fr)} aria-label={`Listen to ${example.fr}`}>▶</button><p lang="fr">{example.fr}</p></div><button className="translation-toggle" aria-expanded={Boolean(shown[i])} onClick={() => setShown((state) => ({ ...state, [i]: !state[i] }))}>{shown[i] ? "Hide translation" : "Show translation"}</button>{shown[i] && <p className="translation-text">{example.en}</p>}</div>)}</div></LessonSection>
    <LessonSection number="02" eyebrow="The rule" title="What the form is doing"><p className="rule-text">{lesson.rule}</p>{lesson.pattern && <div className="formula"><span>Pattern</span><strong>{lesson.pattern}</strong></div>}<aside className="trap-card"><span>Common trap</span><p>{lesson.trap}</p></aside></LessonSection>
    <LessonSection number="03" eyebrow="Check your understanding" title={lesson.exercise.prompt}><div className="answer-list" ref={answerListRef}>{lesson.exercise.options.map((option) => { const state = answer ? option === lesson.exercise.answer ? "correct" : option === answer ? "incorrect" : "muted" : ""; return <button key={option} className={state} disabled={Boolean(answer)} onClick={() => { setAnswer(option); onAnswer(lesson.id, option === lesson.exercise.answer); }}><span>{option}</span>{state === "correct" && <b>✓</b>}{state === "incorrect" && <b>×</b>}</button>; })}</div>{answer && <div className={`feedback-card ${correct ? "correct" : "incorrect"}`} role="status" aria-live="polite"><strong>{correct ? "Exactly." : `Best answer: ${lesson.exercise.answer}`}</strong><p>{lesson.exercise.rationale}</p>{!correct && <button className="text-button" onClick={() => { setAnswer(null); window.setTimeout(() => answerListRef.current?.querySelector<HTMLButtonElement>("button")?.focus(), 20); }}>Try once more</button>}</div>}</LessonSection>
    <footer className="lesson-completion"><div><span className="eyebrow">Review evidence</span><p>{progress[lesson.id]?.completed ? `Completed · ${lessonStatus(progress[lesson.id])}` : "Complete the check, then revisit it through spaced review."}</p></div><div className="completion-actions"><a href="#source-note">Source note</a><button className="primary-button" disabled={!answer} onClick={() => { onComplete(lesson.id); if (next) onLesson(next); }}>{next ? "Complete & next" : "Complete lesson"} →</button></div></footer>
    <div className="lesson-source" id="source-note"><strong>Editorial note</strong><p>{lesson.sourceNote}</p><span>Checked with: {lesson.sourceKeys.map((key) => courseSources.find((source) => source.key === key)?.name).filter(Boolean).join(" · ")}</span></div>
  </article>;
}

function LessonSection({ number, eyebrow, title, children }: { number: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return <section className="lesson-section"><div className="section-index">{number}</div><div className="lesson-section-content"><span className="eyebrow">{eyebrow}</span><h3>{title}</h3>{children}</div></section>;
}

function Practice({ due, progress, onAnswer, onLesson }: { due: Lesson[]; progress: Progress; onAnswer: (id: string, correct: boolean, scheduledReview?: boolean, expectedReview?: string) => void; onLesson: (lesson: Lesson) => void }) {
  const [session] = useState(() => {
    const weak = lessons.filter((lesson) => progress[lesson.id]?.attempts && progress[lesson.id].correct / progress[lesson.id].attempts < .75);
    const completed = lessons.filter((lesson) => progress[lesson.id]?.completed);
    const pool = due.length ? due : weak.length ? weak : completed.length ? completed : lessons.slice(0, 8);
    return { ids: pool.map((lesson) => lesson.id), reviewTimes: Object.fromEntries(pool.map((lesson) => [lesson.id, progress[lesson.id]?.nextReview])), mode: due.length ? "Scheduled review" : weak.length ? "Weak-area repair" : completed.length ? "Mixed practice" : "Foundation preview", scheduled: due.length > 0 };
  });
  const queue = session.ids.map((id) => lessons.find((lesson) => lesson.id === id)).filter(Boolean) as Lesson[];
  const [position, setPosition] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const questionRef = useRef<HTMLHeadingElement>(null);
  const completionRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => (position >= queue.length ? completionRef.current : questionRef.current)?.focus(), 20);
    return () => window.clearTimeout(timer);
  }, [position, queue.length]);
  if (position >= queue.length) {
    return <section className="practice-complete" role="status" aria-live="polite"><span className="eyebrow">Session complete</span><h2 ref={completionRef} tabIndex={-1}>You reviewed {queue.length} grammar {queue.length === 1 ? "point" : "points"}.</h2><p>{session.scheduled ? "Each due item was retrieved once. Repeating it immediately would not count as spaced mastery." : "This mixed practice checked accuracy without changing your spaced-mastery level."}</p><button className="primary-button" onClick={() => onLesson(queue[0])}>Reopen the first lesson →</button></section>;
  }
  const current = queue[position];
  return <div className="practice-layout"><section className="practice-card"><div className="practice-top"><div><span className={`level-badge level-${current.level.toLowerCase()}`}>{current.level}</span><span>{session.mode}</span></div><span>{position + 1} / {queue.length}</span></div><h2 ref={questionRef} tabIndex={-1}>{current.exercise.prompt}</h2><p className="practice-context">From <button onClick={() => onLesson(current)}>{current.title}</button></p><div className="answer-list large">{current.exercise.options.map((option) => { const state = answer ? option === current.exercise.answer ? "correct" : option === answer ? "incorrect" : "muted" : ""; return <button key={option} className={state} disabled={Boolean(answer)} onClick={() => { setAnswer(option); onAnswer(current.id, option === current.exercise.answer, session.scheduled, session.reviewTimes[current.id]); }}><span>{option}</span>{state === "correct" && <b>✓</b>}{state === "incorrect" && <b>×</b>}</button>; })}</div>{answer && <div className={`feedback-card ${answer === current.exercise.answer ? "correct" : "incorrect"}`} role="status" aria-live="polite"><strong>{answer === current.exercise.answer ? "Correct." : `Correct answer: ${current.exercise.answer}`}</strong><p>{current.exercise.rationale}</p><button className="primary-button" onClick={() => { setPosition((value) => value + 1); setAnswer(null); }}>Next check →</button></div>}</section><aside className="practice-sidebar"><span className="eyebrow">Why this is here</span><h3>{session.scheduled ? "It is time to retrieve this rule." : session.mode === "Weak-area repair" ? "Your answers show this needs repair." : "Practice begins with prerequisites."}</h3><p>{session.scheduled ? "Correct retrieval lengthens the review interval. An error shortens it and keeps the explanation close." : "This practice improves accuracy, but only a scheduled review on a later day advances stable mastery."}</p><div className="review-ladder"><span>1d</span><i/><span>3d</span><i/><span>7d</span><i/><span>14d</span><i/><span>30d</span></div><button className="text-button" onClick={() => onLesson(current)}>Reopen the lesson →</button></aside></div>;
}

function Reference({ query, setQuery, searchRef, onLesson }: { query: string; setQuery: (value: string) => void; searchRef: RefObject<HTMLInputElement | null>; onLesson: (lesson: Lesson) => void }) {
  const [filter, setFilter] = useState<Level | "All">("All");
  const results = useMemo(() => { const needle = query.trim().toLocaleLowerCase(); return lessons.filter((lesson) => (filter === "All" || lesson.level === filter) && (!needle || `${lesson.title} ${lesson.summary} ${lesson.rule} ${lesson.tags.join(" ")} ${lesson.examples.map((e) => e.fr).join(" ")}`.toLocaleLowerCase().includes(needle))); }, [filter, query]);
  return <div className="reference-layout"><section><div className="search-box"><span>⌕</span><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try ‘subjunctive’, ‘depuis’, ‘object pronouns’…" aria-label="Search grammar"/><kbd>⌘ K</kbd></div><div className="filter-row"><button className={filter === "All" ? "active" : ""} onClick={() => setFilter("All")}>All</button>{levels.map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div><p className="result-count">{results.length} entries</p><div className="reference-results">{results.map((lesson) => <button key={lesson.id} onClick={() => onLesson(lesson)}><span className={`level-badge level-${lesson.level.toLowerCase()}`}>{lesson.level}</span><div><strong>{lesson.title}</strong><p>{lesson.summary}</p><small lang="fr">{lesson.examples[0].fr}</small></div><span>›</span></button>)}</div>{!results.length && <div className="empty-state"><strong>No exact match</strong><p>Try a broader English or French grammar term.</p></div>}</section><aside className="reference-index"><span className="eyebrow">Quick index</span>{["articles", "verbs", "pronouns", "negation", "subjunctive", "hypotheses", "register"].map((tag) => <button key={tag} onClick={() => setQuery(tag)}>{tag}<span>→</span></button>)}<div className="reference-note"><strong>CEFR-aligned, not certification</strong><p>CEFR describes communicative ability rather than prescribing one official grammar list.</p></div></aside></div>;
}

function ProgressPage({
  progress,
  completed,
  stable,
  due,
  syncStatus,
  conflict,
  onExport,
  onImport,
  onReset,
  onRetrySync,
  onUseSyncedCopy,
  onKeepDeviceCopy,
}: {
  progress: Progress;
  completed: number;
  stable: number;
  due: number;
  syncStatus: SyncStatus;
  conflict: ProgressConflict | null;
  onExport: () => void;
  onImport: (event: ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
  onRetrySync: () => void;
  onUseSyncedCopy: () => void;
  onKeepDeviceCopy: () => void;
}) {
  const attempts = Object.values(progress).reduce((sum, item) => sum + item.attempts, 0);
  const correct = Object.values(progress).reduce((sum, item) => sum + item.correct, 0);
  const canRetry = syncStatus === "offline" || syncStatus === "error" || syncStatus === "sign-in";
  const legacyChoice = conflict?.reason === "legacy-unowned";
  return <div className="progress-layout">
    <section className="progress-summary"><article><span>Course coverage</span><strong>{Math.round(completed / lessons.length * 100)}%</strong><small>{completed} of {lessons.length} lessons</small></article><article><span>Stable recall</span><strong>{stable}</strong><small>across separated reviews</small></article><article><span>Practice accuracy</span><strong>{attempts ? `${Math.round(correct / attempts * 100)}%` : "—"}</strong><small>{attempts || "No"} checked answers</small></article><article><span>Review queue</span><strong>{due}</strong><small>due now</small></article></section>
    <section className="progress-panel"><div className="section-heading"><div><span className="eyebrow">Coverage by level</span><h2>What you have completed</h2></div></div><div className="level-progress-list">{levels.map((item) => { const total = lessons.filter((lesson) => lesson.level === item).length; const count = lessons.filter((lesson) => lesson.level === item && progress[lesson.id]?.completed).length; const percent = percentFor(item, progress); return <div key={item}><span className={`level-badge level-${item.toLowerCase()}`}>{item}</span><div><strong>{levelMeta[item].short}</strong><div className="progress-track"><i style={{ width: `${percent}%` }}/></div></div><span>{count}/{total}</span><b>{percent}%</b></div>; })}</div></section>
    {conflict && <section className="sync-conflict-panel" role="alert"><div><span className="eyebrow">Sync choice needed</span><h2>{legacyChoice ? "Local progress from the earlier version was found." : "Two replacement copies cannot be safely combined."}</h2><p>{legacyChoice ? "Choose whether to add this device's existing progress to the signed-in account or use the account's synced copy." : "Your device copy is still saved locally. Choose which copy should become the private synced version."} A safety backup downloads before either choice.</p></div><div className="conflict-actions"><button onClick={onKeepDeviceCopy}>Keep this device</button><button onClick={onUseSyncedCopy}>Use synced copy</button></div></section>}
    <section className="data-panel"><div><span className="eyebrow">Your data</span><h2>Private, synced and portable</h2><p>Your signed-in progress is privately synced across devices and also kept locally for offline study. Export a readable backup whenever you want an independent copy.</p><div className={`sync-state sync-${syncStatus}`} role="status" aria-live="polite"><span>{syncStatusLabel(syncStatus)}</span>{canRetry && <button className="text-button" onClick={onRetrySync}>Try again</button>}</div></div><div className="data-actions"><button onClick={onExport}>Export backup</button><input className="backup-input" aria-label="Import progress backup" title="Import backup" type="file" accept="application/json" onChange={onImport}/><button className="danger-button" onClick={onReset}>Reset progress</button></div></section>
  </div>;
}

function Quality({ onLesson }: { onLesson: (lesson: Lesson) => void }) {
  const sample = lessons.find((lesson) => lesson.id === "a2-03") ?? lessons[0];
  return <div className="quality-layout"><section className="quality-hero"><span className="quality-seal">✓</span><div><span className="eyebrow">The editorial promise</span><h2>A rule is useful only when its boundaries are clear.</h2><p>Each lesson states the normal pattern, its scope, an important exception, and the register in which it belongs.</p></div></section><section className="quality-grid"><article><span>01</span><h3>Meaning first</h3><p>Tense and mood are taught as meaning choices, not mechanical English translations.</p></article><article><span>02</span><h3>Scoped claims</h3><p>Qualifiers such as “normally” stay when authentic French varies by context.</p></article><article><span>03</span><h3>Diagnostic answers</h3><p>Distractors represent recognizable learner errors, never random bad French.</p></article><article><span>04</span><h3>Production vs. recognition</h3><p>Literary tenses are identified as reading knowledge, not everyday speech goals.</p></article></section><section className="source-panel"><div className="section-heading"><div><span className="eyebrow">Reference set</span><h2>Named official sources</h2><p className="source-intro">{courseMethodology}</p></div></div><div className="source-list">{courseSources.map((source) => <a key={source.key} href={source.url} target="_blank" rel="noreferrer"><div><strong>{source.name}</strong><p>{source.use}</p></div><span>↗</span></a>)}</div></section><section className="audit-example"><div><span className="eyebrow">See the standard applied</span><h2>{sample.title}</h2><p>{sample.rule}</p></div><button className="primary-button" onClick={() => onLesson(sample)}>Open audited lesson →</button></section></div>;
}

function MobileNav({ view, due, onView }: { view: View; due: number; onView: (view: View) => void }) {
  const items: [View, string, string][] = [["today", "⌂", "Today"], ["learn", "◫", "Learn"], ["practice", "✎", "Practice"], ["reference", "⌕", "Search"], ["progress", "↗", "Progress"]];
  return <nav className="mobile-nav" aria-label="Mobile navigation">{items.map(([key, icon, label]) => <button key={key} className={view === key ? "active" : ""} aria-current={view === key ? "page" : undefined} onClick={() => onView(key)}><span>{icon}{key === "practice" && due > 0 && <i>{due}</i>}</span><small>{label}</small></button>)}</nav>;
}
