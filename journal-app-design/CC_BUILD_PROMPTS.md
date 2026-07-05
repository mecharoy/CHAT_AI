# Building Ember with Claude Code — paste-ready prompts

How to use this file:

1. Do the **prerequisites** yourself (10 minutes, one time).
2. Create an empty project folder, copy `CLAUDE.md` (from this design folder) and `DESIGN.md` into it.
3. Open Claude Code in that folder and paste the **Phase 0 prompt**. When it finishes, run the app and check the acceptance list. Then Phase 1, and so on.
4. One phase per session/branch. Commit after each green phase. If a phase's acceptance check fails, tell Claude Code exactly which checklist line failed — don't move on.

---

## Prerequisites (you, once)

- Install Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh` (Windows: rustup-init.exe)
- Install Node.js 20+.
- Tauri OS deps: follow https://tauri.app/start/prerequisites/ for your OS (Linux needs webkit2gtk etc.; macOS needs Xcode CLT; Windows needs WebView2, usually preinstalled).
- Decide your AI path (any or all — switchable in Settings):
  - **Claude subscription (recommended if you have Pro/Max):** Claude Code installed and logged in (`claude login`). The app runs it headlessly; no API key needed.
  - **Anthropic API key** from console.anthropic.com (pay-per-use, a few cents/day).
  - **Local model:** Ollama installed with a model pulled (`ollama pull qwen2.5:14b` or `llama3.1:8b`) — the only fully-offline option.
- Sanity check after Phase 0: `npm run tauri dev` opens a window.

---

## Phase 0 — Skeleton

```
Read DESIGN.md and CLAUDE.md fully before writing any code.

Scaffold the Ember app in this directory:

1. Tauri 2 app with React + TypeScript + Vite + Tailwind CSS. App name "ember",
   window title "Ember".
2. Add tauri plugins: sql (sqlite), notification, global-shortcut, autostart,
   http. Configure capabilities/permissions for all of them now so later
   phases don't fight the permission system.
3. Database: on startup, open sqlite at the app-data dir as ember.db and run
   migrations creating exactly the schema in DESIGN.md §4 (all tables). Use a
   migrations table so future schema changes are additive. Write a small typed
   data-access module (src/db/) with functions per table; no raw SQL in
   components.
4. Main window UI: left sidebar with four tabs — Today, Journal, Insights,
   Settings — each rendering a placeholder page. Clean, calm, dark-mode-first
   styling per CLAUDE.md design notes.
5. System tray: icon with menu (Open Ember / Quick capture (stub) / Quit).
   Closing the main window hides it to tray instead of quitting.
6. Settings page: form for user name, reminder time (default 21:30), journal
   voice (first/second person), AI provider (anthropic | local), model name,
   local base URL, API key field (plain settings table for now; keychain
   comes in Phase 6). Persist to the settings table and load on start.

Acceptance: `npm run tauri dev` runs; tabs switch; closing window keeps tray
alive and reopens from tray; settings survive an app restart; ember.db exists
with all tables (verify with sqlite3 CLI and paste the .tables output).
```

## Phase 1 — Quick capture

```
Implement quick capture per DESIGN.md §2.1.

1. Second window "capture-bar": frameless, transparent background, always on
   top, ~560x64, centered at upper third of the primary screen, hidden by
   default, skip-taskbar.
2. Global shortcut Ctrl+Shift+J (read from settings, rebindable later)
   toggles it. Tray left-click also opens it. On open: focus the input.
3. The bar: single text input, placeholder "What's on your mind?", a row of 5
   mood emojis (😞 😕 😐 🙂 😄) as optional toggle, and a subtle "N notes today"
   label. Enter saves to captures table (ISO local timestamp) and hides the
   bar with a 150ms fade. Esc or click-away hides without saving.
4. Today tab: list today's captures newest-first with time and emoji; allow
   delete on hover. Show a friendly empty state.

Acceptance: hotkey summons the bar over any app; Enter stores and hides; Esc
discards; captures appear on Today tab instantly (use a Tauri event to notify
the main window); restart persists captures.
```

## Phase 2 — Counselor chat

```
Implement the AI provider layer and evening chat per DESIGN.md §3.3, §5.2, §5.3.

1. src/ai/: an AIProvider interface (chatStream + complete) with three
   implementations per DESIGN.md §3.3 —
   (a) ClaudeSubscriptionProvider: spawn the `claude` CLI headlessly from the
       Rust side (`claude -p <prompt> --output-format stream-json`), pipe the
       system prompt + conversation in, parse the line-delimited JSON stdout
       into streamed tokens, and surface a clear settings-page error if the
       CLI is missing or not logged in (detect via `claude --version` /
       nonzero exit). Never touch or store any OAuth token — always go
       through the CLI.
   (b) AnthropicProvider: v1/messages, SSE streaming, model + key from
       settings, via the Tauri http plugin so CORS is a non-issue.
   (c) LocalProvider: OpenAI-compatible chat/completions with stream:true
       against the configured base URL.
   Factory reads settings. Surface errors as typed results, not
   throws-to-console. Settings gets a "Test connection" button per provider.
2. Context builder (src/ai/context.ts): assembles the counselor system prompt
   from DESIGN.md §5.2.6, filling profile summary (empty-safe), top
   observations (empty for now), yesterday's summary line, today's captures,
   neglected domains (empty for now), and open threads (empty for now). The
   prompt must include the full session-flow, question-craft, dig-vs-move-on,
   and hard-rules sections from §5.2.6 verbatim — they are the product.
3. Today tab becomes the session UI: "Start tonight's conversation" button
   creates/opens today's session (sessions + messages tables), links today's
   captures to it, and the assistant sends the streamed opener. Chat UI:
   bubbles, streaming token rendering, input pinned at bottom, Enter to send.
4. Persistent "Wrap up & write my journal" button (stub: ends the session,
   sets status=wrapped; journal generation lands in Phase 3). Also honor the
   model offering to wrap up.
5. Reopening the app mid-session restores the transcript and continues.

Acceptance: with at least two of the three providers available (e.g. Claude
subscription + Ollama) a full conversation works with visible streaming by
flipping Settings; opener references today's actual captures and never opens
with "how was your day"; the model asks one question per message; transcript
persists across restart; provider failure (CLI missing, network down) shows an
inline retry / settings hint, not a dead UI.
```

## Phase 3 — Journal generation

```
Implement journal writing per DESIGN.md §2.4 and §5.4.

1. src/ai/journal.ts: on wrap-up, call complete() with the journal-writer
   prompt (captures + transcript + profile + voice setting), demanding the
   JSON contract {title, narrative, highlights[], counselor_note}. Validate;
   retry once appending the parse error; on second failure show the manual
   fallback template (editable narrative prefilled with captures).
2. Entry review screen (replaces chat when generation finishes): rendered
   entry with sections "The Day", "What stood out", "Counselor's note".
   Actions: inline-edit any section (sets user_edited), "Regenerate" with an
   optional feedback note passed into the prompt, and "Save entry".
3. Journal tab: month calendar (dot = entry exists) + reverse-chronological
   list; click opens the full entry read view; edit from there too.
4. Streak: consecutive days with saved entries; show it small on Today tab.

Acceptance: wrap-up produces a faithful entry grounded in the conversation
(no invented events — spot check); regenerate-with-note visibly obeys the
note; saved entries appear in Journal tab and survive restart; the fallback
path works when the provider is unreachable.
```

## Phase 4 — Memory & extraction

```
Implement the memory pipeline per DESIGN.md §5.3 and §5.5.

1. src/ai/extractor.ts: after an entry is saved, call complete() with the
   extractor prompt demanding the strict JSON in DESIGN.md §5.5. Validate
   against a zod schema; retry once with the error; on second failure write
   day_metrics with nulls and continue silently.
2. Upsert pipeline: day_metrics row per day; observations upserts by
   (kind, lowercased key) — increment occurrences, update last_seen and
   detail, rolling-average sentiment.
3. Wire memory into chat: context builder now loads the profile summary and
   the top 15 observations ranked by occurrences * recency decay, formatted
   as compact lines. Also compute {neglected_domains} (which of the 8 day-audit
   domains from DESIGN.md §5.2.2 haven't appeared in the last 5 sessions'
   metrics) and {open_threads} (themes marked unresolved in recent raw_json).
   Cap the whole context block at ~2000 tokens.
4. Simple profile bootstrap: if profile is empty and >=3 entries exist, run a
   one-off complete() that drafts the first profile summary from the last 7
   day_metrics raw_json blobs. (Weekly refresh comes in Phase 5.)

Acceptance: after saving an entry, day_metrics and observations rows exist
and look sane (paste them); the NEXT day's chat opener demonstrably uses a
past observation; a malformed model response does not block entry saving.
```

## Phase 5 — Insights & weekly review

```
Implement the Insights tab per DESIGN.md §2.5 (modules A–J) and §5.6. Use
Recharts. Respect the three principles: every stat links back to entries,
modules unlock progressively at the entry-count thresholds in §2.5 (locked
modules render a friendly "unlocks after N entries" placeholder), and
statistical findings are phrased as plain-language hypotheses with counts.

1. Vitals row (module A): streak, entries this month, 7-day avg mood and
   energy with vs-previous-week delta arrows, captures this week.
2. Mood & energy chart (B): faint daily points + bold 7-day rolling average,
   2w/4w/12w/1y toggle; tooltip = summary_line; click = open entry; best and
   worst day markers; missing days gap, not zero.
3. Week rhythm (C): mood by day-of-week bars (opacity ∝ sample size) and a
   capture-time-of-day histogram.
4. Themes (D): ranked list with count, 8-week sparkline, sentiment tint, and
   Rising/Fading badges (last 2 weeks vs prior 6); click filters the Journal
   tab.
5. Habits (E): month heat-grid per pinned habit with streak and weekly
   totals; "discovered habits" list with one-click pin/unpin; effect chips
   ("gym days avg 7.1 vs 5.7, n=14/9") only when n>=10 per side.
6. What moves your mood (F): same-day and next-day comparisons of mood/energy
   against habits, sleep_hours, people, themes; render only findings with
   n>=10 per side and a meaningful gap, as plain sentences with counts; add
   the permanent "patterns, not causes" small print.
7. Emotional vocabulary (G): horizontal bars of extractor-named emotions,
   4w/all-time toggle.
8. People (H): mentions + sentiment + sparkline; hideable in Settings; no
   ranking or nudges.
9. Weekly review job (I+J): scheduler (check every minute) — on Sunday at
   reminder time, or on demand via a button, run the reviewer prompt
   (DESIGN.md §5.6) over the week's raw_json; store weekly_reviews; REPLACE
   the profile summary with new_profile_summary. Render the letter plus the
   "You're good at" / "Worth your attention" evidence cards (each claim
   links to its supporting entries) at the top of Insights. Monthly report
   generated on the 1st, archived alongside the letters.

Acceptance: write a dev-only seed script inserting ~6 weeks of realistic fake
entries/metrics so every module is testable today; all modules render, unlock
correctly at their thresholds when run against a trimmed dataset, and link
through to entries; running the weekly review updates the cards AND the
profile table; fresh-install empty state shows friendly placeholders, not
broken charts.
```

## Phase 6 — Reminders & polish

```
Finish per DESIGN.md §2.2 and §6.

1. Evening reminder: scheduler fires a desktop notification at the configured
   time if today's session isn't wrapped — "Ready to talk about today?
   (N notes waiting)". Clicking opens the main window on Today. Snooze 30m/1h
   and "skip tonight" (marks session skipped). Never fire twice in a day.
2. Missed-day handling: if yesterday has no wrapped session, tonight's context
   builder adds a one-line catch-up instruction to the counselor prompt.
3. Autostart with OS (toggle in Settings, default on), starting hidden to tray.
4. Move the API key from the settings table to the OS keychain; migrate any
   existing plaintext key and blank the old row.
5. Settings additions: rebind hotkey, export-all (folder of markdown entries +
   one JSON dump), delete-all (typed confirmation), reminder time picker.
6. First-run onboarding: 3 short screens — name, provider+key/URL test button
   ("say hi" round-trip), reminder time — then land on Today with a sample
   capture pre-filled.
7. Sweep: loading/empty/error states on every tab; app icon; `npm run tauri
   build` produces a working installer for my OS.

Acceptance: fresh install walk-through works end-to-end (onboard → capture →
reminder fires → chat → entry → insights); reminder respects snooze/skip; key
is gone from ember.db (prove it with a SELECT); packaged build runs outside
dev mode.
```

---

## Working tips for the build

- **Always let Claude Code read `DESIGN.md` + `CLAUDE.md` first** — every prompt above assumes it.
- **Test with the local model early** (Phase 2) even if you'll mostly use Claude — it shakes out the provider abstraction while everything is small.
- **When something breaks**, paste the exact error and say "fix this without changing the phase scope". Scope creep mid-phase is the main failure mode.
- **Prompt tuning is a product feature, not a code feature.** After Phase 3, spend one session just having evening chats and telling Claude Code how the tone should change; iterate on the prompt files only.
- Keep `ember.db` backups while iterating on Phase 4 — extraction bugs are easiest to debug by re-running on the same data.
