'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { AskSheet } from '@/components/AskSheet';
import { GuardPanel } from '@/components/GuardPanel';
import { Letter } from '@/components/Letter';
import { compressForUpload } from '@/lib/compress';
import { computeForecast } from '@/lib/deduct';
import { SEEDED_EXTRACTION, SEEDED_SUMMARY_TEXT } from '@/lib/fixture';
import { NIVA_BUPA_REASSURE_2 } from '@/lib/policy';
import type { Disallowance, Extraction } from '@/lib/types';

type Status = 'idle' | 'reading' | 'ready';

/** Where the extraction came from. Shown, not hidden — §11: seeding is smart, faking is not. */
type Source = 'live' | 'fixture';

export default function Page() {
  const [status, setStatus] = useState<Status>('idle');
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [source, setSource] = useState<Source>('live');
  const [latency, setLatency] = useState<number | null>(null);
  const [resolved, setResolved] = useState<ReadonlySet<string>>(new Set());
  const [activeLine, setActiveLine] = useState<Disallowance | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const forecast = useMemo(
    () => (extraction ? computeForecast(extraction, NIVA_BUPA_REASSURE_2) : null),
    [extraction],
  );

  const capture = useCallback(async (file: File) => {
    setStatus('reading');
    const started = Date.now();
    try {
      const { base64, media_type } = await compressForUpload(file);
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ image: base64, media_type }),
      });
      const data = await res.json();
      setExtraction(data.extraction);
      setSource(data.source === 'live' ? 'live' : 'fixture');
      setLatency(data.latency_ms ?? Date.now() - started);
      setResolved(new Set());
    } catch {
      // §14: the demo never dies on the capture path.
      setExtraction(SEEDED_EXTRACTION);
      setSource('fixture');
      setResolved(new Set());
    }
    setStatus('ready');
  }, []);

  const runSeeded = useCallback(() => {
    setExtraction(SEEDED_EXTRACTION);
    setSource('fixture');
    setLatency(null);
    setResolved(new Set());
    setStatus('ready');
  }, []);

  const resolve = useCallback((reason: string) => {
    setResolved((prev) => new Set(prev).add(reason));
  }, []);

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-16 pt-8 sm:px-6">
      <Masthead />

      {status !== 'ready' && (
        <Capture
          busy={status === 'reading'}
          onPick={() => fileInput.current?.click()}
          onSeeded={runSeeded}
        />
      )}

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void capture(file);
        }}
      />

      {forecast && extraction && (
        <div className="mt-8 space-y-4">
          <Provenance source={source} latency={latency} />

          <Letter forecast={forecast} resolved={resolved} onTapLine={setActiveLine} />

          <p className="px-1 text-[0.8rem] leading-relaxed text-white/50">
            Tap any red line. The two green ones are still fixable — the doctor is in the
            building for about forty more minutes.
          </p>

          {extraction.ped_trigger_phrases.length > 0 && (
            <PedTrigger phrases={extraction.ped_trigger_phrases} />
          )}

          <Coverage />

          <GuardPanel sourceText={SEEDED_SUMMARY_TEXT} />

          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="w-full rounded-xl border border-white/12 py-3 font-mono text-[0.68rem] font-bold uppercase tracking-[0.14em] text-white/60 transition-colors hover:border-white/25 hover:text-white/90"
          >
            Re-photograph the amended summary
          </button>
        </div>
      )}

      {activeLine && (
        <AskSheet line={activeLine} onResolve={resolve} onClose={() => setActiveLine(null)} />
      )}
    </main>
  );
}

function Masthead() {
  return (
    <header>
      <p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.28em] text-[#E5484D]">
        Postdated
      </p>
      <h1 className="mt-3 text-[1.6rem] font-semibold leading-[1.2] tracking-tight text-white sm:text-[1.9rem]">
        We send you the insurance rejection letter three weeks before the insurer does.
      </h1>
      <p className="mt-3 text-[0.92rem] leading-relaxed text-white/55">
        While the doctor is still in the building and the paperwork can still be fixed.
      </p>
    </header>
  );
}

function Capture({
  busy,
  onPick,
  onSeeded,
}: {
  busy: boolean;
  onPick: () => void;
  onSeeded: () => void;
}) {
  return (
    <div className="mt-8 space-y-3">
      <button
        type="button"
        onClick={onPick}
        disabled={busy}
        className="w-full rounded-2xl bg-white px-5 py-5 text-left transition-transform active:scale-[0.99] disabled:opacity-60"
      >
        <span className="block font-mono text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#C1121F]">
          {busy ? 'Reading the page…' : 'Step one'}
        </span>
        <span className="mt-1.5 block text-[1.05rem] font-semibold leading-snug text-[#1A1A1A]">
          {busy
            ? 'Extracting line items and missing documents'
            : 'Photograph the discharge summary'}
        </span>
        <span className="mt-1 block text-[0.8rem] text-black/50">
          Three pages, 9pt type, bad light. That is the input.
        </span>
      </button>

      {/* §14 contingency: one keystroke, no network. */}
      <button
        type="button"
        onClick={onSeeded}
        disabled={busy}
        className="w-full rounded-xl border border-white/12 py-3 font-mono text-[0.66rem] font-bold uppercase tracking-[0.14em] text-white/50 transition-colors hover:border-white/25 hover:text-white/85 disabled:opacity-40"
      >
        Or run the seeded case
      </button>
    </div>
  );
}

function Provenance({ source, latency }: { source: Source; latency: number | null }) {
  return (
    <div className="flex items-center gap-2 px-1 font-mono text-[0.6rem] uppercase tracking-[0.14em]">
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${
          source === 'live' ? 'bg-[#3FA96B]' : 'bg-[#E5A23F]'
        }`}
      />
      <span className="text-white/45">
        {source === 'live' ? 'Read live from the photograph' : 'Seeded case'}
      </span>
      {latency !== null && (
        <span className="tabular-nums text-white/30">{(latency / 1000).toFixed(1)}s</span>
      )}
      <span className="ml-auto text-white/30">Arithmetic: deterministic</span>
    </div>
  );
}

/**
 * The cheapest striking line the product can produce. It cannot adjudicate pre-existing
 * disease — nothing on a discharge summary can — but the phrase a payer will quote to
 * argue it is right there on the page, verbatim.
 */
function PedTrigger({ phrases }: { phrases: string[] }) {
  return (
    <section className="rounded-2xl border border-[#E5A23F]/25 bg-[#E5A23F]/[0.07] p-5">
      <h2 className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#E5A23F]">
        The sentence they will use
      </h2>
      <p className="mt-2 text-[0.84rem] leading-snug text-white/65">
        We cannot tell you whether they will reject this claim on pre-existing disease —
        that needs the proposal form, which is not in this building. We can tell you the
        exact sentence in your own paperwork they will quote to do it.
      </p>
      {phrases.map((p) => (
        <p
          key={p}
          className="mt-3 rounded-lg bg-black/40 px-3.5 py-3 font-mono text-[0.86rem] text-[#FFD79B]"
        >
          &ldquo;{p}&rdquo;
        </p>
      ))}
    </section>
  );
}

/**
 * The honesty beat, revised. Volunteering the miss is the entire move — see
 * BUILD-TODAY.md, and docs/research/ombudsman-repudiation-grounds.md for the hand-read.
 */
function Coverage() {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.18em] text-white/45">
        What we can and cannot see
      </h2>
      <p className="mt-2 text-[0.84rem] leading-relaxed text-white/65">
        We hand-read 40 public Insurance Ombudsman awards and found 24 repudiation
        grounds. The three largest — pre-existing disease, non-disclosure at proposal,
        and lapsed premium — account for 26 of those 40, and we cannot see a single one of
        them. They need the proposal form, not the discharge summary.
      </p>
      <p className="mt-3 text-[0.84rem] leading-relaxed text-white/65">
        So we do not forecast repudiation. Those claims are already lost and already
        litigated. We forecast <strong className="font-semibold text-white/85">deduction</strong> —
        the slice shaved off claims that do get paid. Of the grounds that produce those, we
        see four fully and twelve partially.
      </p>

      <dl className="mt-4 grid grid-cols-3 gap-2 font-mono">
        {[
          { n: '4', label: 'seen fully', tone: 'text-[#6FD79B]' },
          { n: '12', label: 'seen partly', tone: 'text-[#FFD79B]' },
          { n: '8', label: 'not seen', tone: 'text-[#FF8A8D]' },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-black/30 px-3 py-2.5">
            <dt className={`text-xl font-bold tabular-nums ${s.tone}`}>{s.n}</dt>
            <dd className="mt-0.5 text-[0.58rem] uppercase tracking-[0.1em] text-white/40">
              {s.label}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 border-t border-white/8 pt-3 font-mono text-[0.62rem] leading-relaxed text-white/35">
        Published awards run 2004–2014; nothing after ~2016 is available to read. The
        forecast is Claude reasoning like a TPA medical officer, not a model calibrated on
        real approve/deny pairs — those are held by the payers. Our false-green rate is
        unmeasured, and we say so.
      </p>
    </section>
  );
}
