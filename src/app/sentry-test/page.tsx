'use client';

import * as Sentry from "@sentry/nextjs";
import { useState } from "react";

export default function SentryTestPage() {
  const [status, setStatus] = useState<string | null>(null);

  const throwError = () => {
    setStatus("Throwing a raw error...");
    throw new Error("Sentry Test Error: " + new Date().toISOString());
  };

  const captureException = () => {
    try {
      setStatus("Capturing a manual exception...");
      throw new Error("Sentry Manual Capture: " + new Date().toISOString());
    } catch (e) {
      Sentry.captureException(e, {
        tags: { section: "test-page" },
        extra: { timestamp: new Date().toISOString() }
      });
      setStatus("Exception captured. Check your Sentry dashboard.");
    }
  };

  return (
    <div className="max-w-xl mx-auto py-20 px-4 text-center">
      <h1 className="text-3xl font-bold mb-8">Sentry Verification</h1>
      <p className="text-gray-600 mb-8">
        Click the buttons below to verify that Sentry is correctly tracking errors.
      </p>

      {status && (
        <div className="mb-8 p-4 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium">
          {status}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <button
          onClick={throwError}
          className="h-14 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-red-600/10"
        >
          Throw Runtime Error (Crashes Component)
        </button>

        <button
          onClick={captureException}
          className="h-14 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-green-600/10"
        >
          Capture Manual Exception (Safe)
        </button>

        <button
          onClick={() => {
            fetch('/api/sentry-test').then(res => res.json()).then(data => {
              setStatus("Server test: " + (data.message || data.error));
            });
          }}
          className="h-14 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl transition-all active:scale-95"
        >
          Test Server-Side Sentry
        </button>
      </div>

      <p className="mt-12 text-xs text-gray-400 uppercase tracking-widest font-bold">
        UniDeal Diagnostics • Sentry SDK
      </p>
    </div>
  );
}
