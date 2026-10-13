import React, { useEffect, useState } from 'react';
import { WifiOff, CheckCircle } from 'lucide-react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [hasBeenOffline, setHasBeenOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setHasBeenOffline(true);
    } else if (hasBeenOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, hasBeenOffline]);

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600/95 border border-amber-400 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-2xl backdrop-blur-md animate-bounce">
        <WifiOff className="w-4 h-4 text-amber-200 animate-pulse" />
        <span>Offline-Modus aktiv — Alle lokalen Spiele sind weiterhin spielbar!</span>
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-emerald-600/95 border border-emerald-400 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-2xl backdrop-blur-md">
        <CheckCircle className="w-4 h-4 text-emerald-200" />
        <span>Wieder online — Spielstände synchronisiert</span>
      </div>
    );
  }

  return null;
};
