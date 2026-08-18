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
- private account sync, offline device storage, and JSON backup/restore
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

The local app remains fully usable and keeps progress in that browser. Automatic
cross-device sync is enabled on the private hosted version, where the platform
supplies the signed-in identity and the `DB` database binding.

## Progress privacy and recovery

- every answer is written to the current device before network sync begins
- hosted progress is keyed by the platform's private, opaque user identifier
- a fresh hosted session confirms the signed-in owner before opening an account
  cache; work done before confirmation stays in an unowned draft and requires an
  explicit keep-or-discard choice when connectivity returns
- the offline service worker never caches `/api/` responses
- revision checks and idempotent mutation IDs prevent silent overwrites/replays
- reset and import operations use replacement epochs; ambiguous offline conflicts
  require an explicit choice and automatically export a safety backup
- course source code and the database schema may live in GitHub, but learner
  progress is stored in the private hosted database, not in the repository

## Verify

```bash
npm run validate
npm run lint
npm test
```

The Progress screen always shows whether the latest device copy is synced,
offline, or waiting for a conflict decision. A readable export remains available
as an independent backup.
