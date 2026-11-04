import { NextResponse, type NextRequest } from "next/server";
import { consumeVerificationToken } from "@/lib/email-verification";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const ok = consumeVerificationToken(token);
  const base = process.env.APP_URL ?? req.nextUrl.origin;
  return NextResponse.redirect(
    new URL(`/profile?verified=${ok ? "1" : "error"}`, base),
  );
}