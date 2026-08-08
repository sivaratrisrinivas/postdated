import { SEEDED_EXTRACTION, SEEDED_SUMMARY_TEXT } from '@/lib/fixture';

/**
 * The paper. §13, 0:20–0:35: "photograph a printed discharge summary lying on the
 * judges' table" — so this page exists to be printed, not read on screen.
 *
 * It has to fit **one A4 sheet**, because the extraction needs the clinical narrative
 * and the itemised bill in the same photograph: the narrative supplies the
 * unestablished-statement and PED-phrase beats, the bill supplies the line items. Two
 * sheets means two photos, and the opening beat is one photo.
 *
 * So it is set dense — roughly 9pt at print, tight leading, minimal gaps. That is not a
 * compromise; §6 describes the real input as "9pt type, three pages, handwriting,
 * abbreviations, photographed at an angle under bad light". Dense is authentic.
 */

export const metadata = { title: 'Discharge summary — print me' };

export default function SummaryPage() {
  const lines = SEEDED_EXTRACTION.bill_lines;
  const total = lines.reduce((sum, l) => sum + l.amount, 0);

  return (
    <div className="min-h-full bg-white text-black">
      {/* A4 portrait with 12mm margins, and nothing scaled by the browser. */}
      <style>{`@page { size: A4 portrait; margin: 12mm; }`}</style>

      <div className="mx-auto max-w-[760px] px-6 py-8 print:max-w-none print:px-0 print:py-0">
        <p className="mb-5 rounded-lg bg-black/5 px-4 py-2.5 font-mono text-[0.68rem] text-black/50 print:hidden">
          Print at A4, portrait, 100% scale, no headers or footers. It is built to fit one
          sheet so the whole thing lands in a single photograph.
        </p>

        {/* 0.72rem lands around 11pt at print. Denser than a web page, and still one
            sheet with room to spare — but a size the camera reads reliably at an angle,
            which matters more here than matching 9pt exactly. */}
        <div className="font-mono text-[0.72rem] leading-[1.45] text-black">
          <pre className="whitespace-pre-wrap font-mono">{compact(SEEDED_SUMMARY_TEXT)}</pre>

          <hr className="my-3 border-t border-dashed border-black/40" />

          <p className="font-bold uppercase">Krishna Multispeciality Hospital, Bengaluru</p>
          <p>
            FINAL BILL &middot; IP No: 2026/08/4471 &middot; Ramachandra P., 71/M &middot;
            04-08-2026 to 08-08-2026
          </p>
          <p>Ward: Deluxe Single Room @ Rs. 8,000 per day &times; 4 nights</p>

          <table className="mt-2 w-full border-collapse">
            <thead>
              <tr className="border-y border-black">
                <th className="py-0.5 text-left font-bold">Particulars</th>
                <th className="py-0.5 text-right font-bold">Amount (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.label} className="border-b border-black/15">
                  <td className="py-0.5 pr-4">{line.label}</td>
                  <td className="py-0.5 text-right tabular-nums">
                    {line.amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-y-2 border-black">
                <th className="py-1 text-left font-bold uppercase">Total payable</th>
                <th className="py-1 text-right font-bold tabular-nums">
                  {total.toLocaleString('en-IN')}
                </th>
              </tr>
            </tfoot>
          </table>

          <p className="mt-4">For Krishna Multispeciality Hospital</p>
          <p className="mt-6 inline-block border-t border-black/40 pt-0.5">
            Authorised Signatory
          </p>
        </div>
      </div>
    </div>
  );
}

/** Collapse the blank lines between sections. A real ward printout does not waste paper. */
function compact(text: string): string {
  return text.replace(/\n{2,}/g, '\n');
}
