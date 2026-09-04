import { Playfair_Display, DM_Sans, Hind_Siliguri } from 'next/font/google';

export const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
  display: 'swap',
});

export const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

// Main Bengali font for all site text (headings, body copy, buttons, etc).
// NOTE: Bengali digits (০-৯) are intentionally NOT rendered with this font.
// A separate, narrowly-scoped "digit font" is loaded in app/layout.tsx via a
// unicode-range-restricted Google Fonts link, and layered in front of this
// font in the font-family stack (see tailwind.config.ts `body` and the
// inline fontFamily values in InvoiceClient.tsx). That is what keeps digits
// legible without affecting any other character - do not merge them back
// into a single font-family assignment, or the digit-only override will
// silently stop working and every digit will fall back to this font again.
export const hindSiliguri = Hind_Siliguri({
  subsets: ['bengali'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-bengali',
  display: 'swap',
});
