import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // 只保护 /admin 路由
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const authSession = request.cookies.get("auth_session");

    // 如果没有认证 cookie，重定向到登录页
    if (!authSession) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 有 cookie 但可能无效，让页面组件验证（服务端组件会调用 requireAdmin）
    // 这样可以避免在 Edge Runtime 中使用 Prisma
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
