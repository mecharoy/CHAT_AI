# CLAUDE.md — Ember

> Copy this file into the root of the new Ember project before Phase 0.

Ember is a local-first desktop journaling companion. The user drops quick
notes during the day, has a short counselor-style AI conversation in the
evening, and the AI writes the journal entry and tracks patterns over time.
The full product spec is in `DESIGN.md` — read it before any feature work.

## Stack

- Tauri 2 (Rust core) + React 18 + TypeScript (strict) + Vite + Tailwind CSS
- SQLite via tauri-plugin-sql; Recharts for charts
- AI: provider abstraction in `src/ai/` — Anthropic API or OpenAI-compatible
  local endpoint (Ollama/LM Studio). Never hardcode a provider outside it.

## Commands

- `npm run tauri dev` — run the app
- `npm run tauri build` — production build
- `npm run typecheck` — `tsc --noEmit` (must pass before any commit)
- `npm run lint` — eslint

## Layout

```
src/
  ai/          provider layer, prompt builders, context assembly, extraction
  db/          typed data access, migrations — the ONLY place SQL lives
  windows/     main window pages (Today, Journal, Insights, Settings)
  capture/     the capture-bar window UI
  components/  shared UI
src-tauri/     Rust: tray, shortcuts, scheduler, window management
```

## Hard rules

1. **Local-first & private.** No telemetry, no analytics, no network calls
   except the configured AI endpoint. Never log message content, captures,
   or entries. Never write the API key anywhere except its designated store
   (settings table pre-Phase-6, OS keychain after).
2. **SQL only in `src/db/`.** Components call typed functions. Schema changes
   go through numbered migrations — never edit an applied migration.
3. **All model output that must be structured is validated** (zod), retried
   once with the parse error appended, then degraded gracefully. A model
   failure must never lose user data or block saving an entry.
4. **Prompts live in code as exported template functions** in `src/ai/prompts/`,
   one file per job (counselor, journal, extractor, review). They are product
   surface — change them only when asked, and keep DESIGN.md §5 as the source
   of truth for their contracts.
5. **Provider-agnostic:** every AI feature must work on both providers.
   If a feature relies on a cloud-only capability, stop and flag it.
6. **Dates:** store ISO 8601 local time; a "day" is the user's local calendar
   day. Session/entry uniqueness is per local date.

## Design language

- Calm and quiet: dark-mode-first, generous spacing, one accent color (warm
  amber), no gamification noise beyond the small streak counter.
- The capture bar must feel instant: no spinners, no layout shift, <100ms to
  input focus.
- Empty states are friendly and explain the daily loop in one line.
- Chat renders streaming tokens; never block the UI on a full response.

## Testing expectations

- Vitest for: db access functions (against a temp sqlite file), prompt
  builders (snapshot the assembled context), extractor validation/retry
  logic, streak calculation, observation upsert math.
- UI and Tauri integration are verified manually via each phase's acceptance
  checklist in `CC_BUILD_PROMPTS.md` — say explicitly which items you
  verified and how.
