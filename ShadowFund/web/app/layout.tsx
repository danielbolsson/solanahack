import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import AppWalletProvider from "./components/AppWalletProvider";
import Header from "./components/Header";

export const metadata: Metadata = {
  title: "ShadowFund | Privacy-First Crowdfunding",
  description: "Secure, anonymous, and compliant crowdfunding for the modern era.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[var(--color-charcoal-900)] text-[var(--color-text-primary)] min-h-screen flex flex-col selection:bg-[var(--color-teal-500)] selection:text-black">
        <AppWalletProvider>
          <Header />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#141518',
                color: '#EDEDED',
                border: '1px solid #1C1E23',
              },
              success: {
                iconTheme: {
                  primary: '#2DD4BF',
                  secondary: '#0B0C0E',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#0B0C0E',
                },
              },
            }}
          />
          <main className="flex-grow pt-24 px-6 relative z-10 pb-20">
            <div className="max-w-6xl mx-auto w-full">
              {children}
            </div>
          </main>

          <footer className="border-t border-[var(--color-charcoal-700)] py-12 mt-auto bg-[var(--color-charcoal-900)]">
            <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-sm text-[var(--color-text-tertiary)] gap-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[var(--color-charcoal-700)]"></div>
                <p>&copy; 2026 ShadowFund. Built for the shadows.</p>
              </div>
              <div className="flex gap-8">
                <a href="#" className="hover:text-[var(--color-text-secondary)] transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-[var(--color-text-secondary)] transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-[var(--color-text-secondary)] transition-colors">GitHub</a>
              </div>
            </div>
          </footer>
        </AppWalletProvider>
      </body>
    </html>
  );
}
