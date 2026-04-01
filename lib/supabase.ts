import { createBrowserClient } from '@supabase/ssr';
import { type Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// In dev, don't set a cookie domain (let browser use default for localhost).
// In production, share cookies across subdomains.
const cookieDomain =
  process.env.NODE_ENV === 'production'
    ? (process.env.NEXT_PUBLIC_COOKIE_DOMAIN || '.carlotech.com')
    : undefined;

export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
  cookieOptions: {
    ...(cookieDomain ? { domain: cookieDomain } : {}),
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  },
});

// Auth functions
export const signUp = async (email: string, password: string) => {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
    },
  });
};

export const signIn = async (email: string, password: string) => {
  return supabase.auth.signInWithPassword({
    email,
    password,
  });
};

export const signOut = async () => {
  return supabase.auth.signOut();
};

export const getSession = async () => {
  return supabase.auth.getSession();
};

export const onAuthStateChange = (callback: (user: any) => void) => {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
};
