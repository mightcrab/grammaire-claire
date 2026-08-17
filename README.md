# Grammaire Claire

An interactive, local-first French grammar course covering Foundation, A1, A2,
B1, and B2. It combines a prerequisite-ordered learning path, concise reference
pages, diagnostic exercises, spaced review, progress evidence, and a transparent
editorial methodology.

## What is included

- 58 complete lessons across 27 units
- two contextual French examples and translations per lesson
- scoped rule explanations, common traps, and diagnostic answer rationales
- Foundation → A1 → A2 → B1 → B2 prerequisite links
- Today, Learn, Practice, Reference, Progress, and Quality views
- browser-based French audio where a compatible voice is available
- device-local progress, spaced-review dates, and JSON backup/restore
- responsive keyboard-, touch-, and screen-reader-friendly interface

Passé simple and passé antérieur are explicitly marked as recognition-only at
B2. Course completion is never presented as official CEFR or DELF certification.

## Accuracy standard

Level placement starts with the France Éducation international linguistic
inventory and Council of Europe communicative descriptors. High-risk rules are
checked against institutional references such as the Académie française and
the OQLF Banque de dépannage linguistique. Every lesson retains a source note,
and `npm run validate` checks content structure, prerequisites, source keys,
exercise answers, American-English copy, and recognition-only labeling.

The course's **Quality & sources** screen lists the complete source hierarchy and
explains the difference between CEFR alignment and certification.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Verify

```bash
npm run validate
npm run lint
npm test
```

Progress is stored in the browser rather than in an account. Export a backup
from the Progress screen before clearing browser data or moving devices.
