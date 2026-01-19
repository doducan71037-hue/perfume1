/**
 * 简单的内存 Rate Limit 实现
 * 用于防止暴力破解和滥用
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * 检查 Rate Limit
 * @param key 限制键（如 IP 或 IP+email）
 * @param maxRequests 最大请求数
 * @param windowMs 时间窗口（毫秒）
 * @returns 是否允许请求
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // 清理过期记录
  if (entry && entry.resetAt < now) {
    rateLimitStore.delete(key);
  }

  const currentEntry = rateLimitStore.get(key);

  if (!currentEntry) {
    // 首次请求
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt,
    };
  }

  if (currentEntry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: currentEntry.resetAt,
    };
  }

  // 增加计数
  currentEntry.count++;
  rateLimitStore.set(key, currentEntry);

  return {
    allowed: true,
    remaining: maxRequests - currentEntry.count,
    resetAt: currentEntry.resetAt,
  };
}

/**
 * 获取客户端 IP（从请求头）
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0] || realIp || "unknown";
  return ip.trim();
}

/**
 * 定期清理过期记录（可选，防止内存泄漏）
 */
export function cleanupRateLimit(): void {
  const now = Date.now();
  rateLimitStore.forEach((entry, key) => {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  });
}

// 每5分钟清理一次过期记录
if (typeof setInterval !== "undefined") {
  setInterval(cleanupRateLimit, 5 * 60 * 1000);
}
