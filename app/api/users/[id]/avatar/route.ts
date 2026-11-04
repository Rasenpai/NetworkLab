import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

const SAFE_MIME = /^image\/(png|jpeg|webp|gif)$/;

/** Avatar user mana pun, hanya untuk yang sudah login. URL memakai ?v=<avatar_updated> sebagai cache-buster. */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const me = await getCurrentUser();
  if (!me) return new Response("Unauthorized", { status: 401 });

  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id < 1)
    return new Response("Bad request", { status: 400 });

  const row = db
    .prepare(
      "SELECT avatar, avatar_mime FROM users WHERE id = ? AND avatar IS NOT NULL",
    )
    .get(id) as { avatar: Buffer; avatar_mime: string | null } | undefined;
  if (!row) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(row.avatar), {
    headers: {
      "Content-Type":
        row.avatar_mime && SAFE_MIME.test(row.avatar_mime)
          ? row.avatar_mime
          : "application/octet-stream",
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}