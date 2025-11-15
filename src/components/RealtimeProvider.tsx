'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getPusherClient } from '@/lib/pusher';

interface RealtimeContextType {
  subscribeToInventoryUpdates: (callback: (data: any) => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [pusherClient] = useState(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_PUSHER_KEY) {
      return getPusherClient();
    }
    return null;
  });

  const subscribeToInventoryUpdates = (callback: (data: any) => void) => {
    if (!pusherClient) return () => {};

    const channel = pusherClient.subscribe('inventory');
    channel.bind('item-updated', callback);

    return () => {
      channel.unbind('item-updated', callback);
      pusherClient.unsubscribe('inventory');
    };
  };

  return (
    <RealtimeContext.Provider value={{ subscribeToInventoryUpdates }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
}

