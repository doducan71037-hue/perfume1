-- Supabase 数据库初始化脚本
-- 在 Supabase Dashboard → SQL Editor 中执行此脚本

-- 启用 pgvector 扩展（如果将来需要使用向量搜索）
-- 注意：当前项目代码未使用 pgvector，但可以预先启用
CREATE EXTENSION IF NOT EXISTS vector;

-- 设置时区（可选）
SET timezone = 'UTC';

-- 注意：表结构会通过 Prisma 迁移自动创建
-- 运行 `npm run db:migrate` 后，所有表都会自动创建
