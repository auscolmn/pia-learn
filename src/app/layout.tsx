import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Enrol Studio | Create and Sell Online Courses",
  description: "The all-in-one platform for creators and educators to build, host, and sell professional online courses. Beautiful course builder, video hosting, payments, and certificates.",
  keywords: ["online courses", "course builder", "sell courses", "video hosting", "LMS", "e-learning platform", "course creator"],
  openGraph: {
    title: "Enrol Studio | Create and Sell Online Courses",
    description: "The all-in-one platform for creators and educators to build, host, and sell professional online courses.",
    url: "https://enrolstudio.com",
    siteName: "Enrol Studio",
    locale: "en_US",
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
      <body className={`${plusJakarta.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
