# The demo — runbook

**URL: https://postdated.vercel.app** · Print: https://postdated.vercel.app/summary

Three minutes. Rehearse it three times. The numbers below are what the app actually
produces — if a number on screen disagrees with this file, trust the screen and fix the
file.

## Before you walk up

- [ ] Print `/summary` at A4, portrait, 100% scale. Lay it on the judges' table.
- [ ] Open `postdated.vercel.app` on the phone. Load it once so the fonts are cached.
- [ ] Tap **Niva Bupa · ReAssure 2.0**, then run each of the three committed demo cases once:
      **Original worked case**, **Public photo sample**, and **Print-ready sample**.
- [ ] Phone on airplane-mode-off, screen brightness up, auto-rotate off.

## The path

| Time | What you do | What appears |
|---|---|---|
| **0:00–0:10** | Tap **Niva Bupa · ReAssure 2.0**. | Policy loaded. |
| **0:10–0:20** | Read the SMS aloud. *"₹1,73,000 disallowed."* Three weeks after discharge. File closed, doctor on leave. | — |
| **0:20–0:35** | Choose **Public photo sample** (live read when `CEREBRAS_API_KEY` is set) or **Original worked case**. | Reading the page… |
| **0:35–1:10** | Say nothing if it is a live read (~13s). Then read the provenance line aloud. | Letter. **03 Sept 2026** at the top. **₹1,73,000** in red. Five lines. *"Read live from the photograph"* or *"Preconfigured demo case"*. |
| **1:10–1:25** | Tap **₹85,000 — Indoor case papers not submitted**. Switch to **ಕನ್ನಡ**. Hold the phone up to your "ward clerk". | The Kannada ask, one instruction, large. |
| **1:25–1:40** | Check the three **Before you sign** boxes, then confirm **The ward handed it over**. | The app asks for the amended page. |
| **1:40–1:55** | Tap **Run the amended demo scan**. | Final-result screen. **₹1,73,000 → ₹88,000.** Approved rises to **₹1,52,000**. The ₹85,000 line goes green and strikes through. |
| **1:50–2:10** | The honesty beat. Read it off the coverage panel. | 4 / 12 / 8 |
| **2:10–2:40** | Scroll to the guard. Ask a judge for a clinical fact. Tap their phrase or type it. | **BLOCKED**, the term named, converted to ASK THE DOCTOR. |
| **2:40–3:00** | ₹40 per pre-auth file. 70,000+ private hospitals. One buyer, named. | Static mock — spoken, not built. |

## The numbers, so you never guess on stage

```
Claimed                    ₹2,40,000
Approved (before)             ₹67,000
Disallowed (before)        ₹1,73,000

  Bucket A — gone            ₹48,000
    ₹12,000  room rent excess (₹8,000/night billed, ₹5,000 elected)
    ₹21,000  proportionate deduction on the other three heads
    ₹15,000  non-payable consumables

  Bucket C — fixable       ₹1,25,000
    ₹85,000  indoor case papers not submitted
    ₹40,000  admission necessity not established

After the doctor signs      ₹88,000 disallowed · ₹1,52,000 approved
```

**Where ₹21,000 comes from, if asked.** ₹5,000 ÷ ₹8,000 = 62.5% payable. Applied to
nursing (₹12,000), practitioners' fees (₹30,000) and OT (₹14,000) — ₹56,000 × 37.5%.
Room rent is charged as the plain difference instead, because the clause says the ratio
applies "in addition to the difference in room rent."

**Why pharmacy, implants, diagnostics and anaesthesia are untouched.** Niva's clause
names a closed list of four heads with no "etc." The first three are named exclusions;
anaesthesia is out because the list is closed. HDFC Ergo's wording would hit anaesthesia.
Star Health's says "etc.", which is why we did not lead with Star — you would be choosing
what "etc." means, and that choice would be the arithmetic.

## The lines to say exactly

**Bucket A, after the total falls:**
> "₹48,000 we cannot recover — the room was chosen four days ago. We show that too."

**The honesty beat:**
> "We hand-read 40 Ombudsman awards. Twenty-four grounds. The three biggest —
> pre-existing disease, non-disclosure, lapsed premium — are 26 of those 40, and we
> cannot see a single one of them. They need the proposal form, not the discharge
> summary.
>
> So we don't forecast repudiation. Those claims are already lost, and they're already
> litigated. We forecast **deduction** — the 10–40% shaved off claims that *do* get paid.
> One award: ₹28,000 cut from ₹69,511 for disposables and devices. Of the grounds that
> produce those, we see four fully and twelve partially."

**Volunteer this before anyone asks:**
> "The published awards run 2004 to 2014. Nothing after about 2016 exists to read."

**The architecture line, while the letter is on screen:**
> "The arithmetic never touches the model. Cerebras reads the photograph. A deterministic
> function computes every rupee, and the insurer's clause is quotable next to the code."

**Calibration, unprompted:**
> "This is a model reasoning like a TPA medical officer, not a model trained on real
> approve/deny pairs — the payers hold those. Our false-green rate is unmeasured, and
> we say so."

**The PED micro-beat:**
> "We can't tell you whether they'll reject it. We can tell you the exact sentence in
> your own paperwork they'll use to do it." → *k/c/o DM since 15 years*

## Never say

- **"Looting."** The hospital is on your side on Bucket C. Say: *"most of what families
  lose isn't stolen — it's dropped."*
- **Any percentage the model produced.** Literal counts only.
- **"Calibrated," "accurate to X%," "trained on."**
- Never imply the app writes a clinical sentence. It demands documents and it asks the
  doctor. That is all it does.

## If it breaks

| Failure | Do this |
|---|---|
| Camera won't open | Tap **Original worked case**. Say: "this is the hand-checked case; the photo and custom upload paths use the same forecast code." |
| Live read slow, wrong, or unconfigured | Do **not** pretend a custom photo became the seeded case. Run **Original worked case** or **Print-ready sample**. If someone asks, say the live path needs `CEREBRAS_API_KEY` on the server. |
| No network at all | Seeded and print-ready cases work with no network once the page is loaded. |
| Guard misbehaves on a judge's phrase | Tap one of the three chips instead. §14 permits demonstrating the rule on a known phrase. |
| A judge says "fever is right there on the page" | **This is the best question you will get.** The record says *"No history of fever or jaundice."* The guard reads negation — it quotes that sentence back at you on screen. Point at it. |

## Measured, not hoped for

The live path was run end to end against a photograph of the printed page — rotated,
dimmed and softened to approximate a phone shot at an angle under bad light:

```
letter rendered in 16.9s   (12.8s server-side, rest is upload + render)
claimed ₹2,40,000 · approved ₹67,000 · disallowed ₹1,73,000
five lines, all correct
```

**Budget ~13 seconds of silence** while it reads. That is inside §13's 0:35–1:10 beat, but
it is longer than it feels on stage — do not fill it, and do not tap anything.

The live read phrases two lines slightly better than the seeded fixture does:

- *"Indoor case papers (day-by-day nursing and treatment record) not submitted"*
- *"Summary does not establish: why inpatient admission of 4 nights was required"*

If the wording on screen differs from this file, the live read won. That is fine.

## Known gaps — own them if asked

- The Kannada and Hindi strings have not been checked by a native speaker.
- Bucket C exposure figures (₹85,000 / ₹40,000) are seeded, not derived. Say so if
  pressed: the clause arithmetic is computed, the exposure is the payer's assertion.
- No pre-auth indicator was built. It is spoken over a static mock, deliberately —
  see BUILD-TODAY.md's cut list.
