import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const isHome = location.pathname === '/';
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Determine header style
  const headerClass = isHome && !isScrolled
    ? 'bg-transparent text-white border-transparent'
    : 'bg-white text-black border-gray-100';

  const logoClass = isHome && !isScrolled ? 'text-white' : 'text-black';
  const linkClass = isHome && !isScrolled 
    ? 'text-white/80 hover:text-white' 
    : 'text-gray-500 hover:text-black';

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className={`fixed top-0 w-full z-50 transition-colors duration-300 border-b ${headerClass}`}>
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className={`font-sans text-xl font-bold tracking-widest uppercase ${logoClass}`}>
            Scent<span className="font-light">AI</span>
          </Link>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-12">
            {['Home', 'Consultation', 'Search', 'Glossary'].map((item) => {
              const path = item === 'Home' ? '/' : `/${item.toLowerCase()}`;
              return (
                <Link 
                  key={item}
                  to={path} 
                  className={`text-[11px] uppercase tracking-widest font-medium transition-colors ${linkClass}`}
                >
                  {item}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Icon */}
          <div className="md:hidden">
            <Link to="/search" className={`p-2 ${linkClass}`}>
              <i className="fa-solid fa-magnifying-glass"></i>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-0">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-100 py-20 text-center">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-sm font-bold tracking-widest uppercase mb-12">ScentAI</h2>
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16 text-[10px] uppercase tracking-widest text-gray-500 mb-12">
            <Link to="/disclaimer" className="hover:text-black transition-colors">Disclaimer</Link>
            <Link to="/privacy" className="hover:text-black transition-colors">Privacy</Link>
            <Link to="/glossary" className="hover:text-black transition-colors">Lexicon</Link>
          </div>
          <p className="text-gray-400 text-[10px] font-medium uppercase tracking-wider">
            © 2024 ScentAI Systems. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};