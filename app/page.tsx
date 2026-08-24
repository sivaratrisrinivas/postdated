'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useMemo, useRef, useState } from 'react';
import { AskSheet } from '@/components/AskSheet';
import { GuardPanel } from '@/components/GuardPanel';
import { Letter } from '@/components/Letter';
import { compressForUpload } from '@/lib/compress';
import { computeForecast } from '@/lib/deduct';
import {
  amendDemoExtraction,
  demoCaseFor,
  DEMO_CASES,
  type DemoCase,
  type DemoCaseId,
} from '@/lib/demo';
import { isUsableLiveExtraction, UNREADABLE_BILL_ERROR } from '@/lib/extraction-quality';
import { SEEDED_SUMMARY_TEXT } from '@/lib/fixture';
import {
  applySuccessfulRescan,
  provenanceSource,
  shouldUseDemoFallback,
  stageFor,
  withGreyedLines,
  type CaptureMode,
  type JourneyStage,
  type JourneyStatus,
  type ProvenanceSource,
} from '@/lib/journey';
import { NIVA_BUPA_REASSURE_2, type Policy } from '@/lib/policy';
import { LIVE_READER } from '@/lib/reader';
import type { Disallowance, Extraction } from '@/lib/types';

export default function Page() {
  const [status, setStatus] = useState<JourneyStatus>('idle');
  const [reading, setReading] = useState(false);
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [policyBusy, setPolicyBusy] = useState(false);
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [source, setSource] = useState<ProvenanceSource>('demo');
  const [latency, setLatency] = useState<number | null>(null);
  const [resolved, setResolved] = useState<ReadonlySet<string>>(new Set());
  const [resolvedLines, setResolvedLines] = useState<readonly Disallowance[]>([]);
  const [activeLine, setActiveLine] = useState<Disallowance | null>(null);
  const [activeDemoCase, setActiveDemoCase] = useState<DemoCase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const browseInput = useRef<HTMLInputElement>(null);
  const policyInput = useRef<HTMLInputElement>(null);
  const policyBrowseInput = useRef<HTMLInputElement>(null);

  const forecast = useMemo(
    () => (extraction && policy ? computeForecast(extraction, policy) : null),
    [extraction, policy],
  );

  const displayForecast = useMemo(
    () => (forecast ? withGreyedLines(forecast, resolvedLines) : null),
    [forecast, resolvedLines],
  );

  const nextFix = useMemo(
    () =>
      forecast?.lines.find((line) => line.bucket === 'C' && !resolved.has(line.reason)) ?? null,
    [forecast, resolved],
  );

  const applyInitialRead = useCallback((nextExtraction: Extraction, nextSource: ProvenanceSource, nextLatency: number | null) => {
    setExtraction(nextExtraction);
    setSource(nextSource);
    setLatency(nextLatency);
    setResolved(new Set());
    setResolvedLines([]);
    setActiveLine(null);
    setError(null);
    setReading(false);
    setStatus('ready');
  }, []);

  const applyRescan = useCallback(
    (nextExtraction: Extraction, nextSource: ProvenanceSource, nextLatency: number | null) => {
      if (!policy) return;
      const next = applySuccessfulRescan({
        nextExtraction,
        policy,
        resolvedLines,
        nextSource,
        nextLatency,
      });
      setExtraction(next.extraction);
      setSource(next.source);
      setLatency(next.latency);
      setResolvedLines(next.resolvedLines);
      setResolved(new Set(next.resolved));
      setActiveLine(null);
      setError(null);
      setReading(false);
      setStatus(next.status);
    },
    [policy, resolvedLines],
  );

  const capture = useCallback(async (file: File, mode: CaptureMode, demoCase?: DemoCase) => {
    setError(null);
    setReading(true);
    const started = Date.now();
    try {
      const { base64, media_type } = await compressForUpload(file);
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ image: base64, media_type, allow_fixture: mode === 'demo' }),
      });
      const data = await res.json() as { extraction?: Extraction; error?: string; source?: string; latency_ms?: number };
      if (!res.ok || !data.extraction) throw new Error(data.error ?? 'The image could not be read.');
      if (data.source === 'live' && !isUsableLiveExtraction(data.extraction)) {
        throw new Error(data.error ?? UNREADABLE_BILL_ERROR);
      }
      const nextSource = provenanceSource(data.source, mode);
      const nextLatency = data.latency_ms ?? Date.now() - started;
      if (mode !== 'demo') setActiveDemoCase(null);
      if (mode === 'rescan') applyRescan(data.extraction, nextSource, nextLatency);
      else applyInitialRead(data.extraction, nextSource, nextLatency);
    } catch (readError) {
      if (shouldUseDemoFallback(mode) && demoCase) {
        applyInitialRead(demoCase.fallback, 'demo', null);
        return;
      }
      setError(readError instanceof Error ? readError.message : 'The image could not be read.');
      setReading(false);
      setStatus(mode === 'rescan' ? 'rescan' : 'idle');
    }
  }, [applyInitialRead, applyRescan]);

  const runDemoCase = useCallback((id: DemoCaseId) => {
    const demoCase = demoCaseFor(id);
    setActiveDemoCase(demoCase);
    setError(null);
    applyInitialRead(demoCase.fallback, 'demo', null);
  }, [applyInitialRead]);

  const loadPickedPolicy = useCallback(() => {
    setPolicy(NIVA_BUPA_REASSURE_2);
    setError(null);
    setStatus('idle');
  }, []);

  const loadPolicyPhoto = useCallback(async (file: File) => {
    setPolicyBusy(true);
    setError(null);
    try {
      const { base64, media_type } = await compressForUpload(file);
      const res = await fetch('/api/policy', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ image: base64, media_type }),
      });
      const data = await res.json();
      if (!res.ok || !data.policy) throw new Error(data.error ?? 'The policy page could not be read.');
      setPolicy(data.policy as Policy);
      setStatus('idle');
    } catch (policyError) {
      setError(policyError instanceof Error ? policyError.message : 'The policy page could not be read.');
    } finally {
      setPolicyBusy(false);
    }
  }, []);

  const resolve = useCallback((line: Disallowance) => {
    const nextLines = [...resolvedLines.filter((item) => item.reason !== line.reason), line];
    setResolvedLines(nextLines);
    setResolved(new Set(nextLines.map((item) => item.reason)));
    setActiveLine(null);
    setError(null);
    setStatus('rescan');
  }, [resolvedLines]);

  const openNextFix = useCallback(() => {
    if (nextFix) setActiveLine(nextFix);
  }, [nextFix]);

  const startFresh = useCallback(() => {
    setStatus('idle');
    setReading(false);
    setExtraction(null);
    setSource('demo');
    setLatency(null);
    setResolved(new Set());
    setResolvedLines([]);
    setActiveLine(null);
    setActiveDemoCase(null);
    setError(null);
    if (fileInput.current) fileInput.current.value = '';
    if (browseInput.current) browseInput.current.value = '';
  }, []);

  const stage = stageFor({
    hasPolicy: Boolean(policy),
    hasActiveLine: Boolean(activeLine),
    status,
  });

  return (
    <main className="site-shell">
      <SiteNav stage={stage} onStartFresh={startFresh} />

      {stage === 'policy' && (
        <PolicyStage
          busy={policyBusy}
          error={error}
          onPickInsurer={loadPickedPolicy}
          onPickPhoto={() => policyInput.current?.click()}
          onPickExisting={() => policyBrowseInput.current?.click()}
        />
      )}

      {stage === 'capture' && (
        <CaptureStage
          busy={reading}
          error={error}
          onPickCamera={() => fileInput.current?.click()}
          onPickExisting={() => browseInput.current?.click()}
          onDemoCase={runDemoCase}
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
          if (file) void capture(file, status === 'rescan' ? 'rescan' : 'custom', activeDemoCase ?? undefined);
          event.target.value = '';
        }}
      />

      <input
        ref={browseInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void capture(file, status === 'rescan' ? 'rescan' : 'custom', activeDemoCase ?? undefined);
          event.target.value = '';
        }}
      />

      <input
        ref={policyInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void loadPolicyPhoto(file);
          event.target.value = '';
        }}
      />

      <input
        ref={policyBrowseInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void loadPolicyPhoto(file);
          event.target.value = '';
        }}
      />

      {stage === 'forecast' && displayForecast && extraction && policy && (
        <ForecastStage
          forecast={displayForecast}
          extraction={extraction}
          resolved={resolved}
          policy={policy}
          source={source}
          latency={latency}
          nextFix={nextFix}
          onOpenNextFix={openNextFix}
          onOpenLine={setActiveLine}
          onStartFresh={startFresh}
        />
      )}

      {stage === 'rescan' && extraction && activeDemoCase && (
        <RescanStage
          busy={reading}
          error={error}
          onPick={() => fileInput.current?.click()}
          onChoose={() => browseInput.current?.click()}
          onDemoScan={() => {
            const line = resolvedLines[resolvedLines.length - 1];
            if (line) applyRescan(amendDemoExtraction(extraction, line), 'demo', null);
          }}
          onBack={() => setStatus('ready')}
        />
      )}

      {stage === 'rescan' && extraction && !activeDemoCase && (
        <RescanStage
          busy={reading}
          error={error}
          onPick={() => fileInput.current?.click()}
          onChoose={() => browseInput.current?.click()}
          onBack={() => setStatus('ready')}
        />
      )}

      {stage === 'complete' && displayForecast && policy && (
        <CompletionStage
          forecast={displayForecast}
          resolved={resolved}
          policy={policy}
          resolvedLines={resolvedLines}
          source={source}
          latency={latency}
          onOpenLine={setActiveLine}
          onStartFresh={startFresh}
        />
      )}

      {stage === 'action' && activeLine && (
        <AskSheet line={activeLine} onResolve={resolve} onClose={() => setActiveLine(null)} />
      )}
    </main>
  );
}

function PolicyStage({
  busy,
  error,
  onPickInsurer,
  onPickPhoto,
  onPickExisting,
}: {
  busy: boolean;
  error: string | null;
  onPickInsurer: () => void;
  onPickPhoto: () => void;
  onPickExisting: () => void;
}) {
  return (
    <section className="policy-stage" aria-busy={busy} aria-labelledby="policy-title">
      <div className="policy-copy">
        <p className="step-count">Set the rule before reading the bill</p>
        <h1 id="policy-title" className="display-title">
          Start with the policy that decides what <em>counts.</em>
        </h1>
        <p className="stage-lede">
          Pick a supported insurer for the quickest demo, or photograph the room-rent page from a
          policy schedule. Every rupee in the future letter will point back to this choice.
        </p>
      </div>

      <div className="policy-choice-area">
        <button type="button" className="policy-choice policy-choice-primary" onClick={onPickInsurer} disabled={busy}>
          <span>
            <strong>Niva Bupa · ReAssure 2.0</strong>
            <small>Pre-parsed policy schedule · ready now</small>
          </span>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path d="M3 9h11M9.5 4.5 14 9l-4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <button type="button" className="policy-choice" onClick={onPickPhoto} disabled={busy}>
          <span>
            <strong>{busy ? 'Reading the policy page…' : 'Photograph a policy page'}</strong>
            <small>Live {LIVE_READER.provider} read · needs {LIVE_READER.env}</small>
          </span>
          <span className="policy-choice-note">JPG / PNG</span>
        </button>

        <button type="button" className="policy-choice" onClick={onPickExisting} disabled={busy}>
          <span>
            <strong>Choose an existing policy photo</strong>
            <small>Same live reader · fails clearly without {LIVE_READER.env}</small>
          </span>
          <span className="policy-choice-note">JPG / PNG</span>
        </button>

        {error && (
          <p className="inline-error" role="alert" aria-live="assertive">
            {error}
          </p>
        )}

        <p className="policy-footnote">
          POSTDATED does not guess an insurer from a bill. Load the rule first, then read the
          discharge paperwork against it.
        </p>
      </div>
    </section>
  );
}

function SiteNav({
  stage,
  onStartFresh,
}: {
  stage: JourneyStage;
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
        {stage !== 'policy' && stage !== 'capture' && (
          <button type="button" className="nav-new-check" onClick={onStartFresh}>
            New check
          </button>
        )}
        <span className="nav-status">
          <span className="status-dot" aria-hidden />
          {stage === 'policy' ? 'Choose a policy' : stage === 'capture' ? 'Session ready' : 'Session private'}
        </span>
      </nav>
    </header>
  );
}

function CaptureStage({
  busy,
  error,
  onPickCamera,
  onPickExisting,
  onDemoCase,
}: {
  busy: boolean;
  error: string | null;
  onPickCamera: () => void;
  onPickExisting: () => void;
  onDemoCase: (id: DemoCaseId) => void;
}) {
  return (
    <section className="journey-stage" id="journey" aria-busy={busy}>
      <div className="stage-copy">
        <p className="step-count">01 / 03 · Bring the paperwork</p>
        <h1 className="display-title">
          Find the page that still has <em>time.</em>
        </h1>
        <p className="stage-lede">
          Photograph the discharge summary and final bill. POSTDATED shows the insurance
          deduction before the file leaves the hospital — while the doctor and ward records are
          still close enough to ask.
        </p>

        <div className="capture-actions">
          <button type="button" className="primary-action" onClick={onPickCamera} disabled={busy}>
            {busy ? 'Reading the paperwork…' : 'Take a photo of the paperwork'}
            {!busy && (
              <svg className="action-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M2 8h11M8.5 3.5 13 8l-4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <button type="button" className="text-action" onClick={onPickExisting} disabled={busy}>
            Choose an existing photo
          </button>
        </div>

        {error && (
          <p className="inline-error" role="alert" aria-live="assertive">
            {error}
          </p>
        )}

        <p className="capture-explanation">
          Use the rear camera when the paper is at the counter, or choose a photo already on the
          device. A custom photo is read live by {LIVE_READER.provider} ({LIVE_READER.model}) and
          needs {LIVE_READER.env} on the server. Without that key the upload fails with an error —
          it does not silently become the seeded case. The three committed demo cases below still
          complete without a key.
        </p>

        <div className="demo-case-area">
          <p className="step-count">Run a committed demo case</p>
          <div className="demo-case-grid">
            {DEMO_CASES.map((demoCase) => (
              <button
                key={demoCase.id}
                type="button"
                className="demo-case"
                onClick={() => onDemoCase(demoCase.id)}
                disabled={busy}
              >
                {demoCase.format === 'image' && demoCase.asset ? (
                  <Image
                    className="demo-case-preview"
                    src={demoCase.asset}
                    alt=""
                    width={96}
                    height={72}
                  />
                ) : (
                  <span className="demo-case-format" aria-hidden>
                    {demoCase.format === 'pdf' ? 'PDF' : 'FIX'}
                  </span>
                )}
                <span className="demo-case-copy">
                  <strong>{demoCase.title}</strong>
                  <small>{demoCase.description}</small>
                </span>
                <svg className="demo-case-arrow" width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
                  <path d="M2.25 7.5h10.1M8.25 3.4l4.1 4.1-4.1 4.1" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>
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

function RescanStage({
  busy,
  error,
  onPick,
  onChoose,
  onDemoScan,
  onBack,
}: {
  busy: boolean;
  error: string | null;
  onPick: () => void;
  onChoose: () => void;
  onDemoScan?: () => void;
  onBack: () => void;
}) {
  return (
    <section className="rescan-stage" aria-busy={busy} aria-labelledby="rescan-title">
      <div className="rescan-copy">
        <p className="step-count">After the ask · prove the change</p>
        <h1 id="rescan-title" className="display-title">
          Now photograph the page you <em>changed.</em>
        </h1>
        <p className="stage-lede">
          Put the document or signed answer back in the frame. POSTDATED will read it again,
          remove what is now present, and leave the unresolved red lines visible.
        </p>
      </div>

      <div className="rescan-actions">
        <button type="button" className="primary-action" onClick={onPick} disabled={busy}>
          {busy ? 'Reading the amended page…' : 'Re-photograph the amended summary'}
          {!busy && (
            <svg className="action-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M2 8h11M8.5 3.5 13 8l-4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
        <button type="button" className="text-action" onClick={onChoose} disabled={busy}>
          Choose an amended photo
        </button>
        {onDemoScan && (
          <button type="button" className="text-action" onClick={onDemoScan} disabled={busy}>
            Run the amended demo scan
          </button>
        )}
        <button type="button" className="back-action" onClick={onBack} disabled={busy}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
            <path d="M12.25 7.5H2.75M6.5 3.25 2.25 7.5l4.25 4.25" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to the forecast
        </button>
        {error && (
          <p className="inline-error" role="alert" aria-live="assertive">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

function ForecastStage({
  forecast,
  extraction,
  resolved,
  policy,
  source,
  latency,
  nextFix,
  onOpenNextFix,
  onOpenLine,
  onStartFresh,
}: {
  forecast: ReturnType<typeof computeForecast>;
  extraction: Extraction;
  resolved: ReadonlySet<string>;
  policy: Policy;
  source: ProvenanceSource;
  latency: number | null;
  nextFix: Disallowance | null;
  onOpenNextFix: () => void;
  onOpenLine: (line: Disallowance) => void;
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
          <Letter forecast={forecast} resolved={resolved} policy={policy} onLineSelect={onOpenLine} />
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

        </aside>
      </div>
    </section>
  );
}

function CompletionStage({
  forecast,
  resolved,
  policy,
  resolvedLines,
  source,
  latency,
  onOpenLine,
  onStartFresh,
}: {
  forecast: ReturnType<typeof computeForecast>;
  resolved: ReadonlySet<string>;
  policy: Policy;
  resolvedLines: readonly Disallowance[];
  source: ProvenanceSource;
  latency: number | null;
  onOpenLine: (line: Disallowance) => void;
  onStartFresh: () => void;
}) {
  const recovered = resolvedLines
    .reduce((sum, line) => sum + line.amount, 0);
  const remaining = forecast.lines
    .filter((line) => !resolved.has(line.reason))
    .reduce((sum, line) => sum + line.amount, 0);

  return (
    <section className="completion-stage" aria-labelledby="completion-title">
      <div className="completion-copy">
        <p className="step-count">Final result · after your action</p>
        <h1 id="completion-title" className="completion-title">
          Now you can see what the letter carries.
        </h1>
        <p className="completion-lede">
          Your document or doctor action is recorded for this check. The updated letter keeps only
          the lines that still need a policy or bill decision.
        </p>

        <dl className="result-summary">
          <div>
            <dt>Recovered from this check</dt>
            <dd className="result-recovered">{rupees(recovered)}</dd>
          </div>
          <div>
            <dt>Still shown as disallowed</dt>
            <dd>{rupees(remaining)}</dd>
          </div>
        </dl>

        <button type="button" className="primary-action" onClick={onStartFresh}>
          Start a fresh check
          <svg className="action-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M2 8h11M8.5 3.5 13 8l-4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <Provenance source={source} latency={latency} />
      </div>

      <div className="letter-frame completion-letter-frame">
        <Letter forecast={forecast} resolved={resolved} policy={policy} onLineSelect={onOpenLine} />
      </div>
    </section>
  );
}

function Provenance({ source, latency }: { source: ProvenanceSource; latency: number | null }) {
  const label =
    source === 'live'
      ? 'Read live from the photograph'
      : source === 'demo'
        ? 'Preconfigured demo case'
        : 'Fallback fixture';

  return (
    <div className="provenance-line" aria-label="Forecast provenance">
      <span className="status-dot" aria-hidden />
      <span>{label}</span>
      {latency !== null && <span>{(latency / 1000).toFixed(1)}s</span>}
      <span className="deterministic">Arithmetic · deterministic</span>
    </div>
  );
}

function rupees(value: number): string {
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
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
