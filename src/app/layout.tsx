import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AuthProvider } from "@/context/auth-context";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4f46e5",
};

export const metadata: Metadata = {
  title: "DocuForge | The Intelligent Document & PDF SaaS Platform",
  description:
    "Convert, merge, split, compress, edit, secure, and automate PDF documents with our Smart Natural Language Workspace and AI document intelligence.",
  keywords: [
    "PDF tools",
    "Word to PDF",
    "PDF to Word",
    "Merge PDF",
    "Compress PDF",
    "Smart PDF Workspace",
    "AI PDF Chat",
    "OCR PDF",
    "Watermark PDF",
  ],
  authors: [{ name: "DocuForge Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} min-h-screen flex flex-col font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100`}>
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
