// Render 数据库修复脚本 - 在 Render Shell 中运行
// 用法: node scripts/render-db-fix.js

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { execSync } = require('child_process');

console.log('=== Render 数据库修复脚本 ===\n');

// 1. 检查 DATABASE_URL
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ DATABASE_URL 环境变量未设置！');
  console.error('请在 Render Dashboard → Environment → Environment Variables 中添加 DATABASE_URL');
  process.exit(1);
}

console.log('✅ DATABASE_URL 已设置');
console.log('   长度:', dbUrl.length, '字符\n');

// 2. 测试连接
console.log('正在测试数据库连接...\n');

const pool = new Pool({
  connectionString: dbUrl,
  // @ts-ignore
  family: 4,
  connectionTimeoutMillis: 10000,
  ssl: dbUrl.includes('sslmode=require') || dbUrl.includes('sslmode=prefer')
    ? { rejectUnauthorized: false }
    : false,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function runFix() {
  try {
    // 3. 测试连接
    await prisma.$connect();
    console.log('✅ 数据库连接成功！\n');

    // 4. 检查表是否存在
    console.log('正在检查数据库表...\n');
    
    try {
      const userCount = await prisma.user.count();
      console.log('✅ User 表存在，记录数:', userCount);
    } catch (error) {
      if (error.message.includes('does not exist')) {
        console.log('❌ User 表不存在！');
        console.log('   需要运行数据库迁移...\n');
        
        console.log('正在运行迁移...');
        try {
          execSync('npx prisma migrate deploy', { stdio: 'inherit' });
          console.log('\n✅ 迁移完成！\n');
          
          // 再次检查
          const userCount = await prisma.user.count();
          console.log('✅ User 表已创建，记录数:', userCount);
        } catch (migrateError) {
          console.error('❌ 迁移失败:', migrateError.message);
          console.error('\n请手动运行: npx prisma migrate deploy');
          process.exit(1);
        }
      } else {
        throw error;
      }
    }

    try {
      const perfumeCount = await prisma.perfume.count();
      console.log('✅ Perfume 表存在，记录数:', perfumeCount);
    } catch (error) {
      console.log('⚠️  Perfume 表可能不存在或有问题');
    }

    // 5. 验证基本功能
    console.log('\n正在验证基本功能...\n');
    
    try {
      const sessionCount = await prisma.session.count();
      console.log('✅ Session 表存在，记录数:', sessionCount);
    } catch (error) {
      console.log('⚠️  Session 表可能不存在');
    }

    console.log('\n✅ 所有检查完成！数据库应该可以正常工作了。\n');
    console.log('下一步：');
    console.log('1. 确保 Render Build Command 包含: npx prisma generate');
    console.log('2. 重启服务（Manual Deploy）');
    console.log('3. 访问网站测试注册功能\n');

  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    
    if (error.message.includes('ENETUNREACH') || error.message.includes('IPv6')) {
      console.error('\n可能原因：IPv6 连接问题');
      console.error('建议：检查 DATABASE_URL 是否使用了域名而不是 IP 地址');
    } else if (error.message.includes('password') || error.message.includes('authentication')) {
      console.error('\n可能原因：密码错误');
      console.error('建议：检查 DATABASE_URL 中的密码是否正确（特殊字符需要 URL 编码）');
    } else if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      console.error('\n可能原因：无法连接到数据库服务器');
      console.error('建议：检查 Supabase 项目是否正常运行');
    } else if (error.message.includes('SSL') || error.message.includes('certificate')) {
      console.error('\n可能原因：SSL 连接问题');
      console.error('建议：在 DATABASE_URL 末尾添加 ?sslmode=prefer');
    } else {
      console.error('\n完整错误信息:');
      console.error(error);
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    pool.end();
  }
}

runFix();
