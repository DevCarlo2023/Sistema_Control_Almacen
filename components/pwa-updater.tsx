'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

export function PWAUpdater() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      let refreshing = false;
      
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          toast.info('Actualización del sistema aplicada. Refrescando pantalla...', {
            duration: 2000,
          });
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      });
    }
  }, []);

  return null;
}
