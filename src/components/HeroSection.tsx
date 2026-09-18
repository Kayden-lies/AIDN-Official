import React, { useState, useEffect, useRef } from 'react';
import { HeroScene } from './HeroScene';
import { loadModelFromStorage, saveModelToStorage, clearModelFromStorage } from '../lib/modelStorage';

const INTRO_LINES = [
  'Your path to intelligent systems starts here.',
  'Step into a network already in motion.',
  'Your path through the network starts here.',
  'Enter the network. Build what\'s next.',
];

export type LoadingPhase =
  | 'loading'     // 0% -> 100% real GLB download and scene parsing
  | 'hold100'     // Model loaded, extended hold of 100% state (~1000ms)
  | 'fade_ui'     // Loading composition fades out simultaneously (~400ms)
  | 'dark_pause'  // Brief cinematic darkness (~250ms)
  | 'revealing'   // 16s four-light reveal sequence (revealProgress 0 -> 1)
  | 'complete';   // Reveal done, typography settled, scroll lock removed

export const HeroSection: React.FC = () => {
  // Select exactly ONE random intro line on mount
  const [introLine] = useState(() => {
    const idx = Math.floor(Math.random() * INTRO_LINES.length);
    return INTRO_LINES[idx];
  });

  // Cinematic Loading & Reveal State
  const [phase, setPhase] = useState<LoadingPhase>('loading');
  const [displayProgress, setDisplayProgress] = useState<number>(0);
  const displayProgressRef = useRef<number>(0);
  const rawProgressRef = useRef<number>(0);
  const isModelReadyRef = useRef<boolean>(false);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const progressRafRef = useRef<number | null>(null);
  const revealRafRef = useRef<number | null>(null);

  // Animation timeline state
  const [revealProgress, setRevealProgress] = useState(0); // 0 to 1
  const [showTopTitle, setShowTopTitle] = useState(false);
  const [showSubtext, setShowSubtext] = useState(false);
  const [isRevealComplete, setIsRevealComplete] = useState(false);
  
  // Model state & persistence
  const [customModelBuffer, setCustomModelBuffer] = useState<ArrayBuffer | null>(null);
  const [activeModelName, setActiveModelName] = useState<string>('AIDN Logo 3D Model.glb');
  const [isCustomLoaded, setIsCustomLoaded] = useState<boolean>(false);
  const [modelStats, setModelStats] = useState<{ vertices: number; meshes: number } | null>(null);
  const [uploadToast, setUploadToast] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startTimeRef = useRef<number | null>(null);

  // Load any previously saved custom model from IndexedDB on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await loadModelFromStorage();
        if (stored && mounted) {
          setCustomModelBuffer(stored.buffer);
          setActiveModelName(stored.name);
          setIsCustomLoaded(true);
          setUploadToast(`Loaded cached ${stored.name}`);
          setTimeout(() => setUploadToast(null), 3500);
        }
      } catch (err) {
        console.warn('Could not restore cached model', err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Window-level drag and drop to guarantee drops are caught anywhere in the viewport
  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    };

    const onDragLeave = (e: DragEvent) => {
      if (e.clientX === 0 || e.clientY === 0) {
        setIsDragOver(false);
      }
    };

    const onDrop = async (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        await processUploadedFile(e.dataTransfer.files[0]);
      }
    };

    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);

    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, []);

  const processUploadedFile = async (file: File) => {
    const isGlb = file.name.toLowerCase().endsWith('.glb') || file.name.toLowerCase().endsWith('.gltf');
    if (!isGlb) {
      setUploadToast('Please drop a valid .glb or .gltf 3D model.');
      setTimeout(() => setUploadToast(null), 3000);
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      setCustomModelBuffer(buffer);
      setActiveModelName(file.name);
      setIsCustomLoaded(true);
      setUploadToast(`Loaded ${file.name}`);

      // Persist to IndexedDB
      await saveModelToStorage(file.name, buffer);

      // Persist to server via Vite endpoint
      await fetch('/api/upload-model', {
        method: 'POST',
        headers: {
          'x-filename': file.name,
        },
        body: buffer,
      });

      setUploadToast(`Linked & saved ${file.name} to project`);
      setTimeout(() => setUploadToast(null), 4000);
    } catch (err) {
      console.error('Error processing model file:', err);
      setUploadToast('Error loading 3D file.');
      setTimeout(() => setUploadToast(null), 4000);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processUploadedFile(e.target.files[0]);
    }
  };

  const handleResetToDefault = async () => {
    await clearModelFromStorage();
    setCustomModelBuffer(null);
    setActiveModelName('AIDN Logo 3D Model.glb');
    setIsCustomLoaded(false);
    setUploadToast('Reset to default AIDN model');
    setTimeout(() => setUploadToast(null), 3000);
  };

  const handleLoadProgress = (percent: number) => {
    rawProgressRef.current = Math.max(rawProgressRef.current, percent);
  };

  const handleModelReady = () => {
    isModelReadyRef.current = true;
    rawProgressRef.current = 100;
  };

  // Four-light cinematic reveal timeline
  const startReveal = () => {
    setPhase('revealing');
    setRevealProgress(0);
    startTimeRef.current = performance.now();

    const originalLightDuration = 16.0; // Conceptual 16.0s four-light choreography baseline

    // Compress ONLY the initial 0.0s -> 3.0s independent spotlight phase into ~0.8s.
    // After ~0.8s, return to the exact existing 1.0x animation timing/speed.
    // Cubic time curve ensures C^1 continuity: value and velocity match smoothly at t = 0.8s (T = 3.0, T' = 1.0).
    const getVirtualElapsed = (elapsed: number): number => {
      const tSplit = 0.8;
      const targetOrig = 3.0;
      if (elapsed <= 0) return 0;
      if (elapsed >= tSplit) {
        return targetOrig + (elapsed - tSplit);
      }
      return (
        -7.03125 * elapsed * elapsed * elapsed +
        7.8125 * elapsed * elapsed +
        2.0 * elapsed
      );
    };

    const tick = (now: number) => {
      if (!startTimeRef.current) startTimeRef.current = now;
      const elapsed = (now - startTimeRef.current) / 1000;

      const virtualElapsed = getVirtualElapsed(elapsed);
      const p = Math.min(1, virtualElapsed / originalLightDuration);
      setRevealProgress(p);

      // Typographic Reveal Sequence
      // "Artificial Intelligence Developer Network" appears as lights converge
      if (virtualElapsed >= originalLightDuration - 0.4) {
        setShowTopTitle(true);
      }
      // "From Code to Cognition" and "Built in Pune for developers." appear below
      if (virtualElapsed >= originalLightDuration) {
        setShowSubtext(true);
      }

      // Completion
      if (virtualElapsed >= originalLightDuration + 1.0) {
        setIsRevealComplete(true);
        setPhase('complete');
        return;
      }

      revealRafRef.current = requestAnimationFrame(tick);
    };

    revealRafRef.current = requestAnimationFrame(tick);
  };

  // Real GLB Loading & Smooth Progress Loop
  useEffect(() => {
    let active = true;

    const animateProgress = () => {
      if (!active) return;
      const current = displayProgressRef.current;
      const target = rawProgressRef.current;

      let next = current;
      if (target > current) {
        const diff = target - current;
        // Natural ease: rapid on large jumps, buttery smooth into steps
        const step = Math.max(diff * 0.16, 0.45);
        next = Math.min(target, current + step);
      }

      displayProgressRef.current = next;
      setDisplayProgress(next);

      // Transition once the real GLB model is loaded, parsed, and ready
      if (isModelReadyRef.current && next >= 99.8) {
        displayProgressRef.current = 100;
        setDisplayProgress(100);
        setPhase('hold100');

        // 1. Extended cinematic 100% hold (~1000ms / 1.0s) with quote, bar at 100%, and percentage visible
        const t1 = setTimeout(() => {
          if (!active) return;
          setPhase('fade_ui');

          // 2. Smooth simultaneous fade out of quote, bar, and percentage (~400ms)
          const t2 = setTimeout(() => {
            if (!active) return;
            setPhase('dark_pause');

            // 3. Brief moment of near-total darkness (~250ms) before the lights ignite
            const t3 = setTimeout(() => {
              if (!active) return;
              startReveal();
            }, 250);
            timeoutRefs.current.push(t3);
          }, 400);
          timeoutRefs.current.push(t2);
        }, 1000);
        timeoutRefs.current.push(t1);

        return; // End progress interpolation loop
      }

      progressRafRef.current = requestAnimationFrame(animateProgress);
    };

    progressRafRef.current = requestAnimationFrame(animateProgress);

    return () => {
      active = false;
      if (progressRafRef.current) cancelAnimationFrame(progressRafRef.current);
      if (revealRafRef.current) cancelAnimationFrame(revealRafRef.current);
      timeoutRefs.current.forEach(clearTimeout);
    };
  }, []);

  // Disable scrolling until and unless the animation completes
  useEffect(() => {
    if (!isRevealComplete) {
      // Ensure initial scroll position is locked to top
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo(0, 0);
      }

      // Prevent automatic scroll restoration while animation runs
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }

      const originalHtmlOverflow = document.documentElement.style.overflow;
      const originalBodyOverflow = document.body.style.overflow;
      const originalOverscroll = document.body.style.overscrollBehavior;

      // Lock document root & body
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';

      // Intercept wheel, touch gestures, and keyboard navigation keys
      const preventDefault = (e: Event) => {
        e.preventDefault();
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        const scrollKeys = [
          'ArrowDown',
          'ArrowUp',
          'PageDown',
          'PageUp',
          'Space',
          ' ',
          'Home',
          'End',
        ];
        if (scrollKeys.includes(e.key)) {
          const target = e.target as HTMLElement | null;
          if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
            return;
          }
          e.preventDefault();
        }
      };

      const handleScroll = () => {
        if (window.scrollY !== 0 || window.scrollX !== 0) {
          window.scrollTo(0, 0);
        }
      };

      window.addEventListener('wheel', preventDefault, { passive: false });
      window.addEventListener('touchmove', preventDefault, { passive: false });
      window.addEventListener('keydown', handleKeyDown, { passive: false });
      window.addEventListener('scroll', handleScroll, { passive: true });

      return () => {
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.overscrollBehavior = originalOverscroll;

        window.removeEventListener('wheel', preventDefault);
        window.removeEventListener('touchmove', preventDefault);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('scroll', handleScroll);
      };
    } else {
      // Animation complete: restore normal scrolling
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';

      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    }
  }, [isRevealComplete]);

  // Quick skip for review
  const handleSkipReveal = () => {
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
    if (progressRafRef.current) cancelAnimationFrame(progressRafRef.current);
    if (revealRafRef.current) cancelAnimationFrame(revealRafRef.current);

    displayProgressRef.current = 100;
    setDisplayProgress(100);
    setRevealProgress(1);
    setShowTopTitle(true);
    setShowSubtext(true);
    setIsRevealComplete(true);
    setPhase('complete');
  };

  // Replay reveal
  const handleReplay = () => {
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
    if (revealRafRef.current) cancelAnimationFrame(revealRafRef.current);

    setShowTopTitle(false);
    setShowSubtext(false);
    setIsRevealComplete(false);
    setRevealProgress(0);
    setPhase('dark_pause');

    const t = setTimeout(() => {
      startReveal();
    }, 250);
    timeoutRefs.current.push(t);
  };

  return (
    <section
      id="hero-section"
      className={`relative w-full h-screen min-h-[700px] overflow-hidden bg-[#020408] text-white select-none transition-colors duration-500 ${
        isDragOver ? 'ring-2 ring-sky-500/50' : ''
      }`}
    >
      {/* Hidden native file input for custom model selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* THREE.JS SCENE CONTAINER */}
      <HeroScene
        revealProgress={revealProgress}
        isRevealComplete={isRevealComplete}
        customModelBuffer={customModelBuffer}
        onLoadProgress={handleLoadProgress}
        onModelReady={handleModelReady}
        onModelLoaded={(name, stats) => {
          if (stats) setModelStats(stats);
        }}
      />

      {/* Subtle edge vignette - extremely restrained to keep the physical 3D floor and moving shadow pure */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_75%,#020408_100%)] opacity-25" />

      {/* 1. CENTERED CINEMATIC LOADING COMPOSITION */}
      {phase !== 'revealing' && phase !== 'complete' && (
        <div
          id="hero-loading-composition"
          className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none transition-opacity duration-400 ease-out"
          style={{
            opacity: phase === 'fade_ui' || phase === 'dark_pause' ? 0 : 1,
          }}
        >
          <div className="w-full max-w-md px-6 flex flex-col items-center text-center">
            {/* Centered Intro Quote */}
            <p
              id="hero-intro-quote"
              className="text-sm sm:text-base md:text-lg font-normal text-zinc-300 tracking-[0.14em] uppercase leading-relaxed max-w-lg"
              style={{
                fontFamily: 'var(--font-sans)',
                textShadow: '0 2px 20px rgba(0,0,0,0.85)',
              }}
            >
              {introLine}
            </p>

            {/* Understated Progress Bar + Percentage */}
            <div className="w-full max-w-[260px] sm:max-w-[280px] mt-8 sm:mt-10 flex items-center gap-3">
              {/* Track & Filled portion */}
              <div className="flex-1 h-[1.5px] bg-zinc-800/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-400 transition-all duration-75 ease-out"
                  style={{ width: `${displayProgress}%` }}
                />
              </div>

              {/* Percentage text */}
              <span className="text-[11px] sm:text-xs font-mono tabular-nums text-zinc-400 min-w-[2.5rem] text-right">
                {Math.round(displayProgress)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. FINAL HERO COMPOSITION (TYPOGRAPHY HIERARCHY) */}
      {/* Centered structured layout with calibrated vertical breathing room for the 3D model and typography */}
      <div className="relative z-20 w-full h-full flex flex-col justify-between items-center pt-10 sm:pt-12 md:pt-16 pb-10 md:pb-12 px-4 sm:px-6 max-w-[90rem] mx-auto pointer-events-none">
        {/* ABOVE THE A: "Artificial Intelligence Developer Network" with gentle downward breathing room */}
        <div className="pt-2 sm:pt-3 text-center w-full max-w-full">
          <div
            id="hero-top-title"
            className={`transition-all duration-1000 ease-out inline-block max-w-full ${
              showTopTitle
                ? 'opacity-100 translate-y-0 filter-none'
                : 'opacity-0 -translate-y-4 blur-sm'
            }`}
          >
            <h2
              className="text-[1.425rem] sm:text-[1.78125rem] md:text-[2.1375rem] font-semibold tracking-[0.12em] sm:tracking-[0.18em] uppercase text-zinc-200/95 leading-tight whitespace-normal min-[1200px]:whitespace-nowrap"
              style={{
                fontFamily: 'var(--font-display)',
                textShadow: '0 2px 25px rgba(0, 0, 0, 0.85)',
              }}
            >
              Artificial Intelligence Developer Network
            </h2>
            <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-zinc-500/60 to-transparent mx-auto mt-3" />
          </div>
        </div>

        {/* MIDDLE SPACER: Negative space dedicated to the 3D A */}
        <div className="flex-1 w-full max-w-lg flex items-center justify-center" />

        {/* BELOW THE AIDN MODEL */}
        <div className="pb-6 md:pb-8 text-center flex flex-col items-center gap-1.5 sm:gap-2">
          {/* Tagline: "From Code to Cognition" */}
          <div
            id="hero-tagline"
            className={`transition-all duration-1000 ease-out ${
              showSubtext
                ? 'opacity-100 translate-y-0 filter-none'
                : 'opacity-0 translate-y-3 blur-sm'
            }`}
          >
            <p
              className="text-base sm:text-lg md:text-xl font-medium text-zinc-200 tracking-[0.12em] uppercase"
              style={{
                fontFamily: 'var(--font-sans)',
                textShadow: '0 2px 20px rgba(0, 0, 0, 0.85)',
              }}
            >
              From Code to Cognition
            </p>
          </div>

          {/* Location / Mission: "Built in Pune for developers." */}
          <div
            id="hero-supporting-text"
            className={`transition-all duration-1000 delay-150 ease-out ${
              showSubtext
                ? 'opacity-100 translate-y-0 filter-none'
                : 'opacity-0 translate-y-2 blur-sm'
            }`}
          >
            <p
              className="text-xs sm:text-sm md:text-base font-normal text-zinc-400 tracking-[0.08em] uppercase"
              style={{
                fontFamily: 'var(--font-sans)',
                textShadow: '0 2px 15px rgba(0, 0, 0, 0.8)',
              }}
            >
              Built in Pune for developers.
            </p>
          </div>
        </div>
      </div>

      {/* SKIP ANIMATION BUTTON: Allows completing the animation immediately and unlocking scrolling */}
      {!isRevealComplete && (
        <button
          id="skip-animation-btn"
          onClick={handleSkipReveal}
          className="absolute top-6 right-6 z-40 px-3 py-1.5 rounded-full bg-zinc-950/60 hover:bg-zinc-900/90 border border-zinc-800/80 hover:border-zinc-600 text-[11px] font-medium tracking-[0.16em] uppercase text-zinc-400 hover:text-zinc-200 transition-all duration-300 backdrop-blur-md cursor-pointer flex items-center space-x-1.5 group shadow-lg"
          title="Skip intro animation"
        >
          <span>Skip</span>
          <svg className="w-3 h-3 text-zinc-400 group-hover:text-zinc-200 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* RIGHT BOTTOM SCROLL INDICATOR: Mouse icon centered on top of "Explore Network" */}
      <div
        id="scroll-indicator"
        onClick={() => {
          const target = document.getElementById('what-we-do');
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
          } else {
            window.scrollTo({
              top: window.innerHeight,
              behavior: 'smooth',
            });
          }
        }}
        className={`absolute bottom-6 right-6 md:bottom-8 md:right-10 z-30 pointer-events-auto flex flex-col items-center gap-2 cursor-pointer group transition-all duration-1000 ${
          isRevealComplete ? 'opacity-80 hover:opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        title="Explore Network"
      >
        <div className="w-5 h-8 rounded-full border border-zinc-700/80 group-hover:border-zinc-500 flex items-start justify-center p-1.5 bg-zinc-950/40 backdrop-blur-sm shadow-md transition-all">
          <div className="w-1 h-2 rounded-full bg-zinc-300 group-hover:bg-sky-400 animate-pulse transition-colors" />
        </div>
        <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.20em] uppercase text-zinc-400 group-hover:text-zinc-200 transition-colors text-center">
          Explore Network
        </span>
      </div>

      {/* TOAST NOTIFICATION */}
      {uploadToast && (
        <div className="absolute bottom-6 left-6 z-50 px-4 py-2.5 rounded-lg bg-zinc-900/90 border border-zinc-700/80 text-xs text-zinc-200 shadow-2xl backdrop-blur-md flex items-center space-x-2 pointer-events-auto animate-in fade-in slide-in-from-bottom-2">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          <span>{uploadToast}</span>
        </div>
      )}

      {/* FULL-WINDOW DRAG OVERLAY */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-[#020408]/85 backdrop-blur-md flex items-center justify-center pointer-events-none border-2 border-dashed border-sky-500/60">
          <div className="p-8 rounded-2xl bg-zinc-950/95 border border-sky-500/40 shadow-2xl text-center max-w-md">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-base font-semibold text-white tracking-wide uppercase mb-1">
              Drop AIDN Logo 3D Model (.glb)
            </p>
            <p className="text-xs text-zinc-400">
              Instantly hot-loads into the cinematic scene and saves permanently.
            </p>
          </div>
        </div>
      )}
    </section>
  );
};
