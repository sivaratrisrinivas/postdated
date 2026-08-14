# POSTDATED

> See the insurance rejection letter before the insurer sends it — while the doctor and the paperwork are still there.

POSTDATED is a hackathon demo for the hospital discharge counter. It reads a photograph of a discharge summary and bill, then shows:

- bill items that may not be paid;
- documents the family should ask the hospital for;
- questions the doctor may need to answer;
- a simple forecast of the money at risk.

The web journey is intentionally three screens: capture the paperwork, read the future letter,
and take one concrete document-or-doctor action. The letter remains the hero artefact; safety
details stay available without competing with the next move.

The forecast uses ordinary code. The model only reads the photograph. It must not invent a diagnosis, symptom, or reason for treatment. A separate check blocks unsupported medical wording.

## Try the demo

Open [postdated.vercel.app](https://postdated.vercel.app), choose the sample discharge photo, and wait for the forecast. You can also print the sample page at [/summary](https://postdated.vercel.app/summary).

The sample is fictional. The letter is a forecast, not a real insurance decision or medical advice.

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
document/PED asks remain visible as diagnostic warnings. The live run also reports latency per case.

## Where to look

- [`app/page.tsx`](./app/page.tsx) — the responsive three-screen demo.
- [`public/brand/postdated-mark.png`](./public/brand/postdated-mark.png) — the generated brand mark.
- [`app/api/extract/route.ts`](./app/api/extract/route.ts) — the image-reading request.
- [`lib/deduct.ts`](./lib/deduct.ts) — every money calculation.
- [`lib/guard.ts`](./lib/guard.ts) — the check against invented medical facts.
- [`evals/`](./evals/) — the test cases and scoring scripts.

No patient documents are stored by this demo. Do not use it with real patient information.
