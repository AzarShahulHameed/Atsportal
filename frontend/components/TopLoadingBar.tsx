'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

// Slim animated bar shown briefly on every route change — the "system is
// working" cue Zoho-style apps give on navigation, rather than a page just
// blanking or hanging with no feedback.
export function TopLoadingBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 500);
    return () => clearTimeout(timer);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-[3px] z-50 overflow-hidden">
      <div className="h-full w-1/3 bg-beacon-gradient beacon-loading-bar rounded-full" />
    </div>
  );
}
