# 환경 변수 설정 가이드

## 로컬 개발 환경 설정

1. 프로젝트 루트에 `.env` 파일을 생성하세요:
```bash
cp .env.example .env
```

2. `.env` 파일을 열고 Supabase 정보를 입력하세요:
```env
VITE_SUPABASE_URL=https://atsqqdnlztwuebgorjim.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0c3FxZG5senR3dWViZ29yamltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjUyNTIsImV4cCI6MjA4MzYwMTI1Mn0.ASEMrHiNGAPHFc97Fs0ZTS1Zia85X09P3rkkSiK7Er4
```

3. 개발 서버를 재시작하세요:
```bash
npm run dev
```

## Vercel 배포 환경 설정

1. [Vercel 대시보드](https://vercel.com/dashboard)에 로그인
2. 프로젝트 선택
3. **Settings** → **Environment Variables** 메뉴로 이동
4. 다음 환경 변수를 추가:

### Production 환경 변수
```
VITE_SUPABASE_URL=https://atsqqdnlztwuebgorjim.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0c3FxZG5senR3dWViZ29yamltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjUyNTIsImV4cCI6MjA4MzYwMTI1Mn0.ASEMrHiNGAPHFc97Fs0ZTS1Zia85X09P3rkkSiK7Er4
```

5. **Preview**와 **Development** 환경에도 동일하게 설정하는 것을 권장합니다.
6. 환경 변수 설정 후 **재배포**가 필요합니다.

## Supabase 인증 설정

Supabase 대시보드에서 리다이렉트 URL을 설정해야 합니다:

1. [Supabase 대시보드](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택
3. **Authentication** → **URL Configuration** 메뉴로 이동
4. **Redirect URLs**에 다음 URL을 추가:
   - `http://localhost:8080/**` (로컬 개발용)
   - `http://localhost:5173/**` (Vite 기본 포트)
   - `https://your-vercel-domain.vercel.app/**` (Vercel 배포 URL)
   - `https://site-stuff-swap.vercel.app/**` (실제 배포 URL)

## 주의사항

- `.env` 파일은 절대 Git에 커밋하지 마세요 (`.gitignore`에 포함되어 있음)
- 환경 변수가 설정되지 않으면 애플리케이션이 시작되지 않습니다
- Supabase URL과 API Key는 Supabase 대시보드의 **Settings** → **API**에서 확인할 수 있습니다

