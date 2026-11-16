import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MathVision — Handwritten Math Solver",
  description:
    "End-to-end handwritten mathematical expression recognition and solver powered by a custom CNN and symbolic mathematics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
