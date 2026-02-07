import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 가져오기
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// 환경 변수 필수 체크
if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    console.error(
      '❌ Supabase 환경 변수가 설정되지 않았습니다.\n' +
      '프로젝트 루트에 .env 파일을 생성하고 다음 변수를 설정해주세요:\n' +
      'VITE_SUPABASE_URL=your_supabase_url\n' +
      'VITE_SUPABASE_ANON_KEY=your_supabase_anon_key'
    );
  }
  throw new Error('Supabase 환경 변수가 필요합니다. .env 파일을 확인해주세요.');
}

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

