import { createClient } from '@supabase/supabase-js';

// 무조건 하드코딩된 값 사용
const supabaseUrl = 'https://atsqqdnlztwuebgorjim.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0c3FxZG5senR3dWViZ29yamltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjUyNTIsImV4cCI6MjA4MzYwMTI1Mn0.ASEMrHiNGAPHFc97Fs0ZTS1Zia85X09P3rkkSiK7Er4';

// 현재 도메인 가져오기
const getSiteUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:8080';
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    flowType: 'pkce',
    redirectTo: getSiteUrl(),
  },
});

