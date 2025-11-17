'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';

export function TechInfoModal({ show, onClose }: { show: boolean; onClose: () => void }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-effect p-8 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-3xl font-bold text-columbia-navy mb-6 text-center tracking-tight">
          CUEMS INVENTORY MANAGEMENT SYSTEM
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-columbia-navy mb-3 uppercase tracking-wide border-b-2 border-columbia-navy pb-1">
              Technical Specs
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="font-semibold">Framework:</span> Next.js 14 (React)</div>
              <div><span className="font-semibold">Database:</span> PostgreSQL (Neon)</div>
              <div><span className="font-semibold">Real-time:</span> Pusher WebSockets</div>
              <div><span className="font-semibold">Email:</span> Resend</div>
              <div><span className="font-semibold">Auth:</span> NextAuth.js</div>
              <div><span className="font-semibold">Hosting:</span> Vercel Edge</div>
              <div className="col-span-2"><span className="font-semibold">Domain:</span> cuemsinventory.com</div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-columbia-navy mb-3 uppercase tracking-wide border-b-2 border-columbia-navy pb-1">
              Built By
            </h3>
            <div className="text-sm space-y-1">
              <p className="font-bold text-lg text-columbia-navy">Param Sampat</p>
              <p>ps3487@columbia.edu</p>
              <p>Columbia EMS &apos;28</p>
              <p className="text-gray-600 mt-2">November 2025</p>
            </div>
          </div>
        </div>

        <Button
          onClick={onClose}
          className="mt-6 w-full bg-columbia-navy hover:bg-blue-900"
          size="lg"
        >
          <span className="font-bold uppercase">Close</span>
        </Button>
      </div>
    </div>
  );
}

export function Toast({ message, show }: { message: string; show: boolean }) {
  if (!show) return null;

  return (
    <div className="fixed top-24 right-6 glass-effect p-4 shadow-xl border-l-4 border-columbia-navy z-50 animate-slide-in">
      <div className="text-sm">
        {message.split('\n').map((line, i) => (
          <p key={i} className={i === 0 ? 'font-bold text-columbia-navy' : 'text-gray-700'}>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

