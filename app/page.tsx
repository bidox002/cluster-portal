"use client";
import React, { useState } from 'react';

// Live public Cloudflare Tunnel URL pointing to local OpenNebula Sunstone (port 9869)
const SUNSTONE_URL = "https://businesses-leads-copyrighted-showtimes.trycloudflare.com";

export default function SunstonePortal() {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 overflow-hidden font-sans">
      {/* Navigation Header Bar */}
      <header className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800 text-slate-100 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          <div>
            <h1 className="text-lg font-bold text-blue-400 leading-none">OpenNebula Sunstone Cloud Portal</h1>
            <p className="text-xs text-slate-400 mt-0.5">CSC 4812 Infrastructure Gateway</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <a
            href={SUNSTONE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold rounded border border-slate-700 transition flex items-center space-x-1"
          >
            <span>Open Native Interface</span>
            <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-0L10 14" />
            </svg>
          </a>
        </div>
      </header>

      {/* Embedded Full-Screen Sunstone Console */}
      <div className="relative flex-1 w-full bg-slate-900">
        {!iframeLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 bg-slate-950 text-slate-400 z-10">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-mono">Connecting to OpenNebula Sunstone Engine...</p>
          </div>
        )}
        <iframe
          src={SUNSTONE_URL}
          className="w-full h-full border-none"
          title="OpenNebula Sunstone Management Interface"
          onLoad={() => setIframeLoaded(true)}
        />
      </div>
    </div>
  );
}