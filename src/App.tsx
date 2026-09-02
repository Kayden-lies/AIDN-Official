/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HeroSection } from './components/HeroSection';
import { Navigation } from './components/Navigation';
import { NextSectionPreview } from './components/NextSectionPreview';
import { CustomCursor } from './components/CustomCursor';

export default function App() {
  return (
    <div className="min-h-screen bg-[#020408] text-zinc-100 flex flex-col font-sans selection:bg-sky-500/20 selection:text-sky-100">
      {/* Custom Circle with Dot Cursor */}
      <CustomCursor />

      {/* Navigation is completely hidden during Hero and only emerges on scroll */}
      <Navigation />

      <main className="flex-1 w-full">
        {/* SECTION 1: CINEMATIC HERO */}
        <HeroSection />

        {/* TRANSITIONAL SECTION 2 PREVIEW */}
        <NextSectionPreview />
      </main>
    </div>
  );
}

