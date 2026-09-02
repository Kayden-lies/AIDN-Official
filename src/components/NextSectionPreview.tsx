import React from 'react';

export const NextSectionPreview: React.FC = () => {
  return (
    <section
      id="about-section"
      className="relative z-10 w-full min-h-[60vh] bg-[#020408] border-t border-zinc-900/80 px-6 py-24 md:py-32"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center space-x-3 text-xs tracking-[0.2em] uppercase text-zinc-500 mb-6">
          <span className="w-2 h-2 rounded-full bg-sky-500/60" />
          <span>Section 02 / Network Architecture</span>
        </div>

        <h2
          className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-zinc-200 mb-8 max-w-3xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          An engineering collective advancing frontier AI systems and intelligent workflows.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-zinc-900">
          <div>
            <div className="text-xs tracking-wider uppercase text-zinc-500 mb-2 font-medium">
              Foundation
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Originated in Pune to connect machine learning researchers, backend engineers, and autonomous agent builders.
            </p>
          </div>

          <div>
            <div className="text-xs tracking-wider uppercase text-zinc-500 mb-2 font-medium">
              Cognition
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Bridging traditional code architectures with reasoning models, multimodal embeddings, and autonomous execution.
            </p>
          </div>

          <div>
            <div className="text-xs tracking-wider uppercase text-zinc-500 mb-2 font-medium">
              Ecosystem
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Hands-on workshops, hackathons, and technical deep-dives for developers turning prototypes into production infrastructure.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
