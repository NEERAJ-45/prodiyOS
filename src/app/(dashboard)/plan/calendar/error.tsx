'use client';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="p-6"><div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"><h2 className="font-semibold">Calendar unavailable</h2><p className="mt-2 text-sm text-muted-foreground">We couldn’t load your schedules. Check your connection and try again.</p><button className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={reset}>Try again</button></div></div>;
}
