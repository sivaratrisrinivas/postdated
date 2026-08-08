# POSTDATED

> **We send you the insurance rejection letter three weeks before the insurer does —
> while the doctor is still in the building and the paperwork can still be fixed.**

**Live: [postdated.vercel.app](https://postdated.vercel.app)** ·
Printable case: [/summary](https://postdated.vercel.app/summary)

Built for Push to Prod (Anthropic × Elevation Capital, Bengaluru, 8 Aug 2026).

---

## The problem

Ravi's father has his gallbladder removed. Four nights, ₹2,40,000. The policy covers
₹5,00,000, so Ravi assumes he's fine. Three weeks later: **₹1,73,000 disallowed.**

Split the loss by cause and the whole product falls out of it:

| | | |
|---|---|---|
| **₹48,000** | He agreed to it and never read it — room-rent excess, proportionate deduction, non-payable consumables | **Gone.** The room was chosen four days ago. |
| **₹1,25,000** | A form was incomplete — two missing documents and one sentence the doctor never wrote | **Recoverable**, for about forty more minutes |

Nobody in that story did anything wrong. Three parties are at the table and only one has
never seen the rules — and that one carries all the loss.

Every existing player acts *after* rejection. Nobody occupies the forty-minute window at
the discharge counter, which is the only moment the document is still editable and the
doctor is still reachable. That time-shift is the whole wedge.

## What it does

Photograph the discharge summary at the counter. The future denial letter renders,
dated ~26 days ahead, itemised in rupees. Tap a red line and you get the physical ask —
in English, Kannada or Hindi, sized to hold up to a ward clerk. The doctor writes the
line in and signs it; the letter shrinks and the total falls.

**The new interaction primitive: a future consequence becomes a present, editable
artefact.** You don't receive advice. You receive the adversary's own letter, and you
edit the past until the letter changes.

## The one rule that overrides everything

**The system never writes a clinical fact.** It has exactly two output types — a demand
for a document, and a question only the treating doctor can answer and sign. Anything
else is upcoding-as-a-service.

`lib/guard.ts` enforces it. Every clinical noun in any generated output must appear,
un-negated, in the photographed record or on a doctor-confirmed list; anything else is
blocked and converted into a red `ASK THE DOCTOR` item. It reads negation, so the
seeded summary's *"No history of fever or jaundice"* is not treated as licence to assert
either. The refusal is a demo beat, not an error path.

## Where the line between Claude and code sits

**Arithmetic never touches the model**, and we say that on stage.

| Deterministic code | Claude |
|---|---|
| The proportionate-deduction ratio and every rupee | Reading a photographed 9pt three-page summary |
| Sub-limits, co-pay, consumable matching | Judging what a specific payer will find unestablished |
| Letter versioning and the diff | Writing in a TPA's bureaucratic register |
| **The fabrication guard** | — |

Remove Claude and the product does not degrade, it does not exist: there is no API for a
photographed discharge summary, no structured feed of 40-page policy wordings, and no
rules engine that can judge whether a clinical narrative satisfies a payer's medical
officer.

## What is honest about the numbers

- The deduction arithmetic implements **Niva Bupa ReAssure 2.0** as written. Its clause
  names a closed list of four heads — room rent, nursing, practitioners' fees, operation
  theatre — with no "etc.", so every bill line maps to in-scope or out-of-scope with zero
  judgement. That is why it was chosen to lead with. See `docs/research/policy-parameters.md`.
- ReAssure 2.0 imposes **no room-rent cap by default**. The cap exists only because the
  seeded policy schedule elects Room Type Modification (§4.21). Without that election
  there is no ratio and no Bucket A — a test pins that.
- We report **coverage against 40 hand-read public Ombudsman awards**, not accuracy. 24
  grounds: 4 we see fully, 12 partially, 8 not at all. The three largest grounds are
  among the 8, because they need the proposal form. So this forecasts **deduction**, not
  repudiation.
- The forecast is Claude reasoning like a TPA medical officer, **not calibrated** on real
  approve/deny pairs — the payers hold those. The false-green rate is unmeasured.
- The letter is watermarked **PREDICTED — NOT ISSUED BY NIVA BUPA**.

## Repo

| Path | |
|---|---|
| `DEMO.md` | The runbook — click path, every number, the exact stage words, contingencies |
| `POSTDATED.md` | The spec. §9 before writing any generating code |
| `BUILD-TODAY.md` | The solo plan that superseded §11 |
| `CONTEXT.md` | Glossary, including the four phrasings that are banned and why |
| `docs/research/` | Two primary-source passes: policy parameters, Ombudsman grounds |
| `lib/deduct.ts` | All of the arithmetic. 13 tests |
| `lib/guard.ts` | The fabrication guard. 14 tests |
| `app/api/extract/route.ts` | The one live model call. Key stays server-side |

## Running it

```sh
npm install
echo 'ANTHROPIC_API_KEY=sk-ant-...' > .env.local   # or: vercel env pull .env.local
npm run dev
npm test
```

Without a key the extract route falls back to the committed fixture rather than failing —
the demo runs either way.
