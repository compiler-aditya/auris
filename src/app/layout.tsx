import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Auris — photograph anything, hear what it has to say.",
  description:
    "Point your camera at a plant, a pigeon, a mug, a temple. Auris listens, then speaks back — in a voice of its own.",
};

/**
 * Root layout is deliberately minimal — each route renders its own chrome
 * (nav, footer) since the design is screen-first and full-bleed.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
