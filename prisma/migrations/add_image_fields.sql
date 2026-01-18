-- 添加图片相关字段和索引
-- 如果字段已存在，这些语句会失败，但不会影响其他操作

-- 添加 imageSource 字段（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'perfumes' AND column_name = 'imageSource'
    ) THEN
        ALTER TABLE perfumes ADD COLUMN "imageSource" TEXT NOT NULL DEFAULT 'NONE';
    END IF;
END $$;

-- 添加 imageAttribution 字段（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'perfumes' AND column_name = 'imageAttribution'
    ) THEN
        ALTER TABLE perfumes ADD COLUMN "imageAttribution" TEXT;
    END IF;
END $$;

-- 添加 source 字段（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'perfumes' AND column_name = 'source'
    ) THEN
        ALTER TABLE perfumes ADD COLUMN "source" TEXT NOT NULL DEFAULT 'SEED';
    END IF;
END $$;

-- 添加 sourceId 字段（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'perfumes' AND column_name = 'sourceId'
    ) THEN
        ALTER TABLE perfumes ADD COLUMN "sourceId" TEXT NOT NULL DEFAULT gen_random_uuid()::text;
    END IF;
END $$;

-- 添加 searchName 字段（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'perfumes' AND column_name = 'searchName'
    ) THEN
        ALTER TABLE perfumes ADD COLUMN "searchName" TEXT NOT NULL DEFAULT '';
    END IF;
END $$;

-- 添加唯一约束（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'perfumes_source_sourceId_key'
    ) THEN
        ALTER TABLE perfumes ADD CONSTRAINT "perfumes_source_sourceId_key" UNIQUE ("source", "sourceId");
    END IF;
END $$;

-- 添加 searchName 索引（如果不存在）
CREATE INDEX IF NOT EXISTS "perfumes_searchName_idx" ON perfumes("searchName");
