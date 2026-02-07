-- 샘플 데이터 삽입 SQL
-- 고객 3명과 주문 2개를 추가합니다.
-- 테이블이 존재하지 않거나 이미 데이터가 있어도 에러 없이 실행됩니다.

-- 고객 3명 추가
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_tables
    WHERE schemaname = 'public' AND tablename = 'customers'
  ) THEN
    INSERT INTO customers (id, name, email, phone, address, metadata, created_at) VALUES
    ('11111111-1111-1111-1111-111111111111', '김철수', 'chulsoo@example.com', '010-1234-5678', '서울 강남구 역삼동 1-1', '{}'::jsonb, NOW()),
    ('22222222-2222-2222-2222-222222222222', '이영희', 'younghee@example.com', '010-2345-6789', '부산 해운대구 우동 2-2', '{"company":"영희건설"}'::jsonb, NOW()),
    ('33333333-3333-3333-3333-333333333333', '박민수', 'minsu@example.com', '010-3456-7890', '경기 성남시 분당구 3-3', '{"notes":"도매거래"}'::jsonb, NOW())
    ON CONFLICT (id) DO NOTHING;
  ELSE
    RAISE NOTICE 'Table "customers" does not exist. Skipping customer inserts.';
  END IF;
END
$$ LANGUAGE plpgsql;

-- 주문 2개 추가
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_tables
    WHERE schemaname = 'public' AND tablename = 'orders'
  ) THEN
    INSERT INTO orders (id, customer_id, items, total, status, placed_at, updated_at) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
     '[{"product_id":"1","quantity":2,"unit_price":1500000}]'::jsonb, 3000000, 'paid', NOW(), NOW()),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222',
     '[{"product_id":"3","quantity":1,"unit_price":3000000},{"product_id":"5","quantity":3,"unit_price":450000}]'::jsonb, 4350000, 'shipped', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  ELSE
    RAISE NOTICE 'Table "orders" does not exist. Skipping order inserts.';
  END IF;
END
$$ LANGUAGE plpgsql;

