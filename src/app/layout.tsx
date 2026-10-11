import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "StrengthWise AI — Intelligent Strength & Nutrition Coach",
  description:
    "Next-generation AI-powered fitness, workout tracking, and adaptive sports nutrition.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for (var r of registrations) { r.unregister(); }
                  });
                }
                if ('caches' in window) {
                  caches.keys().then(function(names) {
                    for (var name of names) { caches.delete(name); }
                  });
                }
              }
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} min-h-screen bg-neutral-950 text-neutral-100 antialiased flex flex-col font-sans`}
      >
        <Navbar />
        <main id="main-content" className="flex-1 w-full overflow-y-auto scroll-smooth">
          {children}
        </main>
      </body>
    </html>
  );
}
