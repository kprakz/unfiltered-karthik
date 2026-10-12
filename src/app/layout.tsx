import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Karthik (@unfiltered_karthik)",
  description: "One small step each day towards an easy life. Projects I'm building and where to find me.",
  openGraph: {
    title: "Karthik (@unfiltered_karthik)",
    description: "One small step each day towards an easy life.",
    type: "profile",
  },
};

export const viewport: Viewport = {
  themeColor: "#050805",
  colorScheme: "dark",
};

/**
 * Root layout: font, metadata and the page background.
 * @param {LayoutProps<"/">} props `children`: the page to render.
 * @returns {JSX.Element} The full HTML document.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#050805] font-sans text-zinc-100">
        {children}
      </body>
    </html>
  );
}
