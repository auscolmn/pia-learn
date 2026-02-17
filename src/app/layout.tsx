import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PIA Learn | Psychedelic Institute Australia",
  description: "Professional training courses for psychedelic-assisted therapy practitioners. Accredited education from Australia's leading psychedelic medicine institute.",
  keywords: ["psychedelic training", "psilocybin course", "MDMA therapy training", "PAT certification", "psychedelic medicine education", "Australia"],
  openGraph: {
    title: "PIA Learn | Professional Psychedelic Training",
    description: "Accredited courses for practitioners entering the psychedelic-assisted therapy space.",
    url: "https://learn.psychedelicinstitute.com.au",
    siteName: "PIA Learn",
    locale: "en_AU",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${plusJakarta.variable} ${instrumentSerif.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
