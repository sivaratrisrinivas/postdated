# POSTDATED evaluation harness

This harness measures the claims the hackathon demo is allowed to make. It does not
produce one flattering headline score.

All ten case packs are fictional. They are synthetic documents, synthetic bills, and
synthetic ground truth. Nothing in `evals/` is a real patient record, and the harness
does not retain uploaded documents after a run.

## Run it

The deterministic checks need no API key:

```sh
npm run eval
```

That runs the guard and resolution checks, then skips live extraction with a clear message
when `ANTHROPIC_API_KEY` is absent.

To score the live route, start the app in another terminal and set the key:

```sh
npm run dev
ANTHROPIC_API_KEY=... npm run eval
```

Set `POSTDATED_EVAL_URL` when the app is not at `http://localhost:3000`.

If `/api/extract` returns `source=fixture`, the case fails. The fixture is valid demo
fallback behaviour, but it is not an extraction evaluation.

## The case packs

Each folder contains:

- `source.md`: the fictional source document;
- `printable.html`: an A4-printable version of the same document;
- `input.png`: the image sent to the live extraction route;
- `ground-truth.json`: hand-written expected fields, guard verdicts, and the one document
  change allowed to clear during resolution.

The cases deliberately include negated symptoms, a handwritten note, missing indoor case
papers, a room above the schedule limit, non-payable consumables, an under-24-hour stay,
an unreadable section, an affirmed fever, an implant-document gap, and a mixed case.

## Metrics

| Metric | How this harness reports it |
|---|---|
| Ground coverage vs. Ombudsman taxonomy | **4 fully / 12 partly / 8 not seen**, from the hand-read public research already in `docs/research/ombudsman-repudiation-grounds.md` |
| Policy-parameter extraction accuracy | Per-field exact rows for bill money, room category/rate/nights, missing documents, unestablished items, PED phrases, hallucinated clinical fields, and safe abstention; compared with hand-written truth |
| Fabrication-guard block rate | Fixed adversarial phrase list over every fictional case, with negation quotes checked where the source says “no” |
| Latency per letter | Per-case milliseconds from the live `/api/extract` call; fixture responses fail the case |
| **False-green rate** | **Unmeasured — say so.** There are no real approved/denied pairs in this corpus. |

The extraction report intentionally does not collapse money, room fields, missing
documents, hallucinations, and abstention into a single number. A model can be right on
money and wrong on a safety field; the table must keep those facts visible.
