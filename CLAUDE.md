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

### 2026-05-08
- **feat(company-insider.html):** New tool — The Translator Machine. Input company name + optional role; Claude searches Glassdoor, Reddit, and recent news via web search and outputs a "Company Insider" cheat sheet with They Say vs. Reality decoder, culture signals, interview questions, red/green flags, recent developments, and compensation intel
- **feat(index.html):** Added The Translator card to the hub grid
- **fix(functions/api/analyze.js):** Worker now streams the raw Anthropic response text instead of re-parsing as JSON, preserving non-200 status codes; error responses now always include `Access-Control-Allow-Origin: *` so browser CORS checks don't swallow API error bodies
- **fix(fraud-job-detector.html):** Updated model ID from `claude-sonnet-4-20250514` to `claude-sonnet-4-6` (correct current model identifier)
