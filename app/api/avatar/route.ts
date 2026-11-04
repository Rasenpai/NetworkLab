import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Menyajikan avatar milik user yang sedang login. URL: /api/avatar?v=<avatar_updated>
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 401 });

  const row = db.prepare("SELECT avatar, avatar_mime FROM users WHERE id = ?").get(user.id) as
    | { avatar: Buffer | null; avatar_mime: string | null }
    | undefined;

  if (!row?.avatar || !row.avatar_mime) return new Response(null, { status: 404 });

  return new Response(new Uint8Array(row.avatar), {
    headers: {
      "Content-Type": row.avatar_mime,
      // Aman di-cache lama karena URL berubah (?v=) setiap avatar diganti.
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}