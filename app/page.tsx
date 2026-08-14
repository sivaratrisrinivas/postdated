'use client';

import Image from 'next/image';
import Link from 'next/link';
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

  const nextFix = useMemo(
    () =>
      forecast?.lines.find((line) => line.bucket === 'C' && !resolved.has(line.reason)) ?? null,
    [forecast, resolved],
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
    } catch {
      // §14 contingency: the demo never dies on the capture path.
      setExtraction(SEEDED_EXTRACTION);
      setSource('fixture');
      setLatency(null);
    }
    setResolved(new Set());
    setActiveLine(null);
    setStatus('ready');
  }, []);

  const runSeeded = useCallback(() => {
    setExtraction(SEEDED_EXTRACTION);
    setSource('fixture');
    setLatency(null);
    setResolved(new Set());
    setActiveLine(null);
    setStatus('ready');
  }, []);

  const resolve = useCallback((reason: string) => {
    setResolved((prev) => new Set(prev).add(reason));
    setActiveLine(null);
  }, []);

  const openNextFix = useCallback(() => {
    if (nextFix) setActiveLine(nextFix);
  }, [nextFix]);

  const startFresh = useCallback(() => {
    setStatus('idle');
    setExtraction(null);
    setSource('live');
    setLatency(null);
    setResolved(new Set());
    setActiveLine(null);
    if (fileInput.current) fileInput.current.value = '';
  }, []);

  const stage = activeLine ? 'action' : status === 'ready' ? 'forecast' : 'capture';

  return (
    <main className="site-shell">
      <SiteNav stage={stage} onStartFresh={startFresh} />

      {stage === 'capture' && (
        <CaptureStage
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
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void capture(file);
          event.target.value = '';
        }}
      />

      {stage === 'forecast' && forecast && extraction && (
        <ForecastStage
          forecast={forecast}
          extraction={extraction}
          resolved={resolved}
          source={source}
          latency={latency}
          nextFix={nextFix}
          onOpenNextFix={openNextFix}
          onPick={() => fileInput.current?.click()}
          onStartFresh={startFresh}
        />
      )}

      {stage === 'action' && activeLine && (
        <AskSheet line={activeLine} onResolve={resolve} onClose={() => setActiveLine(null)} />
      )}
    </main>
  );
}

function SiteNav({
  stage,
  onStartFresh,
}: {
  stage: 'capture' | 'forecast' | 'action';
  onStartFresh: () => void;
}) {
  return (
    <header className="site-nav">
      <Link className="brand-lockup" href="/" aria-label="POSTDATED home">
        <Image
          className="brand-mark"
          src="/brand/postdated-mark.png"
          alt=""
          width={512}
          height={512}
          priority
        />
        <span className="brand-wordmark">POSTDATED</span>
      </Link>

      <nav className="nav-links" aria-label="Primary navigation">
        <span className="nav-context">Hospital discharge counter</span>
        {stage !== 'capture' && (
          <button type="button" className="nav-new-check" onClick={onStartFresh}>
            New check
          </button>
        )}
        <span className="nav-status">
          <span className="status-dot" aria-hidden />
          {stage === 'capture' ? 'Session ready' : 'Session private'}
        </span>
      </nav>
    </header>
  );
}

function CaptureStage({
  busy,
  onPick,
  onSeeded,
}: {
  busy: boolean;
  onPick: () => void;
  onSeeded: () => void;
}) {
  return (
    <section className="journey-stage" id="journey" aria-busy={busy}>
      <div className="stage-copy">
        <p className="step-count">01 / 03 · Start at the counter</p>
        <h1 className="display-title">
          Find the page that still has <em>time.</em>
        </h1>
        <p className="stage-lede">
          Photograph the discharge summary and final bill. POSTDATED shows the insurance
          deduction before the file leaves the hospital — while the doctor and ward records are
          still close enough to ask.
        </p>

        <div className="capture-actions">
          <button type="button" className="primary-action" onClick={onPick} disabled={busy}>
            {busy ? 'Reading the paperwork…' : 'Photograph the paperwork'}
            {!busy && (
              <svg className="action-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M2 8h11M8.5 3.5 13 8l-4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <button type="button" className="text-action" onClick={onSeeded} disabled={busy}>
            See a worked case instead
          </button>
        </div>

        <p className="privacy-note">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M7 1.25 11.25 3v3.27c0 2.58-1.68 4.92-4.25 5.73C4.43 11.2 2.75 8.85 2.75 6.27V3L7 1.25Z" stroke="currentColor" strokeWidth="1.1" />
            <path d="m5.1 6.9 1.2 1.2 2.6-2.7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Session-only by design. Your document is compressed for the read and is not retained.
        </p>
      </div>

      <div className="counter-scene" aria-hidden="true">
        <span className="scene-label">A claim, three weeks early</span>
        <div className="scene-paper">
          <p className="scene-paper-label">Claims adjudication</p>
          <p className="scene-paper-date">Future letter · 26 days ahead</p>
          <p className="scene-paper-amount">₹1,73,000</p>
          <div className="scene-lines">
            <span className="scene-line" />
            <span className="scene-line" />
            <span className="scene-line" />
            <span className="scene-line" />
          </div>
        </div>
        <p className="scene-caption">The only useful warning is one you can still act on.</p>
      </div>
    </section>
  );
}

function ForecastStage({
  forecast,
  extraction,
  resolved,
  source,
  latency,
  nextFix,
  onOpenNextFix,
  onPick,
  onStartFresh,
}: {
  forecast: ReturnType<typeof computeForecast>;
  extraction: Extraction;
  resolved: ReadonlySet<string>;
  source: Source;
  latency: number | null;
  nextFix: Disallowance | null;
  onOpenNextFix: () => void;
  onPick: () => void;
  onStartFresh: () => void;
}) {
  return (
    <section className="reading-stage">
      <div className="reading-intro">
        <div>
          <p className="step-count">02 / 03 · Read the future</p>
          <h1 className="reading-title">Here is the letter, before it is real.</h1>
        </div>
        <p className="reading-intro-copy">
          The big number is the part worth acting on. Start with the largest line marked{' '}
          <strong>fixable now</strong>; the rest stays visible so the forecast stays honest.
        </p>
      </div>

      <div className="forecast-layout">
        <div className="letter-frame">
          <Letter forecast={forecast} resolved={resolved} />
        </div>

        <aside className="forecast-side">
          {nextFix ? (
            <>
              <p className="step-count">Your next move</p>
              <p className="forecast-side-copy">
                The highest-value line you can still address is <strong>{nextFix.reason}</strong>.
                One physical ask. Then the letter can change.
              </p>
              <button type="button" className="primary-action primary-fix" onClick={onOpenNextFix}>
                Open the fix
                <svg className="action-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M2 8h11M8.5 3.5 13 8l-4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </>
          ) : (
            <div className="completion-card" role="status" aria-live="polite">
              <span className="completion-mark" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="m3.5 9.2 3.2 3.2 7.3-7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <p className="step-count">
                {resolved.size > 0 ? '03 / 03 · Check complete' : 'Read complete'}
              </p>
              <h2>{resolved.size > 0 ? 'The fix is recorded.' : 'This read is complete.'}</h2>
              <p>
                {resolved.size > 0
                  ? 'You have handled every recoverable line in this forecast. Start another check whenever a new file reaches the counter.'
                  : 'There is no recoverable line to ask for in this read. You can begin with a different discharge file.'}
              </p>
              <button type="button" className="primary-action" onClick={onStartFresh}>
                Start a fresh check
                <svg className="action-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M2 8h11M8.5 3.5 13 8l-4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}

          <Provenance source={source} latency={latency} />

          <p className="side-note">
            This is a forecast, not a letter issued by an insurer. Arithmetic is deterministic;
            the photographed record is the source of every clinical phrase.
          </p>

          <details className="details-drawer">
            <summary>Why this forecast is safe</summary>
            <div className="details-content">
              {extraction.ped_trigger_phrases.length > 0 && (
                <PedTrigger phrases={extraction.ped_trigger_phrases} />
              )}
              <Coverage />
              <GuardPanel sourceText={SEEDED_SUMMARY_TEXT} />
            </div>
          </details>

          <button type="button" className="text-action" onClick={onPick}>
            Scan an amended summary
          </button>
        </aside>
      </div>
    </section>
  );
}

function Provenance({ source, latency }: { source: Source; latency: number | null }) {
  return (
    <div className="provenance-line" aria-label="Forecast provenance">
      <span className="status-dot" aria-hidden />
      <span>{source === 'live' ? 'Read live from the photograph' : 'Seeded case'}</span>
      {latency !== null && <span>{(latency / 1000).toFixed(1)}s</span>}
      <span className="deterministic">Arithmetic · deterministic</span>
    </div>
  );
}

function PedTrigger({ phrases }: { phrases: string[] }) {
  return (
    <section className="support-panel">
      <h2>The sentence they may quote</h2>
      <p>
        We cannot adjudicate pre-existing disease from this paperwork. We can show the exact
        phrase in the record a payer may quote to argue it.
      </p>
      {phrases.map((phrase) => (
        <p key={phrase} className="doctor-ask">
          “{phrase}”
        </p>
      ))}
    </section>
  );
}

function Coverage() {
  return (
    <section className="support-panel">
      <h2>What the read can and cannot see</h2>
      <p>
        The forecast covers deduction grounds visible in the discharge paperwork. It does not
        infer proposal-form facts such as pre-existing disease, non-disclosure, or a lapsed
        premium.
      </p>
      <p>
        The hand-read public Ombudsman taxonomy contains 4 grounds seen fully, 12 partly, and 8
        not visible from this document.
      </p>
    </section>
  );
}
