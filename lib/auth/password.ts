import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * 哈希密码
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * 验证密码
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * 验证密码强度
 * 要求：至少8位，包含数字和字母
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  error?: string;
} {
  if (password.length < 8) {
    return { valid: false, error: "密码至少需要8位字符" };
  }

  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);

  if (!hasNumber || !hasLetter) {
    return {
      valid: false,
      error: "密码必须包含至少一个数字和一个字母",
    };
  }

  return { valid: true };
}
