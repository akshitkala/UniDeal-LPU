'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-2">
        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900">Something went wrong.</h2>
      <p className="text-sm text-gray-500 max-w-xs mx-auto">
        We encountered an unexpected error. Our team has been notified and we're looking into it.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        <button
          onClick={() => reset()}
          className="h-11 px-8 text-sm font-bold rounded-full bg-[#16a34a] text-white hover:bg-green-700 transition-all active:scale-95 shadow-lg shadow-green-600/10"
        >
          Try again
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="h-11 px-8 text-sm font-bold rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
        >
          Back to home
        </button>
      </div>
    </div>
  );
}
