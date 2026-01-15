"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function Header() {
    const pathname = usePathname();

    return (
        <header className="fixed top-0 w-full z-50 glass-header border-b border-[var(--color-charcoal-700)]">
            <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--color-teal-500)] to-[var(--color-teal-900)] flex items-center justify-center shadow-lg shadow-teal-900/20 group-hover:shadow-teal-500/20 transition-all">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    </div>
                    <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        ShadowFund
                    </span>
                </Link>

                <nav className="hidden md:flex items-center gap-1">
                    <Link
                        href="/"
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === "/"
                                ? "text-white bg-[var(--color-charcoal-800)]"
                                : "text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-charcoal-800)]/50"
                            }`}
                    >
                        Explore
                    </Link>
                    <Link
                        href="/create"
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === "/create"
                                ? "text-white bg-[var(--color-charcoal-800)]"
                                : "text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-charcoal-800)]/50"
                            }`}
                    >
                        Start a Campaign
                    </Link>
                </nav>

                <div className="flex items-center gap-4">
                    <div className="hidden md:block h-6 w-px bg-[var(--color-charcoal-700)]"></div>
                    <div className="wallet-adapter-button-trigger">
                        <WalletMultiButton />
                    </div>
                </div>
            </div>
        </header>
    );
}
