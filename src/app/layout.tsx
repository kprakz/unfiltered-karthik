import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

/**
 * Root layout: font, metadata and the page background.
 * @param {LayoutProps<"/">} props `children`: the page to render.
 * @returns {JSX.Element} The full HTML document.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        {children}
      </body>
    </html>
  );
}
