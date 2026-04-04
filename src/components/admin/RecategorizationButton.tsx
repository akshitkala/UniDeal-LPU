'use client';
import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Loader2, Play } from 'lucide-react';

type Status = 'idle' | 'running' | 'done' | 'error';

interface Result {
  processed: number;
  reassigned: number;
  flagged: number;
  skipped: number;
}

export function RecategorizationButton() {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<Result | null>(null);

  async function handleRun() {
    if (!window.confirm('Run AI Recategorization on all flagged listings? This may take a few minutes.')) {
      return;
    }

    setStatus('running');
    setResult(null);

    try {
      const res = await fetch('/api/cron/recategorize', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET}`
        },
        body: JSON.stringify({ 
          manual: true,
          actorUid: user?.uid 
        })
      });

      if (!res.ok) throw new Error('Failed');

      const data = await res.json();
      setResult(data);
      setStatus('done');

    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        onClick={handleRun}
        disabled={status === 'running'}
        className="h-10 px-5 text-sm font-semibold rounded-xl border 
                   border-gray-200 bg-white hover:bg-gray-50 
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all flex items-center gap-2 shadow-sm"
      >
        {status === 'running' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            <span>Running AI...</span>
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
            <span>Run Recategorization</span>
          </>
        )}
      </button>

      {status === 'done' && result && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          {result.processed} scanned · <span className="text-indigo-600">{result.reassigned} moved</span> · {result.skipped} skipped
        </p>
      )}

      {status === 'error' && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">
          Failed — check audit log
        </p>
      )}
    </div>
  );
}
