import type { Metadata, Viewport } from 'next';
import {
  Geist,
  Geist_Mono,
  Noto_Sans_Devanagari,
  Noto_Sans_Kannada,
} from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

/**
 * The ask sheet is held up to a ward clerk in Bengaluru, so the Kannada has to shape
 * correctly on whatever phone is in the room. Without a bundled Kannada face the
 * conjuncts break apart into separate glyphs, which is visibly wrong to any reader.
 * Same reasoning for Devanagari.
 */
const kannada = Noto_Sans_Kannada({
  variable: '--font-kannada',
  subsets: ['kannada'],
  weight: ['400', '600'],
  display: 'swap',
});

const devanagari = Noto_Sans_Devanagari({
  variable: '--font-devanagari',
  subsets: ['devanagari'],
  weight: ['400', '600'],
  display: 'swap',
});

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
      className={`${geistSans.variable} ${geistMono.variable} ${kannada.variable} ${devanagari.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
