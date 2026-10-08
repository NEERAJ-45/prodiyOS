'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { emojiCdnUrl } from '@/lib/emoji-anim';

// Animated Noto emoji — static SVG loads instantly, the animated WebP
// replaces it once the emoji scrolls into view.
// Assets: https://fonts.gstatic.com/s/e/notoemoji/latest/<codepoint>/<file>
// Animated Noto Emoji is licensed under CC BY 4.0.
interface Props {
  char: string;
  className?: string;
  /** Start on the animated WebP immediately instead of waiting to scroll into view. */
  eager?: boolean;
}

export function AnimatedEmoji({ char, className, eager = false }: Props) {
  const staticUrl = emojiCdnUrl(char, 'emoji.svg');
  const [src, setSrc] = useState<string | null>(
    () => (eager && emojiCdnUrl(char, '512.webp')) || staticUrl
  );
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  const upgraded = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || eager || upgraded.current) return;
    if (typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          io.disconnect();
          upgraded.current = true;
          const animated = emojiCdnUrl(char, '512.webp');
          if (animated) setSrc(animated);
        }
      },
      { rootMargin: '150px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [char, eager]);

  if (!staticUrl || failed) {
    return (
      <span role="img" aria-label={char} className={className}>
        {char}
      </span>
    );
  }

  return (
    // next/image would transcode the animated WebP and drop its animation
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src ?? staticUrl}
      alt={char}
      loading="lazy"
      decoding="async"
      className={cn('inline-block h-[1.15em] w-[1.15em] align-[-0.2em]', className)}
      onError={() => {
        // animated WebP missing for this emoji → keep the static SVG
        if (src?.endsWith('512.webp')) setSrc(staticUrl);
        else setFailed(true); // no CDN asset at all → native emoji
      }}
    />
  );
}
