'use client';

import { useOfflineSync } from '@/hooks/use-offline-sync';
import React from 'react';

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
    useOfflineSync();
    return <>{children}</>;
}
