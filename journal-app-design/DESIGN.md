# Ember — a journal that writes itself

*A local desktop journaling companion for people who hate journaling.*

---

## 1. The problem, restated

Traditional journaling fails you for specific reasons, and each one drives a design decision:

| Pain point | Design answer |
|---|---|
| "I don't know what to write" | You never face a blank page. The AI asks you questions; you just answer. |
| "Thinking it through is exhausting" | Capture is fire-and-forget: one line, hit Enter, back to work. Reflection happens once, in the evening, as a conversation. |
| "Updating the same thing again and again" | The app remembers. It tracks your recurring themes, habits, and people, so you never re-explain context. |
| "What parts are important?" | The AI decides what's worth keeping. It writes the journal entry and highlights what mattered. |
| "I forget / lose momentum" | The app lives in your system tray, nudges you in the evening, and a 3-minute chat still counts as a full entry. |

**Core inversion:** you don't write the journal. You live your day, drop breadcrumbs, and talk for a few minutes in the evening. The app writes the journal *about* you, *for* you — and gets to know you over time.

---

## 2. The daily loop (user experience)

```
 morning ──────── day ──────────── evening ─────────────── done
    │              │                  │                      │
    │   Ctrl+Shift+J → tiny bar       │  reminder fires      │
    │   "argued with vendor, ugh"     │  → chat opens        │
    │   "gym done 💪"                 │  → 5–15 min convo    │
    │   "idea: automate the report"   │  → AI writes entry   │
    │                                 │  → you skim, save    │
    └── each capture: 5 seconds ──────┴── total: ~10 min ────┘
```

### 2.1 Quick capture (all day)

- A **global hotkey** (default `Ctrl+Shift+J`) summons a small, always-on-top capture bar — a single text field, like Spotlight. Type, `Enter`, it vanishes. `Esc` dismisses.
- Also reachable from the **system tray icon** (left-click → capture bar, right-click → menu).
- Each capture is timestamped and stored locally. Optional: tap one of five mood emojis before submitting (never required).
- No editing, no organizing, no categories. Captures are raw material, not content. The evening AI does the sense-making.
- The bar shows a subtle count of today's captures ("3 notes today") for a tiny sense of progress.

### 2.2 Evening reminder

- At a user-configured time (default 21:30), a desktop notification fires: *"Ready to talk about today? (3 notes waiting)"*.
- Clicking it opens the main window on the Chat tab. Snooze options: 30 min / 1 hr / skip tonight.
- If the user skips, tomorrow's session gracefully covers both days ("We didn't talk yesterday — anything from then still on your mind?").
- The app autostarts with the OS and lives in the tray, so this always works.

### 2.3 The evening conversation

This is the heart of the app. It behaves like a good counselor, not a form:

- **Opens personally**, referencing the day's captures and known context:
  > "Hey. I saw the vendor argument note this afternoon — that's the same vendor from last week, right? Want to start there, or was the gym win the bigger deal today?"
- **One question at a time.** Never a checklist. Follows the user's energy.
- **Follow-up questions** that dig gently: "What did you actually say to them?", "How did your body feel when that happened?", "Is this the third time this month, or does it just feel like it?"
- **Notices patterns across days** using its memory: "You've mentioned being drained after these calls three Tuesdays in a row."
- **Respects brevity.** If the user gives short answers, it wraps up in 3–4 exchanges. A tired one-word chat is still a valid session.
- **Ends cleanly.** After ~10 exchanges or when the user says "that's it / I'm done / wrap up", it summarizes in one warm line and offers: *"Want me to write today's entry?"* There is also a persistent **"Wrap up & write my journal"** button so the user is never trapped in conversation.

### 2.4 The AI-written journal entry

When the session ends, the AI composes the entry from: today's captures + the conversation + its running knowledge of the user. Structure:

- **The Day** — a short narrative (150–300 words) in a natural voice, written *about* the user's day in second person or first person (user-configurable), grounded only in what was actually said. No invention.
- **What stood out** — 2–4 bullets: the moments that mattered and why.
- **Counselor's note** — the AI's own insight, clearly marked as its perspective: a pattern it noticed, a gentle challenge, or an acknowledgment. This is the "added insight" — it must be specific, never horoscope-fluff.
- **Trackers** (auto-extracted, shown as chips): mood /10, energy /10, habits touched, people mentioned, themes.

The user can **edit any part, regenerate with a note** ("make it shorter", "you overweighted the vendor thing"), or just hit Save. Saving marks the day complete (streak++).

### 2.5 Insights (statistics)

A dashboard tab, updated after every entry:

- **Mood & energy trend** — line chart over 2/4/12 weeks, with entries' one-line summaries on hover.
- **Themes over time** — the top recurring themes (work stress, sleep, project X, family…) as a ranked list with sparklines; click a theme to see every entry that touched it.
- **Habits & behaviors** — automatically discovered (gym, sleep quality, skipped lunch, doomscrolling…) plus any the user pins; shown as a month grid (GitHub-style heat squares).
- **People** — who shows up in your life and with what emotional charge.
- **"You're good at" / "Worth your attention"** — two AI-curated cards, refreshed by a weekly review job: strengths it has observed with evidence ("You consistently follow through on commitments to other people — 9 of 10 mentions") and focus areas framed kindly ("Sleep under 6h preceded 4 of your 5 lowest-mood days").
- **Weekly review** — every Sunday the AI writes a short "week in review" letter and it appears here (and as that evening's chat opener).

The point is not vanity metrics — it's *"help me understand me."* Every stat links back to the entries that produced it.

---

## 3. Architecture

### 3.1 Stack

| Layer | Choice | Why |
|---|---|---|
| App shell | **Tauri 2** (Rust core, system webview) | ~10 MB RAM tray app that can idle all day; native global shortcuts, tray, notifications, autostart via first-party plugins. An always-running Electron app would cost 300+ MB. |
| UI | **React + TypeScript + Vite**, Tailwind CSS | Fast to build, huge ecosystem, Claude Code is highly reliable with it. |
| Storage | **SQLite** via `tauri-plugin-sql` | Single local file (`ember.db`), zero setup, easy backup (it's just a file). |
| Charts | **Recharts** | Simple, good-looking line/bar charts. |
| AI | **Provider abstraction**: Anthropic API *or* any OpenAI-compatible local endpoint (Ollama, LM Studio) | Cloud quality when you want it, fully offline when you don't. Switchable in Settings. |

> **Fallback note:** if installing the Rust toolchain is a blocker, the same design ports 1:1 to Electron — only Phase 0/1 of the build plan changes. Tauri is worth it for an always-on tray app.

### 3.2 Windows & processes

- **Main window** — tabs: `Today` (chat), `Journal` (entry archive, calendar view), `Insights`, `Settings`. Closing it hides to tray; the app keeps running.
- **Capture bar** — a second, frameless, always-on-top, ~560×64 px window, hidden by default, toggled by the global hotkey or tray click. Auto-hides on blur/Enter/Esc.
- **Scheduler** — a lightweight timer loop (in the Rust core or main-window JS) that checks once a minute for: evening reminder time, weekly-review day, and "missed yesterday" state.

### 3.3 AI provider layer

```ts
interface AIProvider {
  chatStream(messages: Msg[], system: string, opts): AsyncIterable<string>; // streamed tokens
  complete(messages: Msg[], system: string, opts): Promise<string>;         // non-streamed (extraction, reviews)
}
```

- **AnthropicProvider** — calls `https://api.anthropic.com/v1/messages` with SSE streaming through Tauri's HTTP plugin (no CORS issues). Default model `claude-sonnet-5` for chat & journal writing; `claude-haiku-4-5-20251001` as a cheap option for extraction. API key stored via the OS keychain (`tauri-plugin-stronghold` or keyring) — never in plaintext config.
- **LocalProvider** — POSTs to a configurable base URL (default `http://localhost:11434/v1/chat/completions`) with the OpenAI schema, streaming. Model name free-text (e.g. `llama3.1:8b`, `qwen2.5:14b`).
- Settings let the user mix: e.g. local model for chat, cloud for the weekly review — but default is one provider for everything.
- **Cost reality check (Anthropic path):** a day is roughly one chat (~4–8k tokens in+out), one entry generation, one extraction — comfortably under a few cents/day on Sonnet.
- **Local reality check:** 8B-class models hold the counselor conversation acceptably but are noticeably weaker at extraction JSON discipline and at insight quality. The extractor prompt therefore demands strict JSON and the app validates/retries once on parse failure.

### 3.4 Privacy posture

- Everything lives in one local SQLite file under the user's app-data dir. No telemetry, no accounts, no sync.
- With the local provider selected, **nothing ever leaves the machine**.
- With Anthropic, only the minimum context is sent per call (see §5.3): today's captures, the current conversation, and the compact profile summary — never the raw full history.
- Settings includes **Export everything** (JSON + Markdown of all entries) and **Delete everything**.

---

## 4. Data model (SQLite)

```sql
-- Raw breadcrumbs dropped during the day
CREATE TABLE captures (
  id INTEGER PRIMARY KEY,
  created_at TEXT NOT NULL,            -- ISO 8601 local
  text TEXT NOT NULL,
  mood_emoji TEXT,                     -- optional, one of 5
  session_id INTEGER REFERENCES sessions(id)  -- set once consumed by a session
);

-- One evening conversation
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,           -- the day it covers, YYYY-MM-DD
  started_at TEXT, ended_at TEXT,
  status TEXT NOT NULL DEFAULT 'open'  -- open | wrapped | skipped
);

CREATE TABLE messages (
  id INTEGER PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES sessions(id),
  role TEXT NOT NULL,                  -- user | assistant
  content TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- The AI-written journal
CREATE TABLE entries (
  id INTEGER PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES sessions(id),
  date TEXT NOT NULL UNIQUE,
  narrative TEXT NOT NULL,             -- "The Day"
  highlights TEXT NOT NULL,            -- JSON array of bullets
  counselor_note TEXT NOT NULL,
  user_edited INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

-- Structured extraction from each day (fuels Insights)
CREATE TABLE day_metrics (
  id INTEGER PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  mood INTEGER, energy INTEGER,        -- 1..10, nullable if unclear
  summary_line TEXT,                   -- one sentence, used in chart tooltips
  raw_json TEXT NOT NULL               -- full extractor output for reprocessing
);

-- Long-term memory: one row per observed fact/pattern/habit/person
CREATE TABLE observations (
  id INTEGER PRIMARY KEY,
  kind TEXT NOT NULL,                  -- theme | habit | person | strength | struggle | fact
  key TEXT NOT NULL,                   -- canonical name, e.g. "gym", "vendor conflict", "Priya"
  detail TEXT,                         -- latest one-line context
  sentiment REAL,                      -- -1..1 rolling average
  occurrences INTEGER NOT NULL DEFAULT 1,
  first_seen TEXT NOT NULL, last_seen TEXT NOT NULL,
  pinned INTEGER NOT NULL DEFAULT 0,   -- user promoted to tracked habit
  UNIQUE(kind, key)
);

-- Compact rolling self-portrait, rewritten weekly (see §5.3)
CREATE TABLE profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  summary TEXT NOT NULL,               -- ≤400 words
  updated_at TEXT NOT NULL
);

CREATE TABLE weekly_reviews (
  id INTEGER PRIMARY KEY,
  week_start TEXT NOT NULL UNIQUE,     -- Monday YYYY-MM-DD
  letter TEXT NOT NULL,                -- the "week in review"
  strengths TEXT NOT NULL,             -- JSON: [{claim, evidence}]
  focus_areas TEXT NOT NULL,           -- JSON: [{claim, evidence}]
  created_at TEXT NOT NULL
);

CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
-- provider, model, api_base, reminder_time, hotkey, voice(1st/2nd person),
-- user_name, chat_length_preference, theme
```

---

## 5. AI design

### 5.1 The four AI jobs

| Job | When | Provider call | Prompt |
|---|---|---|---|
| **Counselor chat** | Evening session | streamed | §5.2 |
| **Journal writer** | On "wrap up" | non-streamed | §5.4 |
| **Extractor** | After entry saved | non-streamed, strict JSON | §5.5 |
| **Weekly reviewer** | Sunday (or 7 entries) | non-streamed | §5.6 |

### 5.2 Counselor system prompt (draft — tune in Phase 2)

```
You are Ember, {user_name}'s private evening companion. You are talking with
them at the end of their day, like a warm, sharp counselor who has known them
for a while. You are NOT a form and NOT a therapist replacement.

WHAT YOU KNOW
- About them (long-term): {profile_summary}
- Recently relevant patterns: {top_observations}
- Yesterday, briefly: {yesterday_summary_line}
- Today's quick notes they dropped (raw, timestamped): {todays_captures}

HOW YOU TALK
- Open by referencing something concrete from today's notes or a live pattern.
  If there are no notes, open gently: ask about the day's texture, not facts.
- ONE question per message. Short messages (1-3 sentences). Plain language.
- Follow their energy: if they give long answers, go deeper; if short, start
  wrapping up within 3-4 exchanges. Never interrogate.
- Reflect and connect: name feelings, link to past patterns ("that's the
  third Tuesday..."), but only when genuinely supported by what you know.
- Never lecture, never give unsolicited advice lists, never toxic positivity.
  It is fine to sit with a bad day without fixing it.
- If they mention self-harm or crisis, drop the format: respond with care and
  suggest real human support and local emergency resources.

WRAPPING UP
- After ~8-10 exchanges, or when they signal being done, summarize the day in
  one warm sentence and ask: "Want me to write today's entry?"
```

### 5.3 Memory: how it "keeps track of behaviours and habits"

Context for any chat = **three compact layers**, never the raw history:

1. **Profile summary** (≤400 words, `profile` table) — a rolling self-portrait: who the user is, life situation, ongoing threads, communication preferences. Rewritten weekly by the reviewer job (old summary + week's metrics in → new summary out).
2. **Top observations** — up to 15 rows from `observations`, ranked by recency × occurrences, rendered as lines like `habit:gym — 12×, last 2026-07-04, positive` .
3. **Today + yesterday** — today's captures verbatim; yesterday's `summary_line`.

This keeps every request small (≈1–2k tokens of context), works identically for cloud and local models, and degrades gracefully — a brand-new user just has empty layers.

### 5.4 Journal writer prompt (essentials)

- Input: today's captures + full session transcript + profile summary + voice setting.
- Output contract (JSON): `{narrative, highlights[], counselor_note, title}`.
- Rules baked into the prompt: *ground every sentence in something actually said; no invented events or feelings; narrative 150–300 words in the configured voice; counselor_note must contain one specific, evidence-based observation — if there's no real insight today, say something honest and small instead of manufacturing depth.*
- Regeneration passes the user's feedback note as an extra instruction.

### 5.5 Extractor prompt (essentials)

- Input: the saved entry + transcript. Output: **strict JSON only**:

```json
{
  "mood": 6, "energy": 4,
  "summary_line": "Draining vendor conflict, redeemed by a strong gym session.",
  "themes": [{"key": "vendor conflict", "sentiment": -0.6}],
  "habits": [{"key": "gym", "done": true}],
  "people": [{"key": "Priya", "sentiment": 0.3}],
  "strengths_shown": ["held boundary in a hard conversation"],
  "struggles_shown": ["ruminating after work hours"]
}
```

- App-side: validate with a schema; on failure retry once with the error appended; on second failure store metrics as null (never block saving the entry). Results upsert into `day_metrics` and `observations` (increment occurrences, rolling sentiment, canonicalize keys case-insensitively).

### 5.6 Weekly reviewer prompt (essentials)

- Input: 7 days of `day_metrics.raw_json` + current profile + current strengths/focus cards.
- Output JSON: `{letter, strengths:[{claim, evidence}], focus_areas:[{claim, evidence}], new_profile_summary}`.
- Rule: every claim must cite concrete evidence from the week ("4 of 5 low-mood days followed <6h sleep"), else omit it. Kind framing for focus areas — invitations, not verdicts.

---

## 6. Edge cases & guardrails

- **No captures today** → chat opens with a gentle generic opener; everything else works.
- **Missed day(s)** → next session asks one catch-up question, creates a `skipped` session for the gap (streak logic: a "skip" ends streaks, but insights never guilt-trip).
- **Ultra-short session** (user says "tired, gym, fine, bye") → journal writer produces an honest 3-sentence entry. Short entries are first-class.
- **AI/network failure mid-anything** → chat shows retry; if journal generation fails, offer a manual template (narrative box pre-filled with captures) so the day is never lost.
- **Two sessions same day** → reopen the wrapped session and append; regenerating the entry replaces it (with confirmation if user-edited).
- **Model switch mid-history** → all prompts are provider-agnostic; nothing breaks.
- **Wellbeing boundary** → the app is a reflection tool. Crisis language triggers the counselor prompt's care clause; Settings shows this policy plainly.

---

## 7. Build roadmap (what Claude Code builds, in order)

Each phase ends with something you can actually run. Full paste-ready prompts live in `CC_BUILD_PROMPTS.md`; the app repo's conventions live in `CLAUDE.md` (copy it into the new project root).

- **Phase 0 — Skeleton**: Tauri 2 + React + TS + Tailwind scaffold, SQLite migrations, tray icon, main window with empty tabs, Settings persistence.
- **Phase 1 — Capture**: global hotkey, capture bar window, captures stored & listed on Today tab. *(App is already useful here as a thought-logger.)*
- **Phase 2 — Chat**: provider layer (Anthropic + local), streaming chat UI, counselor prompt with captures context, wrap-up flow.
- **Phase 3 — Journal**: entry generation, review/edit/regenerate screen, Journal tab with calendar archive.
- **Phase 4 — Memory**: extractor, `observations`/`day_metrics` pipelines, profile injection into chat. *(This is when it starts to "know you".)*
- **Phase 5 — Insights**: dashboard charts, habit grid, strengths/focus cards, weekly review job.
- **Phase 6 — Polish**: reminders + snooze, autostart, streaks, export/delete, keychain for API key, first-run onboarding.

Build order rationale: value ships at every phase; risky integrations (global hotkey, streaming, JSON extraction) are isolated one per phase so failures are easy to localize.
