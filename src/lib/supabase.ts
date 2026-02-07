import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 가져오기 (없으면 하드코딩된 DB 값 사용)
const fallbackUrl = 'https://atsqqdnlztwuebgorjim.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0c3FxZG5senR3dWViZ29yamltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjUyNTIsImV4cCI6MjA4MzYwMTI1Mn0.ASEMrHiNGAPHFc97Fs0ZTS1Zia85X09P3rkkSiK7Er4';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL || fallbackUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY || fallbackKey;

const finalUrl = supabaseUrl;
const finalKey = supabaseAnonKey;

// 현재 도메인 가져오기
const getSiteUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:8080';
};

export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    flowType: 'pkce',
    redirectTo: getSiteUrl(),
  },
});

