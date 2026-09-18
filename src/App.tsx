/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HeroSection } from './components/HeroSection';
import { TheIdeaSection } from './components/TheIdeaSection';
import { Navigation } from './components/Navigation';
import { WhatWeDoSection } from './components/WhatWeDoSection';
import { NextSectionPreview } from './components/NextSectionPreview';
import {
  EventsSection,
  PartnersSection,
  CampusConnectSection,
  GetInvolvedSection,
} from './components/AdditionalSections';
import { CustomCursor } from './components/CustomCursor';

export default function App() {
  return (
    <div className="min-h-screen bg-[#020408] text-zinc-100 flex flex-col font-sans selection:bg-sky-500/20 selection:text-sky-100">
      {/* Navigation is completely hidden during Hero and contextual on scroll */}
      <Navigation />

      <main className="flex-1 w-full">
        {/* SECTION 1: CINEMATIC HERO */}
        <HeroSection />

        {/* SECTION 2: THE IDEA BEHIND AIDN (MINIMAL EDITORIAL CHAPTER) */}
        <TheIdeaSection />

        {/* SECTION 3: WHAT WE DO AT AIDN (SCROLL-LOCKED STORYTELLING CHAPTER) */}
        <WhatWeDoSection />

        {/* SECTION 4: THE NETWORK */}
        <NextSectionPreview />

        {/* SECTION 5: SIGNATURE EVENTS */}
        <EventsSection />

        {/* SECTION 6: PARTNERS & COLLABORATORS */}
        <PartnersSection />

        {/* SECTION 7: AIDN CAMPUS CONNECT */}
        <CampusConnectSection />

        {/* SECTION 8: GET INVOLVED */}
        <GetInvolvedSection />
      </main>

      {/* Custom Circle with Dot Cursor rendered at topmost stacking level */}
      <CustomCursor />
    </div>
  );
}

