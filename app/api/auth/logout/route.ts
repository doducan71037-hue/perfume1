import { NextRequest, NextResponse } from "next/server";
import { getSessionToken, deleteAuthSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const token = await getSessionToken();
    if (token) {
      await deleteAuthSession(token);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "登出失败" },
      { status: 500 }
    );
  }
}
