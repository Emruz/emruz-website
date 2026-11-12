'use client';

import { useEffect } from 'react';

/** After a profile change, tell the header to reload the name and photo. */
export default function RefreshMe({ when }: { when?: string }) {
  useEffect(() => {
    if (when) window.dispatchEvent(new Event('emruz:me'));
  }, [when]);
  return null;
}
