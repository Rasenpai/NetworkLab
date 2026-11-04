import "server-only";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { getProfileExtras, type ProfileExtras } from "@/lib/profile-extra";

/* Tabel pesan. Idempotent, sama seperti ensureSchema di lib/db.ts. */
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body        TEXT    NOT NULL,
    created_at  INTEGER NOT NULL,      -- unix ms
    read_at     INTEGER                -- unix ms, NULL = belum dibaca penerima
  );
  CREATE INDEX IF NOT EXISTS idx_messages_pair
    ON messages(sender_id, receiver_id, id);
  CREATE INDEX IF NOT EXISTS idx_messages_inbox
    ON messages(receiver_id, sender_id, read_at);
`);

export const MESSAGE_MAX = 1000;
const PAGE_SIZE = 100;
// Batas kirim: maksimal 15 pesan per 10 detik per user.
const RATE_LIMIT = 15;
const RATE_WINDOW_MS = 10_000;

/* ───────────── Tipe ───────────── */

export type ChatMessage = {
  id: number;
  mine: boolean;
  body: string;
  createdAt: number;
};

/** Data user yang aman ditampilkan ke user lain. Tidak pernah memuat email. */
export type PublicUser = {
  id: number;
  name: string;
  createdAt: string;
  avatarVersion: number | null;
  admin: boolean;
  verified: boolean;
};

export type PublicProfile = PublicUser & ProfileExtras;

export type UserListItem = PublicUser & {
  lastBody: string | null;
  lastAt: number | null;
  lastMine: boolean;
  unread: number;
};

type UserRow = {
  id: number;
  name: string;
  email: string;
  created_at: string;
  avatar_updated: number | null;
  email_verified_at: number | null;
};

function toPublic(r: UserRow): PublicUser {
  return {
    id: r.id,
    name: r.name,
    createdAt: r.created_at,
    avatarVersion: r.avatar_updated,
    admin: isAdmin(r.email, r.email_verified_at),
    verified: r.email_verified_at != null,
  };
}

/* ───────────── User ───────────── */

export function findUser(id: number): PublicUser | null {
  const row = db
    .prepare(
      `SELECT id, name, email, created_at, avatar_updated, email_verified_at
         FROM users WHERE id = ?`,
    )
    .get(id) as UserRow | undefined;
  return row ? toPublic(row) : null;
}

export function getPublicProfile(id: number): PublicProfile | null {
  const u = findUser(id);
  return u ? { ...u, ...getProfileExtras(id) } : null;
}

/** Semua user selain `me`. Yang punya percakapan paling baru tampil paling atas. */
export function listUsers(me: number, query: string): UserListItem[] {
  const q = query.trim().slice(0, 50);
  const like = q ? `%${q.replace(/[\\%_]/g, "\\$&")}%` : null;

  const rows = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.created_at, u.avatar_updated, u.email_verified_at,
              (SELECT m.body FROM messages m
                WHERE (m.sender_id = u.id AND m.receiver_id = @me)
                   OR (m.sender_id = @me AND m.receiver_id = u.id)
                ORDER BY m.id DESC LIMIT 1) AS last_body,
              (SELECT m.created_at FROM messages m
                WHERE (m.sender_id = u.id AND m.receiver_id = @me)
                   OR (m.sender_id = @me AND m.receiver_id = u.id)
                ORDER BY m.id DESC LIMIT 1) AS last_at,
              (SELECT m.sender_id FROM messages m
                WHERE (m.sender_id = u.id AND m.receiver_id = @me)
                   OR (m.sender_id = @me AND m.receiver_id = u.id)
                ORDER BY m.id DESC LIMIT 1) AS last_sender,
              (SELECT COUNT(*) FROM messages m
                WHERE m.sender_id = u.id AND m.receiver_id = @me
                  AND m.read_at IS NULL) AS unread
         FROM users u
        WHERE u.id != @me
          AND (@like IS NULL OR u.name LIKE @like ESCAPE '\\')
        ORDER BY last_at IS NULL, last_at DESC, u.name COLLATE NOCASE
        LIMIT 200`,
    )
    .all({ me, like }) as (UserRow & {
    last_body: string | null;
    last_at: number | null;
    last_sender: number | null;
    unread: number;
  })[];

  return rows.map((r) => ({
    ...toPublic(r),
    lastBody: r.last_body,
    lastAt: r.last_at,
    lastMine: r.last_sender === me,
    unread: r.unread,
  }));
}

/* ───────────── Pesan ───────────── */

type MessageRow = {
  id: number;
  sender_id: number;
  body: string;
  created_at: number;
};

/** Pesan di percakapan me ↔ peer dengan id > afterId, paling lama di atas. */
export function getMessages(
  me: number,
  peer: number,
  afterId = 0,
  limit = PAGE_SIZE,
): ChatMessage[] {
  const rows = db
    .prepare(
      `SELECT * FROM (
         SELECT id, sender_id, body, created_at
           FROM messages
          WHERE ((sender_id = @me AND receiver_id = @peer)
              OR (sender_id = @peer AND receiver_id = @me))
            AND id > @after
          ORDER BY id DESC
          LIMIT @limit
       ) ORDER BY id`,
    )
    .all({ me, peer, after: afterId, limit }) as MessageRow[];

  return rows.map((r) => ({
    id: r.id,
    mine: r.sender_id === me,
    body: r.body,
    createdAt: r.created_at,
  }));
}

/** Tandai pesan dari `peer` ke `me` sebagai sudah dibaca. */
export function markRead(me: number, peer: number) {
  db.prepare(
    `UPDATE messages SET read_at = ?
      WHERE receiver_id = ? AND sender_id = ? AND read_at IS NULL`,
  ).run(Date.now(), me, peer);
}

export function sendMessage(
  me: number,
  peer: number,
  raw: unknown,
): { error: string } | { message: ChatMessage } {
  if (typeof raw !== "string") return { error: "Pesan tidak valid." };

  const body = raw.replace(/\r\n/g, "\n").trim();
  if (!body) return { error: "Pesan tidak boleh kosong." };
  if (body.length > MESSAGE_MAX)
    return { error: `Pesan maksimal ${MESSAGE_MAX} karakter.` };

  const now = Date.now();
  const recent = db
    .prepare(
      "SELECT COUNT(*) AS c FROM messages WHERE sender_id = ? AND created_at > ?",
    )
    .get(me, now - RATE_WINDOW_MS) as { c: number };
  if (recent.c >= RATE_LIMIT)
    return { error: "Terlalu cepat. Tunggu beberapa detik lalu coba lagi." };

  const info = db
    .prepare(
      "INSERT INTO messages (sender_id, receiver_id, body, created_at) VALUES (?, ?, ?, ?)",
    )
    .run(me, peer, body, now);

  return {
    message: {
      id: Number(info.lastInsertRowid),
      mine: true,
      body,
      createdAt: now,
    },
  };
}