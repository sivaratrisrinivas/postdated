# POSTDATED

[![POSTDATED regression suite](https://github.com/sivaratrisrinivas/postdated/actions/workflows/regression.yml/badge.svg)](https://github.com/sivaratrisrinivas/postdated/actions/workflows/regression.yml)

> See the insurance rejection letter three weeks early — while the doctor and the paperwork are still there.

POSTDATED photographs a hospital discharge summary and bill, applies a known insurance policy, and shows the likely unpaid lines while the doctor is still in the building. A discharge summary is the signed record of the admission.

## Who it is for

The demo is written for the adult child at a mid-tier Bengaluru private hospital's discharge counter, holding the paperwork after a parent has been admitted for several days. They have not read the policy wording. They need to know what can still be fixed before the doctor and the ward records become unavailable.

The other intended reader is the hospital insurance-desk executive. They process cashless claims, where the hospital files the claim so the family does not pay the bill upfront. They want the file to survive the insurer's review.

A health claim is often paid only in part. The cut arrives weeks later, after the doctor has left. Some of that money was gone the moment the room was chosen. Some of it is a missing ward file or a sentence the treating doctor never wrote. Those lines are still fixable if you know to ask today. The app puts the future deduction letter on the phone now, with one physical next step.

This repository is a hackathon demo from Push to Prod (Anthropic × Elevation Capital, Bengaluru, 8 Aug 2026). It is MIT-licensed. It does not file claims, store patient documents, or give medical advice. The letter is a forecast, not a real insurance decision.

## How to try it

Open [postdated.vercel.app](https://postdated.vercel.app). Load the supported Niva Bupa policy, then choose one of the three committed demo cases. You can print the sample page at [/summary](https://postdated.vercel.app/summary).

The sample is fictional.

To run the same app on your computer, install Node.js 20 or newer. Node.js is the program that starts the local web server. `npm` is the installer that comes with it. Then run:

```sh
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The three demo cases complete without a cloud key. Reading a new photograph needs `CEREBRAS_API_KEY`, a server-only secret for Cerebras Chat Completions (`gemma-4-31b`), the page-reading service. Copy `.env.example` to `.env.local` and add a key only if you want that live path.

### In the demo

1. On the policy screen, tap **Niva Bupa · ReAssure 2.0** for the already loaded demo policy. The **Photograph a policy page** path needs `CEREBRAS_API_KEY`. Without it the app names that setting and tells you to pick the supported insurer.
2. On the paperwork screen, use **Take a photo of the paperwork** for a new rear-camera image or **Choose an existing photo** for a file already on the device. You can also run one of the three committed demo cases: **Original worked case**, **Public photo sample**, or **Print-ready sample**.
3. Read the future letter. Every red line has an amount and a clause or exact missing statement. Tap any line to inspect its evidence. The largest line marked **Fixable now** is the next move.
4. Tap **Open the fix**, choose English, Kannada, or Hindi, and hold the physical document demand or doctor question up to the right person. Complete the three **Before you sign** checks, then confirm the handover or signed answer.
5. Tap **Re-photograph the amended summary**. The live path reads the new image again. A demo case also offers **Run the amended demo scan** so the journey is rehearsable without a second printout. The resolved line stays greyed out and the remaining red total is recalculated. If another recoverable line is still open, **Open the fix** stays available. The worked case is ₹1,73,000 → ₹88,000 → ₹48,000. When nothing fixable remains, the final-result screen opens.
6. Tap **Start a fresh check** on the final-result screen. The loaded policy stays available, but the document, reading, actions, and result are cleared.

The core journey after policy setup is capture, read the letter, and act on the largest fixable line. A second document or doctor action is available while recoverable lines remain. The app keeps documents session-only and does not write clinical facts.

## What the numbers mean

**₹1,73,000 → ₹88,000 → ₹48,000** is the worked demo case, not a live hospital result. ₹1,73,000 is the opening unpaid total. After indoor case papers, the ward's day-by-day notes, are treated as submitted, that total falls to ₹88,000. After the admission-necessity line is treated as signed, it falls to ₹48,000. The last amount is room-and-consumable money the policy never pays. A document cannot recover it. The app still shows it next to the lines that a ward file or a doctor's signature can change.

**Forty fictional extraction cases** live in `evals/`. Extraction means reading a photographed page into structured fields. All forty packs are synthetic documents, synthetic bills, and handwritten expected answers. Nothing in `evals/` is a real patient record. The mix is 16 safety cases, 12 money-math cases, and 12 end-to-end workflow cases. GitHub Actions, the automatic check on every push, runs the offline must-pass gates by default: no invented clinical wording, money totals that balance, and the reference journey. See [`regression.yml`](./.github/workflows/regression.yml). A live photograph run needs `CEREBRAS_API_KEY` and is opt-in, because it still uploads those fictional images to Cerebras.

**4 fully / 12 partly / 8 not seen** is coverage against a hand-read public Ombudsman taxonomy. Those are the official awards that list why insurers refuse to pay. Fully means a discharge summary and bill can show that reason. Partly means you also need policy wording or a judgement call. Not seen means the facts live outside both documents. This is not precision or recall, and this README does not publish those scores.

**At least 20 blinded, evidence-first reviews** and **at least 80% agreement** with both human and expert decisions are the bar before the repo will report human alignment. Blinded means the reviewer does not see the automated pass/fail first. Position and length bias are measured from seeded A/B reviews, paired comparisons shown in a random left/right order. Without those review files, both tracks correctly report **unmeasured**. The false-green rate, how often a "this will be paid" forecast would be wrong on real claims, is also **unmeasured**. There are no real approved or denied pairs in this repository.

## Run it locally

You need Node.js 20 or newer.

If you use WSL (Windows Subsystem for Linux), run the commands from the WSL shell so `node`, `npm`, and a key loaded from `~/.bashrc` stay in the same environment. Do not mix the WSL Node runtime with Windows `npm`.

```sh
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Copy `.env.example` to `.env.local` and add a Cerebras key only if you want the live photograph path.

Without `CEREBRAS_API_KEY`:

- the three committed demo cases still complete end to end;
- a custom upload or policy photograph fails with an error that names `CEREBRAS_API_KEY`;
- the app does not silently substitute the seeded case for an uploaded file.

To read a new photograph, set the key in the server environment before starting the app:

```sh
export CEREBRAS_API_KEY=your-key
npm run dev
```

The key stays on the server. It is never sent to the browser. There is no Anthropic / Claude client in this repo.

### Why there is an upload button

All three demo cases use the same committed extraction. The public JPG is a photograph of that page, shown as a preview. It is not a live-vision case. A Cerebras read of it has returned a high-confidence empty bill. Inventing line items to fill the letter would be worse. Live reading is the custom camera/upload path. Without `CEREBRAS_API_KEY`, or when the page yields no bill, that path fails and names the reason. It does not silently become the seeded case.

The current browser path accepts one image at a time. The client compresses it to JPEG before upload. The server accepts JPEG or PNG only, which is what Cerebras image input allows. HEIC works only if the browser can decode it first. The camera and existing-file controls are intentionally separate because mobile browser support for the `capture` hint varies. The committed PDF is a preconfigured demo case. PDF vision upload and multi-page batching are not part of this demo build. See [`docs/research/upload-options.md`](./docs/research/upload-options.md) for the researched production options and the retention tradeoffs.

## Check the project

```sh
npm test                 # unit tests
npm run lint             # code checks
npx tsc --noEmit         # type checks
npm run build            # production build
```

For the forty fictional extraction cases, start the app first and then run:

```sh
npm run eval
```

The live run needs `CEREBRAS_API_KEY`. The default pace is slow enough for Cerebras Free Trial limits. It reports money, room, safety, and fallback failures as release-gate errors, meaning the check fails the build. Wording differences in document asks and in PED asks, which are pre-existing-disease trigger phrases, remain visible as diagnostic warnings. The live run also reports process telemetry, meaning model/tool calls, intermediate steps, latency, and model-vs-local time shares.

### Evaluation and release gates

The evaluation follows the product chain end to end:

```text
photographed record → source-grounded read → safe physical ask
                   → deterministic forecast → one counter action
                   → re-read → only the fixable line clears
```

The gates stay separate:

- safety: zero unsupported clinical statements, unsafe asks, or unsafe unreadable-case confidence;
- deterministic: exact amount conservation, input invariance, and safe resolution deltas. Deterministic here means ordinary code that always gives the same money answer from the same inputs;
- live task quality: field-level precision/recall, grounding, abstention, and workflow survival;
- process: model/tool calls, intermediate step timings, phase pass rates, and latency.

The concrete pass/fail rubric is versioned in [`evals/rubric.ts`](./evals/rubric.ts), with examples for every criterion. The detailed evaluation-script documentation is in [`evals/README.md`](./evals/README.md). Human alignment is reported only after at least 20 blinded, evidence-first reviews and requires at least 80% agreement with both human and expert decisions. Position and length bias are measured from seeded A/B reviews. Without review files, both tracks correctly report **unmeasured**.

The forty fictional cases are synthetic, but a live evaluation still uploads its images to the configured Cerebras endpoint. Run that only when the transfer is approved. GitHub Actions runs the offline safety, ordinary-code, and reference-workflow gates by default.

The forecast uses ordinary code. When a new photograph is read live, the server calls Cerebras. The model only reads the page. It must not invent a diagnosis, symptom, or reason for treatment. A separate check, the fabrication guard, blocks unsupported medical wording.

## Where to look

- [`app/page.tsx`](./app/page.tsx) — the policy, capture, forecast, action, re-scan, and result flow.
- [`lib/demo.ts`](./lib/demo.ts) — the three committed demo cases and amended-demo transition.
- [`public/brand/postdated-mark.png`](./public/brand/postdated-mark.png) — the generated brand mark.
- [`app/api/extract/route.ts`](./app/api/extract/route.ts) — the image-reading request.
- [`app/api/policy/route.ts`](./app/api/policy/route.ts) — the optional policy-photo reader.
- [`lib/deduct.ts`](./lib/deduct.ts) — every money calculation.
- [`lib/guard.ts`](./lib/guard.ts) — the check against invented medical facts.
- [`evals/`](./evals/) — the test cases and scoring scripts.

No patient documents are stored by this demo. Do not use it with real patient information.

The author's other personal repos are typically unlicensed. MIT is the default chosen for this public demo.
