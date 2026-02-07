# 환경 변수 설정 가이드

## 로컬 개발 환경 설정

1. 프로젝트 루트에 `.env` 파일을 생성하세요:
```bash
cp .env.example .env
```

2. `.env` 파일을 열고 필요한 환경 변수들을 입력하세요:
```env
# Supabase 설정
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenAI API 설정 (챗봇 기능용)
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_OPENAI_MODEL=gpt-4o-mini

# Toss Payments 설정 (결제 기능용)
VITE_TOSS_CLIENT_KEY=your_toss_client_key_here
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
# Supabase 설정
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenAI API 설정
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_OPENAI_MODEL=gpt-4o-mini

# Toss Payments 설정
VITE_TOSS_CLIENT_KEY=your_toss_client_key_here
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

## 환경 변수 발급 방법

### Supabase 설정
1. [Supabase 대시보드](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택
3. **Settings** → **API** 메뉴로 이동
4. **Project URL**을 `VITE_SUPABASE_URL`에 입력
5. **anon public** 키를 `VITE_SUPABASE_ANON_KEY`에 입력

### OpenAI API 키 발급
1. [OpenAI Platform](https://platform.openai.com/api-keys)에 로그인
2. **API keys** 메뉴로 이동
3. **Create new secret key** 클릭
4. 키 이름을 입력하고 생성
5. 생성된 키를 복사하여 `.env` 파일의 `VITE_OPENAI_API_KEY`에 입력

**주의**: API 키는 한 번만 표시되므로 안전한 곳에 보관하세요.

### Toss Payments 클라이언트 키 발급
1. [Toss Payments 대시보드](https://www.toss.im/developers)에 로그인
2. **내 서비스 관리** → **인증키 관리** 메뉴로 이동
3. **클라이언트 키**를 복사하여 `.env` 파일의 `VITE_TOSS_CLIENT_KEY`에 입력
4. 테스트 환경: `test_ck_...`로 시작하는 키 사용
5. 프로덕션 환경: `live_ck_...`로 시작하는 키 사용

## 주의사항

- `.env` 파일은 절대 Git에 커밋하지 마세요 (`.gitignore`에 포함되어 있음)
- 환경 변수가 설정되지 않으면 애플리케이션이 시작되지 않습니다
- 모든 API 키와 시크릿은 안전하게 보관하세요
- 프로덕션 환경에서는 실제 키를 사용하고, 테스트 환경에서는 테스트 키를 사용하세요

## 필수 환경 변수

| 변수명 | 설명 | 필수 여부 |
|--------|------|----------|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL | ✅ 필수 |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon public 키 | ✅ 필수 |
| `VITE_OPENAI_API_KEY` | OpenAI API 키 (챗봇 기능) | ⚠️ 선택 (챗봇 사용 시) |
| `VITE_OPENAI_MODEL` | OpenAI 모델명 (기본값: gpt-4o-mini) | ⚠️ 선택 |
| `VITE_TOSS_CLIENT_KEY` | Toss Payments 클라이언트 키 (결제 기능) | ⚠️ 선택 (결제 사용 시) |

## 비용 관련

- **OpenAI API**: 사용량에 따라 비용 발생 (GPT-4o-mini는 저렴한 모델)
- **Supabase**: 무료 플랜 제공 (제한 있음)
- **Toss Payments**: 거래 수수료 발생

