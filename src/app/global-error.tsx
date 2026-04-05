"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="flex items-center justify-center min-h-screen bg-gray-50 p-6 font-sans">
        <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 text-center animate-in fade-in zoom-in-95">
          <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-sm">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-gray-950 tracking-tighter mb-4">Something went wrong.</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-10">
            A critical error occurred. We're looking into it. 
            Try refreshing the page or starting fresh.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => reset()}
              className="w-full h-14 bg-red-600 hover:bg-red-700 text-white rounded-[1.2rem] font-bold text-base transition-all active:scale-95 shadow-lg shadow-red-600/10"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full h-14 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-[1.2rem] font-bold text-base transition-all active:scale-95"
            >
              Go to Homepage
            </button>
          </div>
          <p className="mt-8 text-[10px] font-bold text-gray-300 uppercase tracking-widest leading-relaxed">
            UniDeal Infrastructure • Global Error Handler
          </p>
        </div>
      </body>
    </html>
  );
}
