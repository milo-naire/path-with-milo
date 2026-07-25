# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

**Path with Milo** is a 2026 Career Charter System — a suite of AI-powered career guidance tools. It is plain HTML/CSS/JavaScript with a single Cloudflare Workers backend function. There is no build step, no bundler, and no package manager.

## Development & Deployment

**Local dev** (requires Wrangler CLI):
```
npx wrangler dev
```

**Deploy to Cloudflare:**
```
npx wrangler deploy
```

**Environment variable** — set `ANTHROPIC_API_KEY` in Cloudflare Workers dashboard (or `.dev.vars` locally). It is never in any HTML file; the Workers function (`functions/api/analyze.js`) injects it server-side.

## Architecture

```
index.html              → Hub/landing page linking to all tools
fraud-job-detector.html → JobSentry: AI fraud detection for job postings
compass.html            → The Compass: 90-day career planning simulator
whisperer.html          → The Whisperer: networking tool (planned, not yet built)

functions/api/analyze.js → Cloudflare Worker: ANTHROPIC_API_KEY proxy to Anthropic API
wrangler.toml            → Worker config; static assets served via env.ASSETS binding
employername.json        → 6 MB company name database (used for employer lookups)
```

The Worker at `/api/analyze` is a thin proxy: it receives POST requests from the browser, forwards them verbatim to `https://api.anthropic.com/v1/messages` (adding the API key and required headers), and returns the response. All AI prompt engineering lives in the HTML files themselves.

The `web-search-2025-03-05` beta header is active, enabling Claude's web search tool for company verification in JobSentry.

## Design System

All pages share a unified visual language. Use these CSS variables — don't hardcode hex values.

**Color roles:**
| Variable | Hex | Use |
|---|---|---|
| `--amber` / `--milo-amber` | `#FFB347` | Primary CTAs, headings, key accents only |
| `--slate` / `--milo-slate` | `#34495E` | All borders, card outlines, input rings |
| `--bg-base` / `--milo-bg` | `#0F0E0D` | Page background |
| `--green` | `#88D4AB` | Legitimate / safe signals |
| `--red` / `--red-accent` | `#E05C47` | Fraud / danger signals |
| `--teal` | `#4ECDC4` | Informational / secondary signals |

**Typography:**
- **Sora** — headings and display text (`--serif`)
- **Inter** — body, UI, labels (`--sans`, `--mono`)
- Loaded from Google Fonts with variable weight ranges (`100..900`)

**Amber is reserved** — it signals primary action or key emphasis only. Status states use green/amber/red.

## AI Prompt Structure (JobSentry)

The fraud detector in `fraud-job-detector.html` sends a structured system prompt to Claude that enforces a strict JSON response schema with these top-level keys: `verdict`, `fraudScore`, `redFlags`, `legitimacySignals`, `signalBreakdown`, `companyVerification`, `salaryAnalysis`, `dataPrivacyAudit`, and `betterPath`. The six signals in `signalBreakdown` are: Compensation Claims, Company Legitimacy, Contact Quality, Language & Pressure, Personal Data Requests, Job Clarity.

When editing the AI prompt, preserve this JSON schema — the frontend JS parses it directly by key name.

## AI Prompt Structure (The Translator / Company Insider)

`company-insider.html` sends a structured system prompt that enforces this JSON response schema: `companyName`, `roleFocus`, `overallVibe`, `vibeScore`, `oneLiner`, `theyVsReality`, `whatTheyCareAbout`, `interviewQuestions`, `redFlags`, `greenFlags`, `recentDevelopments`, `compensationIntel`, `insiderSummary`, `shouldApply`. The tool uses the same `web_search_20250305` beta and agentic loop as JobSentry. `overallVibe` is one of `THRIVING | MIXED | TROUBLED`. `shouldApply` is one of `APPLY | PROCEED WITH CAUTION | INVESTIGATE MORE`.

When editing the AI prompt, preserve this JSON schema — the frontend JS parses it directly by key name.

## Changelog

### 2026-07-25
- **fix(compass.html):** Fixed "Unexpected end of JSON input" simulation error caused by the Claude Sonnet 5 migration — Sonnet 5 defaults to adaptive thinking ON when the `thinking` parameter is omitted (Sonnet 4.6 defaulted OFF), so `data.content[0]` could be a `thinking` block instead of `text`, leaving `raw` empty and `JSON.parse("")` throwing. Added `thinking: { type: "disabled" }` to the request payload (compass doesn't need reasoning for structured JSON extraction) and hardened the response parser to find the first `type: "text"` block instead of blindly indexing `content[0]`.

### 2026-07-24
- **fix(compass.html, fraud-job-detector.html, company-insider.html, experience-translator.html):** Updated Anthropic model ID from `claude-sonnet-4-20250514`/`claude-sonnet-4-6` to `claude-sonnet-5` across all four tools' API calls.

### 2026-05-23
- **feat(experience-translator.html):** Inline bullet editing — each translated bullet now has an Edit button that opens an inline textarea pre-filled with the current text; Save commits the change, Cancel discards it. `copyAll` selector updated from `[id^="bt-"]` to `.bullet-trans-text` to exclude the new edit textareas.
- **fix(experience-translator.html):** Renamed `translate()` to `runTranslate()` — `translate` is a built-in `HTMLElement` DOM property, so `onclick="translate()"` inside an inline handler's `with(this)` scope resolved to the button's boolean `.translate` attribute instead of the global function, silently throwing a TypeError and doing nothing.

### 2026-05-11
- **fix(fraud-job-detector.html):** Input card border changed to amber all around (was slate/blue with only the top edge amber via `::before`); border-color set to `rgba(212,136,42,0.4)` on `.input-section.card`.
- **fix(fraud-job-detector.html):** Progress indicator now completes to 4/4 — added `safeRenderProgress(4, 'Analysis complete.')` call after parsing, so the final "Scoring fraud signals" step shows a checkmark instead of staying in the active/spinning state.
- **fix(fraud-job-detector.html):** Removed "salary benchmarks 2026" from the terminal status animation loop (`statusQueries` array), eliminating salary benchmark messaging during analysis.

### 2026-05-09
- **refactor(fraud-job-detector.html):** Removed PayAudit mode entirely (UI tab, HTML results section, JS prompt/functions). Removed market-rate pay comparison as a fraud signal; Compensation Claims signal now only flags actual fraud patterns (income guarantees, commission-only, sub-minimum-wage pay). Below-market pay alone no longer contributes to the fraud score.
- **refactor(fraud-job-detector.html):** Commented out FILTER 3 (salary benchmark reference tables) from the JobSentry system prompt. The freelance and full-time market rate ranges are no longer sent to Claude during analysis.

### 2026-05-08 (5)
- **feat(fraud-job-detector.html):** Added full DOL/court FLSA primary beneficiary test (all 7 factors + exempt-category footnotes) as a dedicated section in the PayAudit system prompt. Applied to every unpaid posting. Student-detected postings additionally score the posting against all 7 factors and report results in `nonprofitNote`.

### 2026-05-08 (4)
- **feat(fraud-job-detector.html):** PayAudit now loads `approved-employers.json` at page start and injects the list into the system prompt at audit time. Employers matching the list are treated as COMPLIANT UNPAID. JSON key is the raw Google Form question text (`Q8 - COMPANY/ORGANIZATION NAME:`); header/test rows are filtered out automatically.

### 2026-05-08 (3)
- **fix(fraud-job-detector.html):** PayAudit UI fixes — purple border consistency across input card and all result panels in payaudit mode; fraud flags margin-top added to fix overlap with lump sum breakdown; example buttons hidden in payaudit mode; ⓘ hover tooltip added to mode switcher explaining the difference between JobSentry and PayAudit; PayAudit prompt updated with student audience detection (FLSA primary beneficiary test, student-friendly language in actionableNote, `isStudentPosting` JSON field)

### 2026-05-08 (2)
- **feat(fraud-job-detector.html):** Added PayAudit — a second agent mode toggled by a mode switcher inside the input card. PayAudit analyzes job listing compensation against 2026 market rates, classifies pay as PAID/UNPAID/COMMISSION, issues a verdict (FAIR MARKET PAID / BELOW MARKET PAID / EXPLOITATION RISK / COMPLIANT UNPAID / COMMISSION ONLY / FRAUDULENT), performs lump-sum hourly math breakdown, flags identity-for-pay fraud, and checks nonprofit/educational legitimacy for unpaid roles. Visual branding: JobSentry mode shows amber/orange top accent; PayAudit mode shifts to deep purple (`--purple: #9B6DFF`) across the card accent, analyze button, progress steps, and search terminal. The "Audit" toggle button turns purple on hover/active.

### 2026-05-08
- **feat(company-insider.html):** New tool — The Translator Machine. Input company name + optional role; Claude searches Glassdoor, Reddit, and recent news via web search and outputs a "Company Insider" cheat sheet with They Say vs. Reality decoder, culture signals, interview questions, red/green flags, recent developments, and compensation intel
- **feat(index.html):** Added The Translator card to the hub grid
- **fix(functions/api/analyze.js):** Worker now streams the raw Anthropic response text instead of re-parsing as JSON, preserving non-200 status codes; error responses now always include `Access-Control-Allow-Origin: *` so browser CORS checks don't swallow API error bodies
- **fix(fraud-job-detector.html):** Updated model ID from `claude-sonnet-4-20250514` to `claude-sonnet-4-6` (correct current model identifier)
