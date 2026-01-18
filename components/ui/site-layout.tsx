"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function SiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const isHome = pathname === "/";
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const headerClass =
    isHome && !isScrolled
      ? "bg-transparent text-white border-transparent"
      : "bg-white text-black border-gray-100";

  const logoClass = isHome && !isScrolled ? "text-white" : "text-black";
  const linkClass =
    isHome && !isScrolled
      ? "text-white/80 hover:text-white"
      : "text-gray-500 hover:text-black";

  if (isAdmin) {
    return <div className="min-h-screen bg-white">{children}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header
        className={`fixed top-0 w-full z-50 transition-colors duration-300 border-b ${headerClass}`}
      >
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex justify-between items-center">
          <Link
            href="/"
            className={`font-sans text-xl font-bold tracking-widest uppercase ${logoClass}`}
          >
            Scent<span className="font-light">AI</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-12">
            {["Home", "Consultation", "Search", "Glossary"].map((item) => {
              const path = item === "Home" ? "/" : `/${item.toLowerCase()}`;
              return (
                <Link
                  key={item}
                  href={path}
                  className={`text-[11px] uppercase tracking-widest font-medium transition-colors ${linkClass}`}
                >
                  {item}
                </Link>
              );
            })}
          </nav>

          {/* Auth Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {!user ? (
              <>
                <Link
                  href="/login"
                  className={`text-[11px] uppercase tracking-widest font-medium transition-colors ${linkClass}`}
                >
                  Sign In
                </Link>
                <Link
                  href="/subscribe"
                  className={`text-[11px] uppercase tracking-widest font-medium transition-colors border px-4 py-2 ${
                    isHome && !isScrolled
                      ? "text-white border-white hover:bg-white hover:text-black"
                      : "text-black border-black hover:bg-black hover:text-white"
                  }`}
                >
                  Membership
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-6">
                <span className={`text-[11px] uppercase tracking-widest ${linkClass}`}>
                  {user.email}
                </span>
                <button
                  onClick={() => {
                    logout();
                    router.push("/");
                  }}
                  className={`text-[11px] uppercase tracking-widest font-medium transition-colors ${linkClass}`}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile Icon */}
          <div className="md:hidden flex items-center gap-4">
            <Link href="/search" className={`p-2 ${linkClass}`}>
              <span className="text-sm">Search</span>
            </Link>
            <Link href="/login" className={`p-2 ${linkClass}`}>
              <span className="text-sm">User</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-0">{children}</main>

      <footer className="bg-white border-t border-gray-100 py-20 text-center">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-sm font-bold tracking-widest uppercase mb-12">
            ScentAI
          </h2>
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16 text-[10px] uppercase tracking-widest text-gray-500 mb-12">
            <Link href="/disclaimer" className="hover:text-black transition-colors">
              Disclaimer
            </Link>
            <Link href="/privacy" className="hover:text-black transition-colors">
              Privacy
            </Link>
            <Link href="/glossary" className="hover:text-black transition-colors">
              Lexicon
            </Link>
            <Link href="/subscribe" className="hover:text-black transition-colors">
              Membership
            </Link>
          </div>
          <p className="text-gray-400 text-[10px] font-medium uppercase tracking-wider">
            © 2024 ScentAI Systems. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
