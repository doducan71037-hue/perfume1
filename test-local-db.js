// 测试本地数据库连接和基本功能
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ DATABASE_URL 未设置');
  process.exit(1);
}

console.log('=== 本地数据库功能测试 ===\n');

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

async function test() {
  try {
    console.log('1. 测试数据库连接...');
    await prisma.$connect();
    console.log('   ✅ 连接成功\n');

    console.log('2. 测试 User 表...');
    const userCount = await prisma.user.count();
    console.log(`   ✅ User 表存在，记录数: ${userCount}\n`);

    console.log('3. 测试 Perfume 表...');
    const perfumeCount = await prisma.perfume.count();
    console.log(`   ✅ Perfume 表存在，记录数: ${perfumeCount}\n`);

    console.log('4. 测试查询功能（findUnique）...');
    // 测试 findUnique 不会报错（即使找不到记录）
    const testUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
    });
    console.log(`   ✅ findUnique 功能正常（返回: ${testUser ? '找到' : '未找到'})\n`);

    console.log('5. 测试创建功能...');
    const testEmail = `test_${Date.now()}@example.com`;
    const testUser2 = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: 'test_hash',
        role: 'USER',
      },
    });
    console.log(`   ✅ 创建用户成功: ${testUser2.id}\n`);

    console.log('6. 清理测试数据...');
    await prisma.user.delete({
      where: { id: testUser2.id },
    });
    console.log('   ✅ 清理完成\n');

    console.log('✅ 所有测试通过！数据库功能正常。\n');
    console.log('下一步：');
    console.log('1. 在 Render 中设置 Build Command: npm install && npx prisma generate && npm run build');
    console.log('2. 确认 DATABASE_URL 环境变量已正确设置');
    console.log('3. 重新部署\n');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.message.includes('does not exist')) {
      console.error('\n数据库表还没有创建！');
      console.error('请运行: npm run db:migrate');
    } else if (error.message.includes('ENETUNREACH') || error.message.includes('IPv6')) {
      console.error('\n网络连接问题，检查 DATABASE_URL 配置');
    } else {
      console.error('\n完整错误:', error);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    pool.end();
  }
}

test();
