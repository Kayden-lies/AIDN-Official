import React, { useState, useEffect, useRef } from 'react';
import { HeroScene } from './HeroScene';
import { loadModelFromStorage, saveModelToStorage, clearModelFromStorage } from '../lib/modelStorage';

const INTRO_LINES = [
  'Your path to intelligent systems starts here.',
  'Step into a network already in motion.',
  'Your path through the network starts here.',
  'Enter the network. Build what\'s next.',
];

export const HeroSection: React.FC = () => {
  // Select exactly ONE random intro line on mount
  const [introLine] = useState(() => {
    const idx = Math.floor(Math.random() * INTRO_LINES.length);
    return INTRO_LINES[idx];
  });

  // Animation timeline state
  const [revealProgress, setRevealProgress] = useState(0); // 0 to 1
  const [introOpacity, setIntroOpacity] = useState(0);
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
  const animationFrameRef = useRef<number | null>(null);

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

  // Choreographed timeline controller
  const runTimeline = () => {
    // Reset states
    startTimeRef.current = performance.now();
    setRevealProgress(0);
    setIntroOpacity(0);
    setShowTopTitle(false);
    setShowSubtext(false);
    setIsRevealComplete(false);

    const tick = (now: number) => {
      if (!startTimeRef.current) startTimeRef.current = now;
      const elapsed = (now - startTimeRef.current) / 1000; // seconds

      // 1. Philosophical Intro Text: Crisp entrance, clear reading window, fades out smoothly by 2.0s
      if (elapsed < 0.2) {
        setIntroOpacity(0);
      } else if (elapsed >= 0.2 && elapsed < 0.75) {
        const inProgress = (elapsed - 0.2) / 0.55;
        setIntroOpacity(Math.min(1, inProgress));
      } else if (elapsed >= 0.75 && elapsed < 1.55) {
        setIntroOpacity(1);
      } else if (elapsed >= 1.55 && elapsed < 2.0) {
        const outProgress = 1 - (elapsed - 1.55) / 0.45;
        setIntroOpacity(Math.max(0, outProgress));
      } else {
        setIntroOpacity(0);
      }

      // 2. 3D Light Journey: Begins immediately as the intro line fades out (at 2.0s) without any delay
      // Duration reduced by 5 seconds (from 21.0s to 16.0s)
      const lightStart = 2.0;
      const lightDuration = 16.0;
      const lightEnd = lightStart + lightDuration; // 18.0s

      if (elapsed < lightStart) {
        setRevealProgress(0);
      } else if (elapsed >= lightStart && elapsed < lightEnd) {
        const p = (elapsed - lightStart) / lightDuration;
        setRevealProgress(Math.min(1, p));
      } else {
        setRevealProgress(1);
      }

      // 3. Typographic Reveal Sequence (Unfolds smoothly as lights converge at 18.0s)
      // "Artificial Intelligence Developer Network" appears as lights settle
      if (elapsed >= lightEnd) {
        setShowTopTitle(true);
      }
      // "Built in Pune for developers." appears with ample breathing room
      if (elapsed >= lightEnd + 0.4) {
        setShowSubtext(true);
      }

      // Completion
      if (elapsed >= lightEnd + 1.2) {
        setIsRevealComplete(true);
        return; // End animation loop
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    runTimeline();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Quick skip for review
  const handleSkipReveal = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIntroOpacity(0);
    setRevealProgress(1);
    setShowTopTitle(true);
    setShowSubtext(true);
    setIsRevealComplete(true);
  };

  // Replay reveal
  const handleReplay = () => {
    runTimeline();
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
        onModelLoaded={(name, stats) => {
          if (stats) setModelStats(stats);
        }}
      />

      {/* Subtle edge vignette - extremely restrained to keep the physical 3D floor and moving shadow pure */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_75%,#020408_100%)] opacity-25" />

      {/* 1. INTRO LINE (SUBTLE, CINEMATIC, ONLY ONE, APPEARS FIRST) */}
      <div
        id="intro-line-container"
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 transition-all duration-700 ease-out"
        style={{
          opacity: introOpacity,
          transform: `translateY(${(1 - introOpacity) * 8}px)`,
          filter: introOpacity < 0.8 ? 'blur(1px)' : 'none',
        }}
      >
        <div className="px-6 text-center max-w-xl">
          <p
            id="intro-line-text"
            className="text-base sm:text-lg md:text-xl font-normal text-zinc-300 tracking-[0.14em] uppercase"
            style={{
              fontFamily: 'var(--font-sans)',
              textShadow: '0 2px 20px rgba(0,0,0,0.8)',
            }}
          >
            {introLine}
          </p>
        </div>
      </div>

      {/* 4. FINAL HERO COMPOSITION (TYPOGRAPHY HIERARCHY) */}
      {/* Centered structured layout leaving negative space for the 3D 'A' */}
      <div className="relative z-20 w-full h-full flex flex-col justify-between items-center pt-4 md:pt-6 pb-12 md:pb-16 px-6 max-w-6xl mx-auto pointer-events-none">
        {/* ABOVE THE A: "Artificial Intelligence Developer Network" (shifted higher) */}
        <div className="pt-0 text-center">
          <div
            id="hero-top-title"
            className={`transition-all duration-1000 ease-out ${
              showTopTitle
                ? 'opacity-100 translate-y-0 filter-none'
                : 'opacity-0 -translate-y-4 blur-sm'
            }`}
          >
            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[0.12em] sm:tracking-[0.18em] uppercase text-zinc-200/95 leading-tight"
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

        {/* BELOW THE A: "Built in Pune for developers." with spacious breathing room */}
        <div className="pb-8 md:pb-12 text-center flex flex-col items-center">
          {/* Supporting Text: "Built in Pune for developers." */}
          <div
            id="hero-supporting-text"
            className={`transition-all duration-1000 ease-out ${
              showSubtext
                ? 'opacity-100 translate-y-0 filter-none'
                : 'opacity-0 translate-y-3 blur-sm'
            }`}
          >
            <p
              className="text-base sm:text-lg md:text-xl font-medium text-zinc-300 tracking-[0.06em] uppercase"
              style={{
                fontFamily: 'var(--font-sans)',
                textShadow: '0 2px 20px rgba(0, 0, 0, 0.8)',
              }}
            >
              Built in Pune for developers.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT BOTTOM SCROLL INDICATOR: Mouse icon centered on top of "Explore Network" */}
      <div
        id="scroll-indicator"
        onClick={() => {
          window.scrollTo({
            top: window.innerHeight,
            behavior: 'smooth',
          });
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
