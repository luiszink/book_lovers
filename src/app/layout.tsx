import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Sidebar } from "@/components/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Book Lovers",
  description: "Social Reading – Teile Kindle-Highlights mit Freunden",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex bg-zinc-50 dark:bg-zinc-950">
        <Providers>
          <Sidebar />
          <main className="flex-1 min-w-0 md:ml-64">
            <div className="mx-auto max-w-7xl px-3 pt-14 pb-6 sm:px-4 md:px-8 md:pt-6">
              {children}
            </div>
          </main>
        </Providers>
      </body>
    </html>
  );
}
