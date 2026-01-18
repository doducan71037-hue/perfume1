import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * 统一错误处理
 */
export function handleError(error: unknown): NextResponse {
  console.error("Error:", error);

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    );
  }

  // 处理Prisma数据库连接错误
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return NextResponse.json(
      {
        error: "数据库连接失败。请检查：1) DATABASE_URL是否正确配置 2) 数据库是否运行 3) 是否已运行迁移（npm run db:migrate）",
        code: "DATABASE_CONNECTION_ERROR",
      },
      { status: 503 }
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // 处理已知的Prisma错误
    if (error.code === "P1001") {
      return NextResponse.json(
        {
          error: "无法连接到数据库服务器。请确认数据库已启动并运行迁移。",
          code: "DATABASE_CONNECTION_ERROR",
        },
        { status: 503 }
      );
    }
  }

  if (error instanceof Error) {
    // 检查是否是数据库相关错误
    if (error.message.includes("Can't reach database") || error.message.includes("P1001")) {
      return NextResponse.json(
        {
          error: "数据库连接失败。请检查数据库配置和运行状态。",
          code: "DATABASE_CONNECTION_ERROR",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      error: "Internal server error",
      code: "UNKNOWN_ERROR",
    },
    { status: 500 }
  );
}