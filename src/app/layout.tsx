import type { Metadata, Viewport } from "next";
import { Geist, Pixelify_Sans } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const pixelify = Pixelify_Sans({
  variable: "--font-pixelify",
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
  themeColor: "#7ec0ff",
  colorScheme: "light",
};

/**
 * Root layout: font, metadata and the page background.
 * @param {LayoutProps<"/">} props `children`: the page to render.
 * @returns {JSX.Element} The full HTML document.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${pixelify.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#9fd3ff] font-sans text-[#2b2b2b]">
        {children}
      </body>
    </html>
  );
}
