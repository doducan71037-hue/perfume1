import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL!;

// 解析连接字符串以添加 SSL 配置
const url = new URL(connectionString);
// 如果连接字符串中没有 sslmode，添加 prefer（更宽松的 SSL 模式）
if (!url.searchParams.has('sslmode')) {
  url.searchParams.set('sslmode', 'prefer');
}

// 配置 Pool，强制使用 IPv4 并添加连接选项
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const poolConfig: Record<string, unknown> = {
  connectionString: url.toString(),
  // 强制使用 IPv4，避免 IPv6 连接问题
  family: 4,
  // 连接超时设置
  connectionTimeoutMillis: 10000,
  // 最大连接数
  max: 10,
  // 空闲连接超时
  idleTimeoutMillis: 30000,
  // SSL 配置（对于 Supabase 等云服务，接受自签名证书）
  ssl: url.searchParams.get('sslmode') === 'require' || url.searchParams.get('sslmode') === 'prefer' 
    ? { 
        rejectUnauthorized: false,
      } 
    : false,
};

const pool = new Pool(poolConfig as ConstructorParameters<typeof Pool>[0]);

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;