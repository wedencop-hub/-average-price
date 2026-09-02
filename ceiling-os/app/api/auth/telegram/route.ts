import { NextResponse } from "next/server";
import { verifyTelegramInitData } from "../../../../../lib/telegram";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const initData = typeof body?.initData === "string" ? body.initData : "";
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) return NextResponse.json({ ok:false, error:"TELEGRAM_BOT_TOKEN is not configured" }, { status:500 });
    if (!initData) return NextResponse.json({ ok:false, error:"Telegram initData is required" }, { status:400 });
    const data = verifyTelegramInitData(initData, botToken, 86400);
    if (!data.user?.id) return NextResponse.json({ ok:false, error:"Telegram user is missing" }, { status:401 });
    return NextResponse.json({ ok:true, user:data.user, authDate:data.authDate });
  } catch (error) {
    return NextResponse.json({ ok:false, error:error instanceof Error ? error.message : "Telegram authentication failed" }, { status:401 });
  }
}
