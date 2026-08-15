# POSTDATED

> See the insurance rejection letter before the insurer sends it — while the doctor and the paperwork are still there.

POSTDATED is a hackathon demo for the hospital discharge counter. It loads a policy, reads a
photograph of a discharge summary and bill, then shows:

- bill items that may not be paid;
- documents the family should ask the hospital for;
- questions the doctor may need to answer;
- a simple forecast of the money at risk.

The web journey has a short policy setup followed by three primary screens: capture the paperwork,
read the future letter, and take one concrete document-or-doctor action. After the action, a
re-photograph step proves what changed before the separate final result screen. The letter remains
the hero artefact; safety details stay available without competing with the next move.

The forecast uses ordinary code. The model only reads the photograph. It must not invent a diagnosis, symptom, or reason for treatment. A separate check blocks unsupported medical wording.

## Try the demo

Open [postdated.vercel.app](https://postdated.vercel.app), load the supported Niva Bupa policy, then
choose one of the three committed demo cases. You can also print the sample page at
[/summary](https://postdated.vercel.app/summary).

The sample is fictional. The letter is a forecast, not a real insurance decision or medical advice.

## First-time user flow

1. On the policy screen, tap **Niva Bupa · ReAssure 2.0** for the pre-parsed demo policy. The
   **Photograph a policy page** path is available when `CEREBRAS_API_KEY` is configured.
2. On the paperwork screen, either use **Take a photo of the paperwork** for a new rear-camera
   image or **Choose an existing photo** for a file already on the device. You can also run one of
   the three committed demo cases: the original fixture, the public JPG, or the print-ready public
   PDF case.
3. Read the future letter. Every red line has an amount and a clause or exact missing statement;
   tap any line to inspect its evidence. The largest line marked **Fixable now** is the next move.
4. Tap **Open the fix**, choose English, Kannada, or Hindi, and hold the physical document demand
   or doctor question up to the right person. Complete the three **Before you sign** checks, then
   confirm the handover or signed answer.
5. Tap **Re-photograph the amended summary**. The live path reads the new image again; a demo case
   also offers **Run the amended demo scan** so the journey is rehearsable without a second printout.
   The resolved line stays greyed out and the remaining red total is recalculated.
6. Tap **Start a fresh check** on the final-result screen. The loaded policy stays available, but
   the document, extraction, actions, and result are cleared.

The core journey is three primary steps after policy setup: capture the paperwork, read the future
letter, and take one concrete action. The updated result then appears on its own post-action screen.
The app keeps documents session-only and does not write clinical facts.

### Why there is an upload button

The three demo cases are preconfigured so a judge can rehearse the product without depending on
which file picker or network is available. Upload is the actual product path for a new, user-owned
discharge summary and final bill that is not one of those demos. With `CEREBRAS_API_KEY` configured,
that image is read live; without the key, custom uploads show a configuration error instead of
pretending that the seeded case came from the uploaded document.

The current browser path accepts one image at a time (JPG, PNG, HEIC formats supported by the
browser). The camera and existing-file controls are intentionally separate because mobile
browser support for the `capture` hint varies. The committed PDF is a preconfigured demo case;
PDF vision upload and multi-page batching are not part of this demo build. See
[`docs/research/upload-options.md`](./docs/research/upload-options.md) for the researched
production options and the retention tradeoffs.

## Run it locally

You need Node.js 20 or newer.

If you use WSL, run the commands from the WSL shell so `node`, `npm`, and a key loaded from
`~/.bashrc` stay in the same environment. Do not mix the WSL Node runtime with Windows `npm`.

```sh
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without a key, the app shows its saved sample result.

To read a new photograph, set a Cerebras key in your shell before starting the app:

```sh
export CEREBRAS_API_KEY=your-key
npm run dev
```

The key stays on the server. It is never sent to the browser.

## Check the project

```sh
npm test                 # unit tests
npm run lint             # code checks
npx tsc --noEmit         # type checks
npm run build            # production build
```

For the ten fictional extraction cases, start the app first and then run:

```sh
npm run eval
```

The live run needs `CEREBRAS_API_KEY`. The default pace is slow enough for Cerebras Free Trial limits.
It reports money, room, safety, and fallback failures as release-gate errors; wording differences in
document/PED asks remain visible as diagnostic warnings. The live run also reports process telemetry:
model/tool calls, intermediate steps, latency, and model-vs-local time shares.

### Evaluation and release gates

The evaluation follows the product chain end to end:

```text
photographed record → source-grounded read → safe physical ask
                   → deterministic forecast → one counter action
                   → re-read → only the fixable line clears
```

The gates stay separate:

- safety: zero unsupported clinical statements, unsafe asks, or unsafe unreadable-case confidence;
- deterministic: exact amount conservation, input invariance, and safe resolution deltas;
- live task quality: field-level precision/recall, grounding, abstention, and workflow survival;
- process: model/tool calls, intermediate step timings, phase pass rates, and latency.

The concrete pass/fail rubric is versioned in [`evals/rubric.ts`](./evals/rubric.ts), with examples
for every criterion. The detailed harness documentation is in [`evals/README.md`](./evals/README.md).
Human alignment is reported only after at least 20 blinded, evidence-first reviews and requires at
least 80% agreement with both human and expert decisions. Position and length bias are measured
from seeded A/B reviews; without review files, both tracks correctly report **unmeasured**.

The committed corpus is synthetic, but a live evaluation still uploads its images to the configured
Cerebras endpoint. Run that only when the transfer is approved. CI runs the offline safety,
deterministic, and reference-workflow gates by default; see
[`regression.yml`](./.github/workflows/regression.yml).

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
