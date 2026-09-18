import React, { useState, useEffect } from 'react';

export const Navigation: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Reveal navigation only when scrolled past 60% of the Hero viewport
      const threshold = window.innerHeight * 0.6;
      if (window.scrollY > threshold) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      id="main-navigation"
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-700 ease-out ${
        isVisible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 -translate-y-full pointer-events-none'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between px-6 py-3 rounded-full bg-zinc-950/80 backdrop-blur-md border border-zinc-800/80 shadow-2xl">
          {/* Brand mark */}
          <div className="flex items-center space-x-3">
            <span
              className="text-sm font-bold tracking-[0.2em] uppercase text-zinc-100"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              AIDN
            </span>
            <span className="text-zinc-600">/</span>
            <span className="text-xs tracking-wider text-zinc-400 font-medium">
              Pune Chapter
            </span>
          </div>

          {/* Minimal Links */}
          <nav className="hidden md:flex items-center space-x-8 text-xs tracking-wider uppercase text-zinc-400 font-medium">
            <a href="#hero-section" className="hover:text-zinc-100 transition-colors">
              Hero
            </a>
            <a href="#what-we-do" className="hover:text-zinc-100 transition-colors">
              What We Do
            </a>
            <a href="#what-we-do" className="hover:text-zinc-100 transition-colors">
              Activities
            </a>
          </nav>

          {/* Action indicator */}
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium tracking-wider uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Active Network
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
