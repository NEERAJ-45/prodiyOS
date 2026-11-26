'use client';

import * as React from 'react';

function dataUrlToBlobUrl(url: string): string {
  const [header, base64] = url.split(',', 2);
  const mime = header?.split(':')[1]?.split(';')[0] || 'application/octet-stream';
  const raw = atob(base64 || '');
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: mime }));
}

export function useObjectUrl(value: string | null | undefined): string | null {
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!value) {
      setObjectUrl(null);
      return;
    }
    if (!value.startsWith('data:')) {
      setObjectUrl(value);
      return;
    }
    const url = dataUrlToBlobUrl(value);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  return objectUrl;
}
