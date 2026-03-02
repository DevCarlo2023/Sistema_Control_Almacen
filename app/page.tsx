'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LoadingScreen } from '@/components/ui/loading-screen';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Artificial delay to ensure user sees the branding
      setTimeout(() => {
        if (session) {
          router.push('/inventory');
        } else {
          router.push('/login');
        }
      }, 1500);
    };

    checkAuth();
  }, [router]);

  return <LoadingScreen />;
}
