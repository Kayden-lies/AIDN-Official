import React, { useEffect, useRef, useState } from 'react';

export const TheIdeaSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEntered(true);
        }
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    const current = sectionRef.current;
    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) observer.unobserve(current);
    };
  }, []);

  const handleScrollToNext = () => {
    const target = document.getElementById('what-we-do');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="the-idea"
      ref={sectionRef}
      className="relative w-full min-h-screen flex flex-col justify-between items-center py-20 md:py-28 px-6 sm:px-10 lg:px-16 bg-[#020408] text-zinc-100 overflow-hidden select-text"
      aria-label="The Idea Behind AIDN"
    >
      {/* Subtle atmospheric ambient presence in far corners - felt more than seen */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-sky-500/[0.04] blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-sky-500/[0.035] blur-[130px]"
      />

      {/* Main container with side editorial markers and central narrative */}
      <div className="relative z-10 w-full max-w-7xl mx-auto flex-1 flex flex-col justify-center items-center">
        {/* SUBTLE SIDE ELEMENT: Left side marker (01 + BUILD LEARN CONNECT GROW) */}
        <div
          aria-hidden="true"
          className={`hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 flex-col items-start select-none pointer-events-none transition-all duration-1000 ease-out ${
            hasEntered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3'
          }`}
        >
          <span className="text-[11px] font-mono tracking-[0.2em] text-zinc-500/70 mb-3">
            01
          </span>
          <div className="w-[1px] h-32 lg:h-44 bg-zinc-800/80 mb-4" />
          <div className="flex flex-col text-[10px] tracking-[0.22em] text-zinc-500/75 leading-[1.85] uppercase font-sans">
            <span>BUILD</span>
            <span>LEARN</span>
            <span>CONNECT</span>
            <span>GROW</span>
          </div>
        </div>

        {/* SUBTLE SIDE ELEMENT: Right side marker (02 + A STRONGER DEVELOPER TOMORROW) */}
        <div
          aria-hidden="true"
          className={`hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 flex-col items-end select-none pointer-events-none transition-all duration-1000 ease-out ${
            hasEntered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-3'
          }`}
        >
          <span className="text-[11px] font-mono tracking-[0.2em] text-zinc-500/70 mb-3">
            02
          </span>
          <div className="w-[1px] h-32 lg:h-44 bg-zinc-800/80 mb-4" />
          <div className="flex flex-col items-end text-[10px] tracking-[0.22em] text-zinc-500/75 leading-[1.85] uppercase font-sans text-right">
            <span>A</span>
            <span>STRONGER</span>
            <span>DEVELOPER</span>
            <span>TOMORROW</span>
          </div>
        </div>

        {/* CENTRAL EDITORIAL COLUMN */}
        <div className="w-full max-w-2xl sm:max-w-[42rem] mx-auto text-center px-2">
          {/* SECTION HEADING: THE [IDEA] BEHIND AIDN */}
          <div
            className={`transition-all duration-1000 ease-out mb-12 sm:mb-16 md:mb-20 ${
              hasEntered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <h2
              className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.6rem] font-bold uppercase tracking-[0.22em] sm:tracking-[0.28em] text-center leading-tight whitespace-normal md:whitespace-nowrap"
              style={{
                fontFamily: 'var(--font-display)',
                textShadow: '0 2px 25px rgba(0, 0, 0, 0.85)',
              }}
            >
              <span className="text-white">THE </span>
              <span className="text-sky-400">IDEA </span>
              <span className="text-white">BEHIND AIDN</span>
            </h2>
          </div>

          {/* NARRATIVE TEXT: Continuous thought, natural spacing, muted refined white/gray */}
          <div
            className={`space-y-6 sm:space-y-7 text-sm sm:text-[15.5px] md:text-base leading-[1.8] font-normal transition-all duration-1000 delay-150 ease-out ${
              hasEntered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0.012em',
            }}
          >
            <p className="text-zinc-300">
              Artificial Intelligence has been evolving for decades.
            </p>

            <p className="text-zinc-400/95 max-w-xl mx-auto">
              What began as an idea explored by a small group of researchers gradually became a field of experimentation, then a discipline of engineering, and eventually something developers around the world could build with.
            </p>

            <p className="text-zinc-400/95 max-w-xl mx-auto">
              For years, every new breakthrough seemed to bring AI a little closer — closer to the tools we used, the systems we built, and eventually, to everyday technology. Knowledge travelled, research travelled, and with time, so did the ability to work with it.
            </p>

            <p className="text-zinc-300">
              Today, that distance is smaller than it has ever been.
            </p>

            <p className="text-zinc-400/95 max-w-xl mx-auto">
              And as AI moves from something we watched evolve to something we can actively shape, the relationship changes. We are no longer only witnessing what comes next — we are learning, experimenting, and building alongside it.
            </p>

            <p className="text-zinc-300">
              A new generation is entering the field.
            </p>

            <p className="text-zinc-300/95">
              And somewhere within that movement, Artificial Intelligence Developer Network takes shape.
            </p>
          </div>
        </div>
      </div>

      {/* SCROLL CUE: Thin vertical line + SCROLL TO CONTINUE */}
      <div
        onClick={handleScrollToNext}
        className={`relative z-10 mt-16 md:mt-24 flex flex-col items-center cursor-pointer group select-none pointer-events-auto transition-all duration-1000 delay-300 ease-out ${
          hasEntered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
        title="Scroll to next section"
      >
        <div className="w-[1px] h-8 sm:h-10 bg-zinc-700/80 group-hover:bg-sky-400 transition-colors duration-300 mb-3" />
        <span className="text-[10px] sm:text-[11px] font-sans tracking-[0.26em] uppercase text-zinc-500 group-hover:text-zinc-300 transition-colors duration-300">
          Scroll to continue
        </span>
      </div>
    </section>
  );
};
