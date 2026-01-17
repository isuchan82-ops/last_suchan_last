import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 가져오기
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// 클라이언트 사이드에서만 체크 (빌드 시 에러 방지)
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn(
    '⚠️ Missing Supabase environment variables. Fallback keys will be used for local practice.\n' +
    'For production, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

// 기본값 설정 (개발용, 프로덕션에서는 환경 변수 필수)
const fallbackUrl = 'https://atsqqdnlztwuebgorjim.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0c3FxZG5senR3dWViZ29yamltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjUyNTIsImV4cCI6MjA4MzYwMTI1Mn0.ASEMrHiNGAPHFc97Fs0ZTS1Zia85X09P3rkkSiK7Er4';

const finalUrl = supabaseUrl || fallbackUrl;
const finalKey = supabaseAnonKey || fallbackKey;

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

