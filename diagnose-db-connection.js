// 诊断数据库连接问题
import 'dotenv/config';
import { Pool } from 'pg';

console.log('=== 数据库连接诊断工具 ===\n');

// 1. 检查 DATABASE_URL 是否存在
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ DATABASE_URL 环境变量未设置！');
  console.log('\n请在 .env 文件中添加：');
  console.log('DATABASE_URL="postgresql://postgres:密码@db.xxxxx.supabase.co:5432/postgres?sslmode=require"');
  process.exit(1);
}

console.log('✅ DATABASE_URL 已设置');
console.log('   长度:', dbUrl.length, '字符');
console.log('   前50个字符:', dbUrl.substring(0, 50) + '...\n');

// 2. 检查格式
if (!dbUrl.startsWith('postgresql://')) {
  console.error('❌ DATABASE_URL 格式错误！');
  console.error('   必须以 postgresql:// 开头');
  console.error('   当前开头:', dbUrl.substring(0, 20));
  process.exit(1);
}

if (dbUrl.startsWith('https://') || dbUrl.startsWith('http://')) {
  console.error('❌ DATABASE_URL 格式错误！');
  console.error('   这是 Supabase 项目 URL，不是数据库连接字符串！');
  console.error('   请使用 PostgreSQL 连接字符串（以 postgresql:// 开头）');
  process.exit(1);
}

// 3. 解析连接字符串
try {
  const url = new URL(dbUrl);
  console.log('✅ 连接字符串格式正确');
  console.log('   协议:', url.protocol);
  console.log('   主机:', url.hostname);
  console.log('   端口:', url.port || '5432 (默认)');
  console.log('   数据库:', url.pathname.substring(1) || 'postgres');
  console.log('   用户名:', url.username || '未设置');
  console.log('   密码:', url.password ? '***已设置***' : '❌ 未设置');
  console.log('   SSL模式:', url.searchParams.get('sslmode') || '未设置（建议添加 ?sslmode=require）\n');

  // 检查是否包含 IPv6 地址
  if (url.hostname.includes(':')) {
    console.log('⚠️  警告: 检测到可能包含 IPv6 地址');
    console.log('   建议使用域名而不是 IP 地址（如 db.xxxxx.supabase.co）\n');
  }

  // 检查是否使用域名
  if (url.hostname.includes('.supabase.co') || url.hostname.includes('.supabase.com')) {
    console.log('✅ 使用 Supabase 域名（推荐）\n');
  } else if (url.hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    console.log('⚠️  使用 IPv4 地址（建议使用域名）\n');
  } else if (url.hostname.includes(':')) {
    console.log('⚠️  检测到 IPv6 地址格式\n');
  }
} catch (error) {
  console.error('❌ 无法解析连接字符串:', error.message);
  process.exit(1);
}

// 4. 测试连接
console.log('正在测试数据库连接...\n');

const pool = new Pool({
  connectionString: dbUrl,
  // 强制使用 IPv4
  // @ts-ignore
  family: 4,
  connectionTimeoutMillis: 10000,
});

pool.connect()
  .then((client) => {
    console.log('✅ 数据库连接成功！');
    client.release();
    pool.end();
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 数据库连接失败！');
    console.error('\n错误信息:', error.message);
    console.error('\n可能的原因：');
    
    if (error.message.includes('ENETUNREACH') || error.message.includes('IPv6')) {
      console.error('   1. IPv6 连接问题 - 已尝试强制使用 IPv4');
      console.error('   2. 检查 DATABASE_URL 是否使用了域名而不是 IP 地址');
      console.error('   3. 确保使用 Supabase 域名格式：db.xxxxx.supabase.co');
    }
    
    if (error.message.includes('password') || error.message.includes('authentication')) {
      console.error('   1. 密码错误或未设置');
      console.error('   2. 检查密码中的特殊字符是否已进行 URL 编码');
    }
    
    if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      console.error('   1. 数据库服务器无法访问');
      console.error('   2. 检查网络连接');
      console.error('   3. 检查 Supabase 项目是否正常运行');
    }
    
    if (error.message.includes('SSL') || error.message.includes('certificate')) {
      console.error('   1. SSL 连接问题');
      console.error('   2. 在连接字符串末尾添加 ?sslmode=require');
    }
    
    console.error('\n建议的修复步骤：');
    console.error('   1. 确认 DATABASE_URL 格式正确');
    console.error('   2. 使用域名而不是 IP 地址');
    console.error('   3. 确保密码已正确 URL 编码（如果包含特殊字符）');
    console.error('   4. 添加 ?sslmode=require 参数');
    console.error('   5. 检查 Supabase 项目状态\n');
    
    pool.end();
    process.exit(1);
  });
