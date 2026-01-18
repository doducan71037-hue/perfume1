// 测试数据库连接
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('✗ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function test() {
  try {
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('✓ Database connected');
    
    // 测试查询
    const sessionCount = await prisma.session.count();
    console.log(`✓ Sessions in database: ${sessionCount}`);
    
    // 测试创建session
    const testSession = await prisma.session.create({
      data: {
        anonymousId: `test_${Date.now()}`,
      },
    });
    console.log(`✓ Created test session: ${testSession.id}`);
    
    // 清理
    await prisma.session.delete({
      where: { id: testSession.id },
    });
    console.log('✓ Test session cleaned up');
    
  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
