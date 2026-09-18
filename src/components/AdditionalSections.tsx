import React from 'react';

export const EventsSection: React.FC = () => {
  return (
    <section
      id="events"
      data-section="events"
      className="relative z-10 w-full min-h-[65vh] bg-[#020408] border-t border-zinc-900/80 px-6 py-24 md:py-32"
    >
      {/* Secondary anchor for legacy signature-events */}
      <div id="signature-events" className="absolute top-0" />
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center space-x-3 text-xs tracking-[0.2em] uppercase text-zinc-500 mb-6">
          <span className="w-2 h-2 rounded-full bg-sky-500/60" />
          <span>Section 03 / Signature Events</span>
        </div>

        <h2
          className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-zinc-200 mb-8 max-w-3xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          High-bandwidth technical summits, autonomous hackathons, and research gatherings.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-zinc-900">
          <div className="p-6 rounded-2xl bg-zinc-950/60 border border-zinc-900">
            <div className="text-sky-400 text-xs font-mono mb-2">QUARTERLY</div>
            <h3 className="text-lg font-semibold text-zinc-200 mb-2">Pune AI Summit</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Flagship symposium uniting machine learning architects, system designers, and founders across Maharashtra.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-950/60 border border-zinc-900">
            <div className="text-sky-400 text-xs font-mono mb-2">MONTHLY</div>
            <h3 className="text-lg font-semibold text-zinc-200 mb-2">Agentic Buildathons</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Sprint-based hacking focused on multi-agent collaboration, fine-tuning small models, and tool integration.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-950/60 border border-zinc-900">
            <div className="text-sky-400 text-xs font-mono mb-2">BI-WEEKLY</div>
            <h3 className="text-lg font-semibold text-zinc-200 mb-2">Research Circles</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Deep dissection of recent arXiv papers, open weight models, reasoning paradigms, and inference optimizations.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export const PartnersSection: React.FC = () => {
  return (
    <section
      id="partners"
      data-section="partners"
      className="relative z-10 w-full min-h-[65vh] bg-[#020408] border-t border-zinc-900/80 px-6 py-24 md:py-32"
    >
      {/* Secondary anchor for legacy partners-collaborators */}
      <div id="partners-collaborators" className="absolute top-0" />
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center space-x-3 text-xs tracking-[0.2em] uppercase text-zinc-500 mb-6">
          <span className="w-2 h-2 rounded-full bg-sky-500/60" />
          <span>Section 04 / Partners & Collaborators</span>
        </div>

        <h2
          className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-zinc-200 mb-8 max-w-3xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Supported by premier institutions, compute platforms, and forward-looking engineering teams.
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-zinc-900">
          <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-950/40 flex flex-col justify-center">
            <span className="text-sm font-semibold text-zinc-300">Compute Labs</span>
            <span className="text-xs text-zinc-500 mt-1">GPU clusters & cloud credits</span>
          </div>
          <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-950/40 flex flex-col justify-center">
            <span className="text-sm font-semibold text-zinc-300">Academia & Institutes</span>
            <span className="text-xs text-zinc-500 mt-1">Research labs & campus ties</span>
          </div>
          <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-950/40 flex flex-col justify-center">
            <span className="text-sm font-semibold text-zinc-300">Frontier Startups</span>
            <span className="text-xs text-zinc-500 mt-1">Production AI adopters</span>
          </div>
          <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-950/40 flex flex-col justify-center">
            <span className="text-sm font-semibold text-zinc-300">Open Source Orgs</span>
            <span className="text-xs text-zinc-500 mt-1">Framework contributors</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export const CampusConnectSection: React.FC = () => {
  return (
    <section
      id="campus-connect"
      data-section="campus-connect"
      className="relative z-10 w-full min-h-[65vh] bg-[#020408] border-t border-zinc-900/80 px-6 py-24 md:py-32"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center space-x-3 text-xs tracking-[0.2em] uppercase text-zinc-500 mb-6">
          <span className="w-2 h-2 rounded-full bg-sky-500/60" />
          <span>Section 05 / AIDN Campus Connect</span>
        </div>

        <h2
          className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-zinc-200 mb-8 max-w-3xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Bridging university computer science cohorts with modern production-grade AI workflows.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-zinc-900">
          <div className="p-8 rounded-2xl bg-zinc-950/60 border border-zinc-900">
            <h3 className="text-lg font-semibold text-zinc-200 mb-3">Student Chapters & Mentorship</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Equipping undergraduate and postgraduate students with real-world guidance from senior staff engineers, open-source maintainers, and AI founders.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-zinc-950/60 border border-zinc-900">
            <h3 className="text-lg font-semibold text-zinc-200 mb-3">Hands-on Sandbox Projects</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Moving beyond textbook theory to deploy LLM pipelines, autonomous eval suites, and RAG architectures in real-world environments.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export const GetInvolvedSection: React.FC = () => {
  return (
    <section
      id="get-involved"
      data-section="get-involved"
      className="relative z-10 w-full min-h-[75vh] bg-[#020408] border-t border-zinc-900/80 px-6 py-28 md:py-36"
    >
      <div className="max-w-5xl mx-auto text-center flex flex-col items-center">
        <div className="flex items-center space-x-3 text-xs tracking-[0.2em] uppercase text-zinc-500 mb-6">
          <span className="w-2 h-2 rounded-full bg-sky-500/60" />
          <span>Section 06 / Get Involved</span>
        </div>

        <h2
          className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-zinc-100 mb-6 max-w-2xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Shape the future of intelligent systems in Pune.
        </h2>

        <p className="text-base text-zinc-400 max-w-xl mb-10 leading-relaxed">
          Whether you are training weights, architecting agent swarms, or writing production code, there is a place for you in AIDN Pune Chapter.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <a
            href="https://aidn.network"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3.5 rounded-full text-xs font-semibold tracking-widest uppercase bg-sky-500 text-black hover:bg-sky-400 transition-colors shadow-lg shadow-sky-500/20"
          >
            Apply for Membership
          </a>
          <a
            href="#events"
            className="px-8 py-3.5 rounded-full text-xs font-medium tracking-widest uppercase text-zinc-300 border border-zinc-800 hover:border-zinc-600 hover:text-white transition-colors"
          >
            Explore Next Meetup
          </a>
        </div>
      </div>
    </section>
  );
};
