# POSTDATED — Full Handoff

> **Purpose of this file.** A complete, self-contained brief for the product concept "POSTDATED,"
> produced for the Push to Prod hackathon (Anthropic × Elevation Capital, Bengaluru, 8 Aug 2026).
> Written so a fresh session with zero prior context can pick it up and build, pitch, or critique it.
> Nothing here depends on the earlier conversation.

**Status:** original hackathon brief. The running app is built; this file is the concept, not the
stack card.
**Shipped reader:** Cerebras Chat Completions, model `gemma-4-31b`, env `CEREBRAS_API_KEY`.
Arithmetic stays in `lib/deduct.ts`. Sections below still say "Claude" because that was the
planned model on 8 Aug 2026. The product does not call Anthropic.
**One line:** *We send you the insurance rejection letter three weeks before the insurer does — while the doctor is still in the building and the paperwork can still be fixed.*

---

## Table of contents

1. [The 60-second explanation](#1-the-60-second-explanation)
2. [The problem, precisely](#2-the-problem-precisely)
3. [Why nobody has fixed it](#3-why-nobody-has-fixed-it)
4. [WHAT the product is](#4-what-the-product-is)
5. [WHO it is for and who pays](#5-who-it-is-for-and-who-pays)
6. [HOW it works — user flow](#6-how-it-works--user-flow)
7. [HOW it works — technical architecture](#7-how-it-works--technical-architecture)
8. [Why Claude specifically](#8-why-claude-specifically)
9. [Ethical boundaries — non-negotiable](#9-ethical-boundaries--non-negotiable)
10. [MVP scope and explicit non-goals](#10-mvp-scope-and-explicit-non-goals)
11. [Five-hour build plan](#11-five-hour-build-plan)
12. [Ground truth and evaluation](#12-ground-truth-and-evaluation)
13. [Three-minute demo script](#13-three-minute-demo-script)
14. [Demo contingencies](#14-demo-contingencies)
15. [Risks and the strongest attacks](#15-risks-and-the-strongest-attacks)
16. [Business model and market](#16-business-model-and-market)
17. [Pitch lines](#17-pitch-lines)
18. [Hackathon context](#18-hackathon-context)
19. [Open questions to resolve](#19-open-questions-to-resolve)
20. [Appendix A — runners-up](#appendix-a--runners-up)
21. [Appendix B — how this was generated](#appendix-b--how-this-was-generated)

---

## 1. The 60-second explanation

Use the school analogy. It lands every time.

> You hand in a big school project. Three weeks later it comes back: **14/25.** The red pen says
> "no cover page, minus 3", "no sources listed, minus 5". You didn't do a bad project — you lost
> marks on things you didn't know were being counted. It was all in the rules sheet from June that
> nobody reads. And every one of those fixes would have taken ten minutes, if you'd known.
>
> Now imagine that at the teacher's desk, *before* you hand it in, you photograph your project and
> your phone shows you the marked sheet from three weeks in the future — red pen and all. You step
> aside, scribble a cover page, add your sources, two minutes, and hand it in. **22/25.**
>
> You didn't get smarter. You found out early enough to act.

Swap the words and you have the product:

| School | Real life |
|---|---|
| Your project | The hospital discharge paperwork |
| The teacher | The insurance company / TPA |
| The rules sheet nobody read | The 40-page policy wording nobody reads |
| Marks cut | Money not paid |
| Three weeks later, too late | Three weeks later, too late |
| Standing at the desk, pen in hand | Standing at the discharge counter, doctor still in the building |
| Scribble a cover page | Ask the ward for two documents |

**How does it "know the future"?** No magic. Two boring reasons: (1) it read the policy wording
you didn't, and (2) it has seen the patterns of what this payer always rejects. It is the friend
who has been in that class for ten years saying *"she's going to kill you on the sources."*

---

## 2. The problem, precisely

### The worked example ("Ravi")

Ravi's 71-year-old father has his gallbladder removed at a private hospital in Bengaluru. Four
nights. Final bill **₹2,40,000**. The policy covers ₹5,00,000, so Ravi assumes he's fine.

Three weeks later: **₹1,73,000 disallowed. Approved: ₹67,000.**

```
        TPA — CLAIM DECISION
        Date: 30 August 2026

        Claimed        ₹2,40,000
        Approved         ₹67,000
        DISALLOWED    ₹1,73,000

  ✗ ₹85,000  Indoor case papers not submitted
  ✗ ₹40,000  Summary does not establish why inpatient admission was required
  ✗ ₹30,000  Room rent exceeds policy limit (proportionate deduction applied)
  ✗ ₹18,000  Non-payable consumables
```

### Split the loss by cause — this is the core insight

**Bucket A — he agreed to it and never read it. ₹48,000.**
Room-rent sub-limit (he took a ₹9,000/night room on a ₹5,000/night policy, which triggers a
proportionate cut across the *whole* bill) plus non-payable consumables (gloves, syringes, PPE).
Nobody cheated. The contract worked exactly as written against someone who never read it.
**Unrecoverable at discharge.** Gone the moment the room was chosen.

**Bucket B — the hospital was indifferent.** They put his father in the expensive room without
asking what his policy allowed. They deal with sub-limits daily. They didn't lie; they had no
reason to ask, because they get paid either way. Costs the same as malice.

**Bucket C — a form was incomplete. ₹1,25,000. That is 72% of the total loss.**
Missing ward notes ("indoor case papers") and one sentence the doctor never wrote. Read that
again: **nobody in this story did anything wrong**, and ₹1,25,000 evaporated because a piece of
paper was thin.

### The real human truth

It is **not** primarily "hospitals and insurers loot people." It is:

> **Three parties are at the table. Only one of them has never seen the rules — and that one
> carries all the loss.**

The hospital knows the rules. The insurer wrote the rules. The family is the only party in the
building who has never read them and the only party whose money is at risk. That is worse than
theft, because there is nobody to be angry at.

### Why the product is aimed at Bucket C only

Test: **knowing does not get you the money back.** An app that said at 4 PM *"you will lose
₹1,73,000"* and nothing else would make Ravi feel sick and change nothing — Bucket A is already
spent, the room cannot be un-taken.

Bucket C is the **only part still moveable at 4 PM**, and its deadline is roughly forty minutes.
Two documents and one sentence. ₹1,25,000.

> A coverage calculator says *"you'll lose this."*
> POSTDATED says *"go upstairs, ask for this, and you won't."*

### The moment (state it exactly, never as a category)

Saturday 4 PM, discharge counter, mid-tier Bengaluru private hospital. Papers in hand. Doctor
still on the floor. Ward records still retrievable. Forty minutes until everyone disperses and the
file becomes read-only forever.

---

## 3. Why nobody has fixed it

- **Every existing player acts after rejection.** ClaimBuddy-class companies, claim consultants
  (~₹5,000), the IRDAI Ombudsman route (18 months). All downstream of the event.
- Nobody occupies the 40-minute window at the counter — the only moment the document is still
  editable and the doctor is still reachable.
- That is a **time-shift, not a feature difference.** It is the whole wedge.
- Evidence the demand is real and currently met by hand: hospitals **already employ a person**
  whose entire job is guessing TPA wordings, and that person maintains a **private Word doc of
  previously-approved "magic wordings."** Institutional knowledge kept by hand because no system
  holds it.

---

## 4. WHAT the product is

Photograph the discharge summary at the counter. In ~8 seconds you get **the rejection letter,
dated three weeks in the future**, itemised, with rupee figures — then you fix the present
document and watch the future letter shrink.

**New interaction primitive:** *a future consequence becomes a present, editable artefact.*
You do not receive advice. You receive the adversary's own letter, and you edit the past until
the letter changes.

**Why the letter and not a checklist:** loss aversion is enormous but only fires when the loss is
*visible*. A warning is an abstraction. A letter with your name, a date, and ₹1,73,000 struck
through in red is an object. That is the entire design decision behind the hero artefact.

---

## 5. WHO it is for and who pays

**Consumer user (acquisition surface, not the business):**
35–50 year-old adult child at a mid-tier Bengaluru private hospital billing counter after a 3–9
day parent admission. Claim ₹1–5L. Has never read the policy.

**Real buyer (the business):**
The ~24-year-old **insurance-desk executive** at a 150–300 bed hospital, processing 15–25 cashless
pre-authorisations a day across ~14 different TPAs, who keeps the private Word doc of magic
wordings and absorbs the blame when a claim is queried.

**Critical alignment note — do not get this wrong in a pitch.**
On Bucket C the hospital is **on your side**. They want the claim approved too: if the insurer
refuses, the hospital either eats the loss or has to chase the family. You are not fighting the
hospital. You are arming the two parties who both want the claim to go through, against a rulebook
only the third party wrote.

Therefore: **never pitch this as "we stop hospitals and insurers looting people."** You cannot
accuse your buyer and invoice them in the same breath, and it is not even the accurate story.

---

## 6. HOW it works — user flow

1. **Load the policy** — once, by photograph, or pick the insurer from a list. (Can be done at
   purchase, at admission, or right there at the counter.)
2. **Photograph the discharge summary + final bill.** Typically 9pt type, three pages, handwriting,
   abbreviations, photographed at an angle under bad light.
3. **~8 seconds → the future denial letter renders** on plausible TPA letterhead, dated ~26 days
   ahead. Each disallowance is tied either to the exact missing line in the summary or the exact
   sub-limit clause in the policy, with a rupee figure and a likelihood rank.
4. **Tap any red line → the physical ask.** Two kinds of output only:
   - **Document demands** — "ask the nursing station for the indoor case papers," "itemised bill,"
     "investigation reports," "implant invoice and sticker."
   - **A question for the treating doctor** that only he can answer and sign — e.g. *"Does the
     record state why overnight monitoring was required?"*
   Rendered in **English, Kannada and Hindi** so the phone can be physically held up to a clerk.
5. **A "before you sign" gate** — three things to collect, tickable at the counter.
6. **Re-photograph the amended summary.** The letter shrinks, lines grey out, the total falls.
7. **Honest about what cannot be fixed.** Bucket A items are shown plainly as *"this money is
   gone."* This honesty is load-bearing — it is the reason a user believes the other lines.

**B2B mode (act two, the actual business):** the desk executive types clinical facts into the
pre-auth box; a live indicator shows how often this exact phrasing has been queried by this payer
(*"queried in 9 of 11 seeded Star cases"*); one tap restates it; the count drops. Outcomes feed
back and Claude induces a plain-English **"dialect card" per payer** — tacit institutional
knowledge converted into an auditable object the hospital owns and that survives the executive's
resignation.

---

## 7. HOW it works — technical architecture

The split is the design. State it out loud on stage.

### Deterministic code — never the model

- Room-rent sub-limit → **proportionate deduction across the whole bill**
- Co-pay, disease-specific sub-limits, waiting periods
- Non-payable consumables matched against bill lines
- All rupee arithmetic and roll-up
- Letter versioning, the diff, the grey-out animation
- HTML → PDF letterhead render
- The trilingual ask-sheet renderer
- **The fabrication guard** (see §9)

> **Arithmetic never touches the model, and you say that on stage.**

### Claude

- Reading a photographed 9pt three-page discharge summary with handwriting and abbreviations
- Extracting sub-limits, co-pay, exclusions and waiting periods from a 40-page unstructured
  policy wording
- Judging whether a specific clinical narrative establishes medical necessity **for this payer**
- Writing the denial in an actual TPA's bureaucratic register
- Inducing the per-payer dialect card from noisy prior cases

### Data flow

```
  photo(summary, bill) ─┐
                        ├─► Claude vision ──► strict JSON (line items, clinical statements,
  policy PDF (cached) ──┘                      missing-document flags, confidence)
                                                        │
                                                        ▼
                                    deterministic engine (sub-limits, copay,
                                    consumables, proportionate deduction)
                                                        │
                                                        ▼
                                    Claude (register-match: write as this TPA)
                                                        │
                                                        ▼
                                    fabrication guard ──► letter render (HTML→PDF)
                                                        │
                                                        ▼
                                    user acts ──► re-photograph ──► diff ──► letter shrinks
```

### Stack notes

- Mobile web only. No native app, no auth, no accounts.
- Session-only storage. No retention of medical documents.
- Policy wordings pre-parsed and cached before the build window closes — do not parse 40 pages live.
- Compress images client-side before upload. Venue wifi kills demos.

---

## 8. Why Claude specifically

Remove Claude and you have a calculator with no inputs. Concretely:

- **There is no API for a discharge summary.** It is a photographed piece of paper. Perception of
  a deliberately terrible artefact is the entry point and there is no alternative.
- **There is no structured feed of policy wordings.** They are 40-page unstructured PDFs, different
  per insurer, different per product year.
- **The core judgement is ambiguity reasoning, not retrieval.** "Does this narrative satisfy a
  Star medical officer?" is written nowhere. No rules engine, no RAG, no lookup table produces it.
- **Register-matching is generation.** Writing in a TPA's bureaucratic voice is what makes the
  artefact believable, and believability is the product.

Nothing here is decorative. If you delete Claude, the product does not degrade — it does not exist.

---

## 9. Ethical boundaries — non-negotiable

This is the single most important section. An earlier version of this concept had the app rewrite
clinical wording ("patient advised admission" → "oral therapy failed, IV antibiotics required").
**That is upcoding-as-a-service and one judge sentence destroys the pitch:** *"so you sell claim
inflation to 70,000 hospitals?"*

### The rule

**The system never writes a clinical fact.** It has exactly two output types:

1. **Document demands** — "get the indoor case papers."
2. **A question addressed to the treating doctor**, which only he can answer and only he can sign.

### The fabrication guard (build it, then demo it on purpose)

Every clinical noun appearing in any generated output must be present in the source document or a
doctor-confirmed list. If it is not, it is **blocked** and converted into a red
`ASK THE DOCTOR` item with a ready one-line message.

Demo beat: a judge says *"add that the patient had a fever."* The system refuses and turns it into
a question for the surgeon. **Show the refusal. Do not describe it.**

### Health-data posture (state on stage, as architecture not promise)

A photographed discharge summary can carry HIV, psychiatric and oncology status, for a patient who
is often sedated and never consented. Session-only. No retention. No third-party sharing. Say it
before someone asks.

### Calibration honesty

The denial forecast is Claude imitating a TPA medical officer, **not** a model calibrated on real
approved/denied pairs — those pairs are held by the payers. A confident false green converts you
into the thing that lost the family ₹1.25L. Never claim calibration you do not have. See §12 for
the honest alternative.

---

## 10. MVP scope and explicit non-goals

### Build exactly this

- One insurer's policy, pre-parsed
- One photographed discharge summary, live
- One future letter, rendered
- One edit-and-re-run loop showing the total fall
- One pre-auth "dialect" indicator over a seeded corpus
- The fabrication guard, demonstrated

### Do not build (explicit cuts)

- ❌ **Admission / room-choice mode** — it is act three of three, it buys nothing a judge
  remembers, and it is what causes scope collapse at 3:15 PM. This was cut deliberately.
- ❌ TPA or hospital HIS integration
- ❌ Actual claim filing
- ❌ Auth, accounts, user management
- ❌ Native mobile app
- ❌ OCR of every page of a real hospital file
- ❌ **Any medical advice whatsoever**
- ❌ Any output that writes a clinical fact

---

## 11. Five-hour build plan

Anchored to an 11:30 AM → 4:30 PM window; re-anchor as `T+0` … `T+5:00` if reusing.
Three engineers. Assume ~12 genuinely usable engineer-hours after demo prep.

| Time | Eng 1 — perception + render | Eng 2 — deterministic engine | Eng 3 — ground truth + B2B |
|---|---|---|---|
| **T+0:00–0:45** | Camera → upload → Claude vision → strict JSON | Download 3 retail health policy PDFs (Star / HDFC Ergo / Niva Bupa — public), extract params, **cache** | Scrape ~40 **IRDAI Insurance Ombudsman awards** (public PDFs); extract the repudiation-ground taxonomy |
| **T+0:45–1:45** | Letter renderer: HTML→PDF, plausible letterhead, **forward date** | Deduction calculator: proportionate room-rent, copay, sub-limits, consumables | Build checklist from the taxonomy; mark each ground detectable-or-not from a discharge summary |
| **T+1:45–2:30** | Version diff + grey-out animation | Wire calculator to extracted params; rupee roll-up | Write ~60-narrative pre-auth corpus, 4 TPAs, query/approve labels, + 20 held out |
| **T+2:30–3:15** | **Move to the pre-auth indicator as co-primary** | **Fabrication guard** | Trilingual ask sheet (EN/KN/HI); hold-up-to-clerk view |
| **T+3:15–4:00** | Integrate. **Feature freeze.** | Coverage run vs. ombudsman taxonomy → the honesty slide | Seed 3 cases end-to-end |
| **T+4:00–4:45** | **Rehearse the 3-min demo three times.** Print the summary. Stage the doctor beat. | ↔ | ↔ |
| **T+4:45–5:00** | Submit. Nothing new after T+4:00. | | |

### The single most important scheduling decision

An earlier draft put the letter-diff loop **and** three seeded cases **and** the pre-auth corpus
**and** the held-out set all on Eng 3. That is why the B2B act — the one that answers *"who pays"* —
is what gets cut at 3:15 PM, leaving you demoing a consumer toy to a VC.

**Move the pre-auth indicator onto Eng 1 as co-primary.** Do this at planning time, not at 3 PM.

### Seeded vs. live

- **Seeded:** policy parameters, the pre-auth corpus, three demo cases, the ombudsman taxonomy.
- **Live on stage:** the photograph, the extraction, the letter, the delta after the edit, the
  fabrication refusal.

Seeding is smart. Faking the live beats is not.

---

## 12. Ground truth and evaluation

### The trap to avoid

Do **not** grade the forecaster against denial letters your team wrote that morning. That is
Claude grading Claude, and one judge asking *"where did the ground truth come from?"* collapses
the whole pitch in fifteen seconds.

### Why real pairs don't exist

Public sample discharge summaries exist. Public denial reasons exist (IRDAI Ombudsman awards state
the repudiation ground). But **the awards never contain the source discharge summary, and the
sample summaries never come with a denial.** There is no (input document → real outcome) pair
reachable in five hours.

### The honest alternative — coverage, not prediction

Scrape ~40 IRDAI Insurance Ombudsman awards. Extract the taxonomy of repudiation grounds. Then
claim only what you can defend:

> *"Here are the 14 repudiation grounds that appear across 40 public Ombudsman awards. Our
> checklist fires on 12 of them. Here are the 2 we cannot see from a discharge summary, and why."*

That is coverage against public ground truth. It is a smaller claim and an unbreakable one.

### Metrics to report

| Metric | Notes |
|---|---|
| Ground coverage vs. ombudsman taxonomy | The headline number |
| Policy-parameter extraction accuracy | vs. hand-read ground truth on 3 policies |
| Fabrication-guard block rate | Report it live; it is a feature, not a failure |
| Latency per letter | Should be ≤10s |
| **False-green rate** | **Currently unmeasured. Say so.** |

### One more rule

The pre-auth indicator must be a **literal frequency count over the seeded corpus, rendered as
text** — *"this exact phrasing was queried in 9 of 11 seeded Star cases."* Never a model-emitted
percentage. "74%" is a number Claude made up and everyone in the room knows it.

---

## 13. Three-minute demo script

Numbers below use the Ravi case; substitute your real seeded case.

| Time | Beat |
|---|---|
| **0:00–0:20** | Read the SMS aloud. *"₹1,73,000 disallowed."* Three weeks after discharge. File closed, doctor on leave. |
| **0:20–0:35** | **Live**: photograph a printed discharge summary lying on the judges' table. |
| **0:35–1:10** | The future letter renders. TPA letterhead. Dated three weeks ahead. Four red lines, itemised, with rupees. |
| **1:10–1:30** | Tap the biggest line → the exact missing clinical statement + the **Kannada ask sheet** held up to a "ward clerk." |
| **1:30–1:50** | **A teammate playing the treating doctor** writes the line in, by hand, and signs. Re-shoot. **₹1,73,000 → ₹48,000**, letter greys out. Say aloud: *"₹48,000 we cannot recover — the room was chosen four days ago. We show that too."* |
| **1:50–2:10** | **The honesty beat.** The ombudsman coverage claim (§12), including the misses. |
| **2:10–2:40** | Flip to the pre-auth desk. Type *"gall bladder stone pain"* → *"queried in 9 of 11 seeded Star cases"* → restate → 1 of 11. Then a judge says *"add that he had a fever"* → **the system refuses** and converts it into a question for the surgeon. |
| **2:40–3:00** | ₹40 per pre-auth file. 70,000+ private hospitals. One buyer, named. |

**Design rules for the demo:** it must read with the sound off; the hero is an artefact (a letter),
not a UI; the refusal beat is mandatory, not optional.

---

## 14. Demo contingencies

| If this fails | Do this |
|---|---|
| Live camera capture | Three pre-photographed cases, one keystroke each |
| Letter render / PDF | On-screen itemised table with the **forward date in the header** — the date is the idea, not the letterhead |
| Claude latency on venue wifi | Pre-warm one case; run the live photograph as beat two, not beat one |
| Ombudsman scrape didn't finish | Drop the accuracy slide entirely; reframe the letter as *"the argument this payer will make"* rather than *"the letter you will receive."* Weaker, honest, survivable |
| Fabrication guard flaky | Hard-code the refusal for the demoed phrase and say it is a demonstration of the rule, not the general implementation |

---

## 15. Risks and the strongest attacks

Three independent adversarial reviews (a VC/tired-judge persona, a staff engineer with a stopwatch,
and a user/privacy critic) attacked this concept. **All three concluded it survives** — the only
concept out of eight to do so. Their strongest hits, and the fixes, are already folded into this
document. Recorded here so they are not re-litigated or forgotten.

**Attack 1 — "Your accuracy number is homework you set and marked yourself."**
The credibility slide is graded against a corpus the team wrote that morning; the parties holding
real approve/deny labels are the payers you are attacking.
→ **Fixed** by §12: coverage against 40 public Ombudsman awards instead of self-scored prediction.

**Attack 2 — "Nobody in the demo can lawfully do what the demo shows."**
A discharge summary is a signed medico-legal record. Neither the son nor the app can insert a
clinical line into it, and the only actor who *can* is the hospital, whose incentive is to bill
more. The original hero beat was a filmed demonstration of coaching someone to alter a clinical
record for money.
→ **Fixed** by §9: document demands and doctor-questions only; the doctor supplies and signs the
line in the demo; the fabrication guard is shown refusing.

**Attack 3 — "You have three products and twelve hours."**
Consumer letter + admission/room mode + B2B needle = 16–18 engineer-hours against ~12 usable, and
the B2B act (the one answering *who pays*) is what gets cut under pressure.
→ **Fixed** by §10 and §11: admission mode deleted; the needle moved to Eng 1 as co-primary.

**Residual risks that are not fixed:**

- **Calibration.** The forecast remains uncalibrated. A false green is real harm. Own it.
- **Hospital procurement is a nine-month knife fight.** The credits-and-demo timeline does not
  reflect the sales timeline.
- **The consumer at 6:15 PM** with a mother in a wheelchair may be incapable of operating anything
  — which is precisely why the hospital, not the family, is the buyer, and the consumer letter is
  an acquisition surface.
- **The dialect card "learns" from a corpus you wrote.** On stage that is a demonstration of
  learning, not learning. Say so.

---

## 16. Business model and market

- **B2B (the business):** ₹40 per pre-authorisation file, sold to the hospital insurance desk.
  A 200-bed hospital doing ~20 pre-auths/day ≈ ₹2.4L/year per hospital. 70,000+ private hospitals
  in India.
- **Consumer (acquisition, not revenue):** ₹99–299 per admission. Treat as top-of-funnel and a
  brand surface, not a second business. Pitch **one** buyer.
- **Why the desk pays:** they already employ this function badly, by hand, with a Word doc. Queried
  pre-auths cost them working capital and staff hours; a resigning executive takes the institutional
  knowledge with them. The dialect card is an asset the hospital keeps.
- **Longer arc:** the accumulated per-payer query patterns become the only structured description
  of how Indian TPAs actually adjudicate — an asset no single hospital and no single insurer can
  assemble alone.

---

## 17. Pitch lines

> **Pitch (one line):** "We send you the insurance rejection letter three weeks before the insurer
> does — while the doctor is still in the building and the paperwork can still be fixed."

> **Judge-repeatable sentence:** *"That was the project that showed you the rejection letter you're
> going to get in three weeks, and then let you edit the past until it went away."*

> **Closing line:** "Every company in this space helps you appeal. Nobody moved the letter."

> **Honest framing of the problem (use this, not 'looting'):** "Most of what families lose on a
> hospital claim isn't stolen — it's dropped, because the paperwork was thin and nobody told them
> while they could still fix it."

---

## 18. Hackathon context

### Verified facts

| | |
|---|---|
| Event | Push to Prod Hackathon: Building at the Frontier |
| Organisers / judges | **Anthropic** + **Elevation Capital**, part of Basecamp (Bengaluru tech festival, 6–12 Aug 2026) |
| Date / place | Sat 8 August 2026, Bengaluru, in-person only |
| Hacking window | **11:30 AM → 4:30 PM (5 hours)** |
| Submission | Due 4:30 PM; judging immediately; closing 6:30 PM |
| Team size | 1–3 |
| Prize | **$10,000 in credits** + office hours with Elevation Capital partners |
| Hard rule | Claude/Anthropic must be **core** to the product, workflow, or intelligence layer |
| Theme | *"Build the Next Audacious"* — frontier capability / billion-dollar idea / category-redefining / novel interface / infra layer. Explicitly **not** a 20% improvement |

Sources: `pushtoprod-india.devfolio.co/overview`, `/schedule`, `/prizes`; `basecampblr.com`.

### Assumptions (not published — treat as inference)

- **Judging criteria are not published.** No rubric, no track breakdown, no per-team demo duration.
- Assume ~2–3 min demo + Q&A. Build for **sound-off legibility**.
- No sponsor bounties beyond Anthropic itself.

### Judge calibration (the part that actually decides it)

1. **"Build the Next Audacious" is Elevation Capital's own tagline** — their homepage says *"Built
   for the Audacious."* You are pitching into their brand. They closed **Fund IX, $500M**, explicitly
   seed/Series A, explicitly **AI application layer**, explicitly India-for-India + India-for-global,
   and they say publicly the opportunity is *not* foundation models. **Optimise for "this is a
   company," not "this is a clever hack."** The real prize is the office hours.
2. **Anthropic's India priorities are public:** India is #2 globally in Claude consumer usage,
   heavily skewed to coding. The Bengaluru office is chartered for **education, healthcare,
   agriculture** plus **Indic language capability**. An Anthropic judge is least moved by another
   coding tool and most moved by messy real-world multimodal Indian input.
3. **Five hours is the design constraint.** It kills ~80% of good ideas. Winning shape: one screen,
   one input, one transformation, seeded state, a live Claude call on the critical path, everything
   else precomputed.

### What the room will be full of (avoid resembling any of these)

Coding agents · AI SDRs · WhatsApp bots "for Bharat" · kirana/SMB voice agents · agentic browsers ·
"AI employee" · personal memory layers · RAG over Indian tax/legal docs · ONDC agents · JEE/NEET
tutors · UPI-fraud detectors · DPDP compliance · meeting notetakers · MCP servers for X.

Pattern-matching to any of these within five seconds is a loss regardless of execution quality.

---

## 19. Open questions to resolve

1. **Can you get 15–20 real (discharge summary → denial letter) pairs?** From teammates' families,
   hospital contacts, or consumer-forum filings. This is the single highest-value asset and would
   upgrade §12 from coverage to genuine calibration.
2. **Does a real hospital insurance desk confirm the "magic wordings Word doc"?** One phone call.
   If yes, it is the strongest slide in the deck.
3. **What is the actual false-green rate?** Unmeasured. Needs the pairs from (1).
4. **Is ₹40/file the right price?** Unvalidated. Compare against the desk executive's fully-loaded
   hourly cost and the working-capital cost of a queried pre-auth.
5. **Which insurer to lead with?** Pick the one whose public policy wording parses cleanest.
6. **Regulatory:** does producing a document that predicts an insurer's decision have any IRDAI
   implication? Unresearched.

---

## Appendix A — runners-up

Generated and scored alongside POSTDATED, kept here in case a pivot is needed.

**THE GLANCE** *(highest ceiling, weakest business)* — A first-year resident types the three words
her consultant said walking past (*"get a TSH"*) and gets back the ranked evidence that must be
true for that verdict to hold, circled on the patient in front of her, plus a planted distractor
she must reject. Primitive: **abduction over a multimodal artefact** — you supply the conclusion,
you get the evidence. Two mandatory fixes: (1) do **not** ask Claude for coordinates — Anthropic's
docs say Claude works poorly with normalised coordinates and returns pixels in its internally
resized/padded space; instead have Claude name regions from a fixed anatomical vocabulary and use
**MediaPipe Face Mesh + Pose in-browser** to place them (~1 hour, deterministic, free, offline);
(2) make **code review** the hero domain for the VC half, because the diff is inspectable and the
senior's real comment is known ground truth. Killer risk: it confabulates confidently on a healthy
subject and the learner cannot tell — build a negative-control refusal path and open with it.

**CONTEMPORANEOUS** — The real record of an Indian construction site lives in a WhatsApp group;
paste the chat export and the daily report assembles itself, then a red band drops: *"2 days left
to notify — 3rd occurrence."* Zero behaviour change is the whole bet, and it is the right bet:
every incumbent is sold on *"stop running your site on WhatsApp."* Cheapest build in the set
(9–10 engineer-hours). Fixes required: remove the rupee exposure figure entirely (entitlement needs
critical-path analysis a chat group cannot supply); step one becomes "upload the executed contract"
so every clock cites a real clause — **no clause, no clock**; output becomes an internal claim
register, not a client-facing notice.

**COUNTERPARTY** — Gig workers are paid by the only entity that keeps the books. Drag in the sixty
earnings screenshots a rider already takes nightly and a counter-ledger assembles itself, naming
the orders behind the ₹463 gap. Highest problem-first integrity and behaviour fit of anything
generated (the data collection already happens, unpaid, defensively). **Validate the artefact in
10 minutes before committing**: riders may only screenshot the daily *summary* card, not per-order
rows — if so, pivot the hero to the pooled incentive-slab curve, which no single rider's data can
produce. Add device-side hash+timestamp and reject a forged screenshot on stage.

**ONE BODY** — Tip a bag of cut medicine strips on the table, one photo, eleven objects resolve to
nine molecules with a red line between the two that must not coexist. Most physically demoable
idea generated. Voted out by all three attackers: a free Play Store app already does ~80% of it;
the delta is a hand-typed interaction table; and the common output is *no red line*, which a
caregiver reads as clearance. If revived: segment deterministically with OpenCV `findContours`,
send each crop as its own vision call, and make the pharmacy-counter substitution check the hero.

**Killed outright:** ALMIRAH (interview the elderly father about the property papers — operationally
indistinguishable from the elder-fraud pattern; three fatal verdicts) · CANONICAL (a person as a
merge conflict of name spellings — fatal go-to-market: ingesting strangers' Aadhaar through Xerox
shops ends any VC diligence) · PEHLE (point your phone at the wall and the move-in-day photo snaps
into frame — 19–22 engineer-hours against 12, and feature matching fails on untextured walls).

---

## Appendix B — how this was generated

Pipeline: 89 human frictions mapped across five domains of Indian daily and working life →
4 cross-domain transfer lenses (body/nature; attention & ritual; systems engineering; consequence &
uncertainty) producing ~150 raw ideas culled to 36 → merged and scored to 8 finalists on 13
weighted axes with penalties → 24 adversarial verdicts from 3 hostile personas.

POSTDATED emerged as a **merge of four independently generated ideas** from different lenses, which
is itself signal. Pre-attack weighted score **76.1/100** (problem-first 9 · demand 9 · pain 10 ·
behaviour-fit 8 · new primitive 9 · WTF 10 · Claude necessity 9 · technical depth 7 · demoability 9 ·
5-hour feasibility 9 · originality 8 · VC scale 9 · memorability 9; −15% hallucination risk).
**Zero fatal verdicts, zero votes against — the only finalist of eight to survive all three
adversarial passes.**

---

## Final test

**Remove the technology — does the problem still matter?**
Yes. ₹1,25,000 disallowed three weeks after discharge, over two documents nobody mentioned, is a
purely human catastrophe with no software in it.

**Remove the AI — does the experience become impossible?**
Yes. There is no API for a photographed discharge summary, no structured feed of policy wordings,
and no rules engine that can judge whether a clinical narrative satisfies a specific payer's
medical officer.

**Would the user say "I need this" rather than "this is cool"?**
The hospital already pays a salaried human to do this badly, by hand, with a private Word doc.
That is the answer.
