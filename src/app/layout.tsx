import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LearnStudio | Modern LMS with Usage-Based Pricing",
  description: "The multi-tenant LMS platform with transparent usage-based pricing. Pay only for active students and resources you use. No fixed tiers, no surprises.",
  keywords: ["LMS", "learning management system", "online courses", "usage-based pricing", "multi-tenant", "white-label", "course builder", "e-learning platform"],
  openGraph: {
    title: "LearnStudio | Modern LMS with Usage-Based Pricing",
    description: "The multi-tenant LMS platform with transparent usage-based pricing. Pay only for what you use.",
    url: "https://learnstudio.com",
    siteName: "LearnStudio",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LearnStudio | Modern LMS with Usage-Based Pricing",
    description: "Pay only for active students. No fixed tiers, no surprises.",
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
        <Toaster />
      </body>
    </html>
  );
}
