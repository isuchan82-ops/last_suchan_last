-- products.json의 상품 데이터를 products 테이블에 삽입하는 SQL
-- 테이블이 존재하지 않거나 이미 데이터가 있어도 에러 없이 실행됩니다.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_tables
    WHERE schemaname = 'public' AND tablename = 'products'
  ) THEN
    -- 각 상품을 개별적으로 체크하여 중복 방지
    INSERT INTO products (title, description, sku, price, category, image_url, stock, created_at, updated_at)
    SELECT 'H빔 철골 200x200 (10개)', NULL, '1', 1500000, 'steel', 'https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=800&auto=format&fit=crop', 0, NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = '1');
    
    INSERT INTO products (title, description, sku, price, category, image_url, stock, created_at, updated_at)
    SELECT '콘크리트 블록 (200개 이상)', NULL, '2', 800000, 'concrete', 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&auto=format&fit=crop', 0, NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = '2');
    
    INSERT INTO products (title, description, sku, price, category, image_url, stock, created_at, updated_at)
    SELECT '건설용 비계파이프 일괄', NULL, '3', 3000000, 'scaffold', 'https://images.unsplash.com/photo-1590856029826-c7a73142bbf1?w=800&auto=format&fit=crop', 0, NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = '3');
    
    INSERT INTO products (title, description, sku, price, category, image_url, stock, created_at, updated_at)
    SELECT '철근 D19 (1톤)', NULL, '4', 2200000, 'steel', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop', 0, NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = '4');
    
    INSERT INTO products (title, description, sku, price, category, image_url, stock, created_at, updated_at)
    SELECT '각파이프 100x100x5T', NULL, '5', 450000, 'steel', 'https://images.unsplash.com/photo-1513828583688-c52646db42da?w=800&auto=format&fit=crop', 0, NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = '5');
    
    INSERT INTO products (title, description, sku, price, category, image_url, stock, created_at, updated_at)
    SELECT '타워크레인 임대 (월단위)', NULL, '6', 15000000, 'equipment', 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop', 0, NOW(), NOW()
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = '6');
  ELSE
    RAISE NOTICE 'Table "products" does not exist. Skipping product inserts.';
  END IF;
END
$$ LANGUAGE plpgsql;

