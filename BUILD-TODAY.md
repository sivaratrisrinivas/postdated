# BUILD TODAY — solo, re-anchored 12:50

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

## Still true, still non-negotiable

- The system **never writes a clinical fact** (§9). Document demands and doctor-questions only.
- **Arithmetic never touches the model** — and you say so on stage (§7).
- **No model-emitted percentages.** Literal counts only (§12).
- **Never claim calibration.** False-green rate is unmeasured; say it (§12).
- Watermark the letter **PREDICTED — NOT ISSUED BY [TPA]**. One line, closes the only awkward
  question §9 doesn't already pre-empt.
