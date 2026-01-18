// 检查 .env 文件配置
import 'dotenv/config';

console.log('=== 环境变量检查 ===\n');

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ DATABASE_URL 未找到！');
  console.log('\n请确保 .env 文件中有以下格式：');
  console.log('DATABASE_URL="postgresql://postgres:密码@db.xxxxx.supabase.co:5432/postgres?sslmode=require"');
  process.exit(1);
}

console.log('✅ DATABASE_URL 已找到');
console.log('长度:', dbUrl.length);
console.log('格式检查:');

// 检查格式
const checks = {
  '以 postgresql:// 开头': dbUrl.startsWith('postgresql://'),
  '包含 @': dbUrl.includes('@'),
  '包含 :5432': dbUrl.includes(':5432'),
  '包含 /postgres': dbUrl.includes('/postgres'),
};

Object.entries(checks).forEach(([check, result]) => {
  console.log(`  ${result ? '✅' : '❌'} ${check}`);
});

// 显示部分连接字符串（隐藏密码）
const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':***@');
console.log('\n连接字符串（已隐藏密码）:');
console.log(maskedUrl);

// 检查是否有特殊字符需要编码
if (dbUrl.includes(' ') || dbUrl.includes('[') || dbUrl.includes(']')) {
  console.log('\n⚠️  警告：连接字符串中包含可能需要 URL 编码的特殊字符');
  console.log('如果密码包含特殊字符，请使用 URL 编码：');
  console.log('  @ → %40');
  console.log('  : → %3A');
  console.log('  / → %2F');
  console.log('  ? → %3F');
  console.log('  = → %3D');
  console.log('  & → %26');
  console.log('  # → %23');
  console.log('  [ → %5B');
  console.log('  ] → %5D');
}

console.log('\n=== 检查完成 ===');
