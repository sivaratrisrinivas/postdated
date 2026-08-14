import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'POSTDATED — the rejection letter, three weeks early',
  description:
    'Photograph the discharge summary at the counter and see the insurance rejection ' +
    'letter three weeks before the insurer sends it — while the doctor is still in the ' +
    'building and the paperwork can still be fixed.',
};

/** The demo is a phone photographing paper. Everything is sized for that first. */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0B0B0C',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
