# Vercel 배포 설정 가이드

## 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정해야 합니다:

1. [Vercel 대시보드](https://vercel.com/dashboard)에 로그인
2. 프로젝트 선택
3. **Settings** → **Environment Variables** 메뉴로 이동
4. 다음 환경 변수 추가:

### 필수 환경 변수

```
VITE_SUPABASE_URL=https://atsqqdnlztwuebgorjim.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0c3FxZG5senR3dWViZ29yamltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjUyNTIsImV4cCI6MjA4MzYwMTI1Mn0.ASEMrHiNGAPHFc97Fs0ZTS1Zia85X09P3rkkSiK7Er4
```

### 환경 변수 적용 범위

- **Production**: 프로덕션 환경
- **Preview**: 프리뷰 환경
- **Development**: 개발 환경

모든 환경에 적용하는 것을 권장합니다.

## Supabase 인증 설정

Supabase 대시보드에서 리다이렉트 URL을 설정해야 합니다:

1. [Supabase 대시보드](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택: `atsqqdnlztwuebgorjim`
3. **Authentication** → **URL Configuration** 메뉴로 이동
4. **Redirect URLs**에 다음 URL 추가:
   - `http://localhost:8080/**` (로컬 개발용)
   - `https://your-vercel-domain.vercel.app/**` (Vercel 배포 URL)
   - `https://site-stuff-swap.vercel.app/**` (실제 배포 URL)

## 문제 해결

### 로그인이 작동하지 않는 경우

1. **환경 변수 확인**: Vercel 대시보드에서 환경 변수가 올바르게 설정되었는지 확인
2. **리다이렉트 URL 확인**: Supabase 대시보드에서 Vercel URL이 등록되었는지 확인
3. **브라우저 콘솔 확인**: 개발자 도구에서 에러 메시지 확인
4. **재배포**: 환경 변수 변경 후 Vercel에서 재배포 필요

### 세션이 유지되지 않는 경우

- Supabase 클라이언트가 `localStorage`를 사용하도록 설정되어 있습니다
- 브라우저의 쿠키/로컬 스토리지 설정을 확인하세요
- 시크릿 모드에서는 세션이 유지되지 않을 수 있습니다

