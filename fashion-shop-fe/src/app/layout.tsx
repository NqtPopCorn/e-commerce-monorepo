import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fashion Shop - Admin Portal",
  description: "Fashion Shop Monorepo Admin Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground selection:bg-primary selection:text-primary-foreground min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
