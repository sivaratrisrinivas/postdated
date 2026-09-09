# postdated

> *We send you the insurance rejection letter three weeks before the insurer does — while the doctor
> is still in the building and the paperwork can still be fixed.*

Built for the Push to Prod hackathon (Anthropic × Elevation Capital, Bengaluru, 8 Aug 2026).
Hacking window 11:30–16:30 IST; **feature freeze 15:30**.

## Read first

- **[POSTDATED.md](./POSTDATED.md)** — the spec. Concept, architecture, MVP scope and explicit
  non-goals (§10), the build plan (§11), the demo script (§13). Read §9 before writing any code
  that generates text.
- **[CONTEXT.md](./CONTEXT.md)** — the glossary, including the words we deliberately do not use.
- **`research/`** — primary-source findings: the Ombudsman repudiation-ground taxonomy and the
  per-insurer policy parameters the deterministic calculator loads.

**The one rule that overrides everything:** the system never writes a clinical fact. It demands
documents and it asks the doctor. See §9.

## Agent skills

### Issue tracker

Issues live as GitHub issues in `sivaratrisrinivas/postdated`, managed with the `gh` CLI. See `agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, using their default label strings. See `agents/triage-labels.md`.

### Domain docs

Single-context — one `CONTEXT.md` and `adr/`. See `agents/domain.md`.
