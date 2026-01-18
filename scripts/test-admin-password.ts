/**
 * 测试管理员密码是否正确
 */

import "dotenv/config";

const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

console.log("\n🔐 管理员密码配置：");
console.log(`  环境变量 ADMIN_PASSWORD: ${process.env.ADMIN_PASSWORD || "(未设置，使用默认值)"}`);
console.log(`  实际使用的密码: ${adminPassword}`);
console.log(`\n✅ 请使用以下密码登录：`);
console.log(`   ${adminPassword}`);
console.log(`\n`);
