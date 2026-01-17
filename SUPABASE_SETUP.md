# Supabase 데이터베이스 설정 가이드

## 1. Supabase 대시보드에서 SQL 실행

1. [Supabase 대시보드](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택: `atsqqdnlztwuebgorjim`
3. 왼쪽 메뉴에서 **SQL Editor** 클릭
4. **New Query** 버튼 클릭
5. `supabase_schema.sql` 파일의 전체 내용을 복사하여 붙여넣기
6. **Run** 버튼 클릭 (또는 Ctrl+Enter)

## 2. Storage 설정 (이미지 업로드용)

이미지를 Supabase Storage에 저장하려면:

1. Supabase 대시보드에서 **Storage** 메뉴로 이동
2. **Create a new bucket** 클릭
3. Bucket 이름: `listing-images`
4. Public bucket: **체크** (공개 이미지이므로)
5. **Create bucket** 클릭

### Storage 정책 설정

Storage → Policies → `listing-images` → New Policy

**Policy for SELECT (읽기)**
- Policy name: `Public read access`
- Allowed operation: SELECT
- Policy definition: `true` (모두 읽기 가능)

**Policy for INSERT (업로드)**
- Policy name: `Authenticated users can upload`
- Allowed operation: INSERT
- Policy definition: `auth.role() = 'authenticated'` (인증된 사용자만 업로드)

**Policy for DELETE (삭제)**
- Policy name: `Users can delete own images`
- Allowed operation: DELETE
- Policy definition: `bucket_id = 'listing-images' AND auth.uid()::text = (storage.foldername(name))[1]` (본인 이미지만 삭제)

## 3. 테이블 구조

### profiles (사용자 프로필)
- `id`: UUID (auth.users와 연결)
- `name`: 이름
- `phone`: 전화번호
- `tokens`: 보유 토큰 (기본값: 50000)
- `rating`, `total_reviews`, `response_rate`, `total_sales`: 평가 정보

### listings (자재 게시물)
- `id`: UUID
- `user_id`: 작성자 ID
- `title`: 제목
- `description`: 상세 설명
- `price`: 가격 (원)
- `token_price`: 토큰 가격
- `type`: 거래 유형 (sale, buy, rent, lease)
- `category`: 카테고리 (steel, concrete, wood, scaffold, equipment, other)
- `location`: 지역
- `status`: 상태 (available, reserved, sold)

### listing_images (게시물 이미지)
- `id`: UUID
- `listing_id`: 게시물 ID
- `image_url`: 이미지 URL
- `image_order`: 이미지 순서

## 4. 자동 기능

- 회원가입 시 자동으로 `profiles` 테이블에 레코드 생성
- `updated_at` 필드 자동 업데이트

## 5. 보안 설정 (RLS)

Row Level Security (RLS)가 활성화되어 있어:
- 사용자는 자신의 프로필만 수정 가능
- 모든 사용자는 게시물을 볼 수 있음
- 자신이 작성한 게시물만 수정/삭제 가능

