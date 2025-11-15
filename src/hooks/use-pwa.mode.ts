'use client';

import { useEffect, useState } from 'react';

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

export function usePWAMode() {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const navigator = window.navigator as NavigatorWithStandalone;
    const checkPWA = window.matchMedia('(display-mode: standalone)').matches ||
                     navigator.standalone === true;
    setIsPWA(checkPWA);
  }, []);

  return isPWA;
}