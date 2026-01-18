// 帮助修复 DATABASE_URL 格式
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');

console.log('=== DATABASE_URL 修复助手 ===\n');

// 读取当前 .env 文件
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf-8');
} catch (error) {
  console.error('❌ 无法读取 .env 文件');
  process.exit(1);
}

// 查找当前的 DATABASE_URL
const urlMatch = envContent.match(/^DATABASE_URL=["']?([^"'\n]+)["']?/m);
const currentUrl = urlMatch ? urlMatch[1] : '';

console.log('当前 DATABASE_URL:');
console.log(currentUrl);
console.log('');

if (!currentUrl) {
  console.log('❌ 未找到 DATABASE_URL');
  console.log('\n请在 .env 文件中添加：');
  console.log('DATABASE_URL="postgresql://postgres:密码@db.xxxxx.supabase.co:5432/postgres?sslmode=require"');
  process.exit(1);
}

// 检查是否是项目 URL 而不是数据库连接字符串
if (currentUrl.startsWith('https://') || currentUrl.startsWith('http://')) {
  console.log('⚠️  检测到这是 Supabase 项目 URL，不是数据库连接字符串！\n');
  console.log('请按照以下步骤获取正确的数据库连接字符串：\n');
  console.log('1. 打开 Supabase Dashboard');
  console.log('2. 进入你的项目');
  console.log('3. 点击左侧 Settings → Database');
  console.log('4. 找到 "Connection string" 部分');
  console.log('5. 选择 "URI" 标签');
  console.log('6. 复制连接字符串（格式类似：postgresql://postgres:密码@db.xxxxx.supabase.co:5432/postgres）');
  console.log('7. 将 [YOUR-PASSWORD] 替换为你的实际密码');
  console.log('8. 更新 .env 文件中的 DATABASE_URL\n');
  console.log('示例格式：');
  console.log('DATABASE_URL="postgresql://postgres:你的密码@db.ajxrtsmkthesvlaoydzk.supabase.co:5432/postgres?sslmode=require"\n');
  process.exit(1);
}

// 检查格式
if (!currentUrl.startsWith('postgresql://')) {
  console.log('❌ DATABASE_URL 格式不正确！');
  console.log('必须以 postgresql:// 开头\n');
  process.exit(1);
}

if (!currentUrl.includes('@')) {
  console.log('❌ DATABASE_URL 格式不正确！');
  console.log('必须包含用户名和密码（格式：postgresql://用户名:密码@主机）\n');
  process.exit(1);
}

console.log('✅ DATABASE_URL 格式看起来正确！');
console.log('\n现在可以运行：');
console.log('  npm run db:migrate');
