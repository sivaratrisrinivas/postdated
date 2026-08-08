import { SEEDED_EXTRACTION, SEEDED_SUMMARY_TEXT } from '@/lib/fixture';

/**
 * The paper. §13, 0:20–0:35: "photograph a printed discharge summary lying on the
 * judges' table" — so this page exists to be printed, not read on screen.
 *
 * It carries the final bill as well as the summary, because the extraction has to find
 * line items somewhere. Print at A4, portrait, no scaling.
 */

export const metadata = { title: 'Discharge summary — print me' };

export default function SummaryPage() {
  const lines = SEEDED_EXTRACTION.bill_lines;
  const total = lines.reduce((sum, l) => sum + l.amount, 0);

  return (
    <div className="min-h-full bg-white text-black">
      <div className="mx-auto max-w-[820px] px-8 py-10 print:px-0 print:py-0">
        <p className="mb-6 rounded-lg bg-black/5 px-4 py-2.5 font-mono text-[0.68rem] text-black/50 print:hidden">
          Print this at A4, portrait, 100% scale. Lay it on the table and photograph it.
        </p>

        {/* Deliberately plain: mono, tight leading, no design. A real ward printout. */}
        <pre className="whitespace-pre-wrap font-mono text-[0.78rem] leading-[1.6] text-black">
          {SEEDED_SUMMARY_TEXT}
        </pre>

        <hr className="my-8 border-t border-dashed border-black/30" />

        <div className="font-mono text-[0.78rem] leading-[1.6]">
          <p className="font-bold uppercase tracking-wide">
            KRISHNA MULTISPECIALITY HOSPITAL, BENGALURU
          </p>
          <p className="mt-1">FINAL BILL &mdash; IP No: 2026/08/4471</p>
          <p>Ramachandra P., 71/M &middot; Admitted 04-08-2026 &middot; Discharged 08-08-2026</p>
          <p>Ward: Deluxe Single Room @ Rs. 8,000 per day &times; 4 nights</p>

          <table className="mt-5 w-full border-collapse">
            <thead>
              <tr className="border-y border-black">
                <th className="py-1.5 text-left font-bold">Particulars</th>
                <th className="py-1.5 text-right font-bold">Amount (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.label} className="border-b border-black/15">
                  <td className="py-1.5 pr-4">{line.label}</td>
                  <td className="py-1.5 text-right tabular-nums">
                    {line.amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-y-2 border-black">
                <th className="py-2 text-left font-bold uppercase">Total payable</th>
                <th className="py-2 text-right font-bold tabular-nums">
                  {total.toLocaleString('en-IN')}
                </th>
              </tr>
            </tfoot>
          </table>

          <p className="mt-8">For KRISHNA MULTISPECIALITY HOSPITAL</p>
          <p className="mt-8 border-t border-black/40 pt-1 inline-block">Authorised Signatory</p>
        </div>
      </div>
    </div>
  );
}
