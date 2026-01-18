import { NextResponse } from "next/server";
import { getSessionToken, deleteAuthSession } from "@/lib/auth/session";

export async function POST() {
  try {
    const token = await getSessionToken();
    if (token) {
      await deleteAuthSession(token);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "登出失败" },
      { status: 500 }
    );
  }
}
