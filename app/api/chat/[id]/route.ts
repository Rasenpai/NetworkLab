import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { findUser, getMessages, markRead, sendMessage } from "@/lib/chat";

type Ctx = { params: Promise<{ id: string }> };

const NO_STORE = { "Cache-Control": "no-store" };

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: NO_STORE });
}

/** Cek login, id lawan bicara, dan bahwa lawan bicara memang ada. */
async function resolve(ctx: Ctx) {
  const me = await getCurrentUser();
  if (!me) return { res: fail("Belum login.", 401) } as const;

  const peerId = Number((await ctx.params).id);
  if (!Number.isInteger(peerId) || peerId < 1 || peerId === me.id)
    return { res: fail("User tidak valid.", 400) } as const;
  if (!findUser(peerId)) return { res: fail("User tidak ditemukan.", 404) } as const;

  return { me, peerId } as const;
}

/** Polling pesan baru: GET /api/chat/:id?after=<id pesan terakhir yang sudah dimiliki client>. */
export async function GET(req: Request, ctx: Ctx) {
  const r = await resolve(ctx);
  if ("res" in r) return r.res;

  const afterRaw = Number(new URL(req.url).searchParams.get("after"));
  const after = Number.isInteger(afterRaw) && afterRaw > 0 ? afterRaw : 0;

  const messages = getMessages(r.me.id, r.peerId, after);
  markRead(r.me.id, r.peerId);

  return NextResponse.json({ messages }, { headers: NO_STORE });
}

export async function POST(req: Request, ctx: Ctx) {
  // Hanya JSON: form lintas situs tidak bisa mengirim content-type ini tanpa preflight.
  if (!req.headers.get("content-type")?.includes("application/json"))
    return fail("Format permintaan tidak didukung.", 415);

  const r = await resolve(ctx);
  if ("res" in r) return r.res;

  let body: unknown;
  try {
    body = ((await req.json()) as { body?: unknown })?.body;
  } catch {
    return fail("Permintaan tidak valid.", 400);
  }

  const result = sendMessage(r.me.id, r.peerId, body);
  if ("error" in result) return fail(result.error, 400);

  return NextResponse.json({ message: result.message }, { headers: NO_STORE });
}