import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Header } from "@/components/header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CricScheduler — Cricket Match Manager",
  description: "Manage amateur cricket matches for your WhatsApp group",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        <Header />
        <main className="mx-auto min-h-[calc(100vh-57px)] max-w-lg px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
