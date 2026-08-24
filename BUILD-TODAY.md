# BUILD TODAY — solo, re-anchored 12:50

**Shipped reader (after the freeze):** the live photograph call is Cerebras
`gemma-4-31b` behind `CEREBRAS_API_KEY`, not Claude. This file is the day's cut
list. Do not treat "Claude vision" below as the running stack.

**This supersedes POSTDATED.md §11 for today.** §11 assumes three engineers and a 11:30 start
(~12 usable engineer-hours). Reality: one person, 12:50 start, freeze 15:30 — **2h40m ≈ 2.7
engineer-hours, 22% of the plan.** So the plan is cut to a fifth. Everything below is ordered by
what the demo cannot survive without.

## Cut list — decided now, not at 15:15

| Cut | Why it's survivable |
|---|---|
| ❌ **The whole B2B pre-auth act** (dialect card, query-frequency indicator) | The expensive one. §11 warns this is what dies under pressure — it dies anyway at 22% capacity. **Mitigation: say it, don't build it.** §13's 2:40–3:00 beat is *words* — ₹40/file, 70,000 hospitals, one buyer named. Words are free. Pitch the business over a static mock. |
| ❌ **HTML→PDF pipeline** | §14 already blesses this: *"the date is the idea, not the letterhead."* Styled HTML on screen. |
| ❌ **Grey-out animation** | Strikethrough + a number that changes is the same beat at 5% of the cost. |
| ❌ **Runtime translation** | Kannada ask sheet stays — as three hardcoded pre-translated strings in the seeded case. Keep the beat, lose the machinery. |
| ❌ **3 insurers** | One. Whichever the research agent says parses cleanest. |

## Free — costs zero build time

- **The ombudsman coverage beat (§12).** A background agent is producing the taxonomy right now.
  Highest credibility-per-minute in the demo. Keep it.
- **The Bucket A honesty line.** *"₹48,000 we cannot recover — the room was chosen four days ago."*
  One line of copy, and it's why the audience believes the other numbers.

## The order

Timeboxed. **If a box overruns by 10 minutes, cut its stretch goal and move on** — a demo missing
one beat beats a demo that doesn't run.

| Time | Build | If it slips |
|---|---|---|
| **12:55–13:05** | **Deploy a hello-world to a public URL.** Vercel/CF Pages. | Nothing else works without this — the demo is a *phone photographing paper*. `localhost` = no demo. §11 has no deploy task; this is the gap. |
| **13:05–13:45** | Photo upload → Claude vision → **strict JSON**. **Commit a fixture the moment the first good response lands.** | The fixture is the insurance policy. Everything downstream builds against it, so venue wifi can die and the demo still runs. |
| **13:45–14:10** | Deterministic deduction from seeded policy params → rupee roll-up. | Hardcode the params if the research file isn't in yet. |
| **14:10–14:50** | **The letter.** Forward-dated ~26 days, letterhead-styled, 4 itemised red lines with rupees. | This is the hero. Nothing after it matters more. |
| **14:50–15:10** | Re-shoot → diff → total falls, fixed lines struck through. | **This is the new primitive.** If only one of "letter" and "diff" can exist, it's still both — this is the beat that makes it a product rather than a calculator. |
| **15:10–15:25** | **Fabrication guard** + the refusal path. | §9 makes the refusal a mandatory demo beat. §14 permits hardcoding the refusal for the demoed phrase — take that permission if the clock is red. |
| **15:25–15:30** | **FREEZE.** | Nothing new after this. |
| **15:30–16:15** | Rehearse ×3. Print the discharge summary. Stage the doctor beat. | Non-negotiable. §11 allotted 45 min for this with 3 people; solo it matters more, not less. |
| **16:15–16:30** | Submit. | |

## Two things solo changes for the better

- **The vision→JSON seam is no longer a risk.** With three engineers it was the #1 integration
  failure; with one head there's no contract to negotiate.
- **No `/to-tickets`.** GitHub Issues is configured and correct for this repo's life, but 15 issues
  for one person over 160 minutes is pure overhead — assignment exists to prevent collisions, and
  there's no one to collide with. This file is the ticket list.

## The honesty beat, revised — research came back different

§12 hoped for *"14 grounds, our checklist fires on 12."* The actual hand-read of 40 Ombudsman
awards (`docs/research/ombudsman-repudiation-grounds.md`) says **24 grounds — 4 YES, 12 PARTIAL,
8 NO**, and the three largest by volume are all NO:

| Ground | Awards | Detectable? |
|---|---|---|
| Pre-existing disease | 15 / 40 | **No** — needs the proposal form |
| Non-disclosure at proposal | 6 / 40 | **No** — needs the proposal form |
| Break in continuity / premium lapse | 5 / 40 | **No** — needs the inception date |

26 of 40 awards, invisible from a discharge summary. Put the original slide up and a judge does
the arithmetic against you.

**The reframe — and it is the honest one.** The Ombudsman corpus is *disputes*: full repudiations
severe enough that someone spent 18 months escalating. That is a different population from the one
this product serves — **partial disallowances on claims that get paid**, which nobody escalates
because ₹1.25L isn't worth 18 months. The corpus was measuring the wrong thing, and finding that
out is the result.

> **Say this:** "We hand-read 40 Ombudsman awards. Twenty-four grounds. The three biggest —
> pre-existing disease, non-disclosure, lapsed premium — are 26 of those 40, and we cannot see a
> single one of them. They need the proposal form, not the discharge summary.
>
> So we don't forecast repudiation. Those claims are already lost, and they're already litigated.
> We forecast **deduction** — the 10–40% shaved off claims that *do* get paid. One award: ₹28,000
> cut from ₹69,511 for disposables and devices. Of the grounds that produce those, we see four
> fully and twelve partially."

That is a smaller claim than §12 planned and a much harder one to knock over. Volunteering the miss
is the entire move.

**Volunteer the date range too:** the published awards run 2004–2014; nothing after ~2016 exists
to read (Book21+ is 404). Say it before someone asks.

**Free micro-beat, ~15 min, add it back first if a box comes in early:** the product cannot
*adjudicate* pre-existing disease, but it can detect the **trigger phrase** — insurers lift
`k/c/o DM since 15 years` verbatim out of the summary to justify a PED repudiation. So:
*"we can't tell you whether they'll reject it — we can tell you the exact sentence in your own
paperwork they'll use to do it."* Cheap, and it's the most striking line the product can produce.

## One correction to the order above

Timebox the vision step to **15 minutes, not 40**. Its real job is to produce **one good JSON
output that becomes the committed fixture**. If it isn't producing usable JSON by then, hand-write
the fixture and move on — everything downstream builds against the fixture either way, and the
letter is the hero. You want a demoable artefact by 14:30, not a perfect parser by 15:20.

## Still true, still non-negotiable

- The system **never writes a clinical fact** (§9). Document demands and doctor-questions only.
- **Arithmetic never touches the model** — and you say so on stage (§7).
- **No model-emitted percentages.** Literal counts only (§12).
- **Never claim calibration.** False-green rate is unmeasured; say it (§12).
- Watermark the letter **PREDICTED — NOT ISSUED BY [TPA]**. One line, closes the only awkward
  question §9 doesn't already pre-empt.
