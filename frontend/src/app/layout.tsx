import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReactQueryProvider } from "@/lib/react-query";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { SuppressConsoleErrors } from "@/components/SuppressConsoleErrors";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MANSATASK - Payment Link Platform",
  description: "Production-grade Payment Link Platform for mobile money payments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased`}
      >
        <SuppressConsoleErrors />
        <ReactQueryProvider>
          <ToastProvider>{children}</ToastProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
