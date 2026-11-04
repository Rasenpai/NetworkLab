import "server-only";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const globalForDb = globalThis as unknown as { __db?: Database.Database };

/** Idempotent: aman dipanggil berkali-kali (termasuk saat hot reload memakai koneksi lama). */
function ensureSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL,
      email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT    NOT NULL,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id         TEXT    PRIMARY KEY,           -- SHA-256 dari token di cookie
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL,              -- unix ms
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

    -- Data belajar per user. course_id / quiz_id mengacu ke id di lib/data.ts (katalog statis).
    CREATE TABLE IF NOT EXISTS course_progress (
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id  TEXT    NOT NULL,
      progress   INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, course_id)
    );

    -- Bab yang sudah diselesaikan user. lesson_slug = nama file .md tanpa ekstensi
    -- (content/mikrotik/<course_id>/<lesson_slug>.md). Progres materi = jumlah baris di sini
    -- dibagi jumlah file .md pada materi tersebut.
    CREATE TABLE IF NOT EXISTS lesson_progress (
      user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id    TEXT    NOT NULL,
      lesson_slug  TEXT    NOT NULL,
      completed_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, course_id, lesson_slug)
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      quiz_id    TEXT    NOT NULL,
      score      INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_quiz_user ON quiz_attempts(user_id, quiz_id);

    -- Sesi quiz/exam yang sedang dikerjakan (satu per user per quiz). Jawaban disimpan
    -- tiap kali dipilih, jadi bisa dilanjutkan setelah refresh atau pindah perangkat.
    -- answers = JSON { "<indeks soal>": <indeks opsi> }. deadline = unix ms batas waktu.
    CREATE TABLE IF NOT EXISTS quiz_sessions (
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      quiz_id    TEXT    NOT NULL,
      answers    TEXT    NOT NULL DEFAULT '{}',
      current    INTEGER NOT NULL DEFAULT 0,
      started_at INTEGER NOT NULL,
      deadline   INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, quiz_id)
    );

    -- Menit belajar per hari (WIB, format YYYY-MM-DD). Sumber streak dan grafik mingguan.
    CREATE TABLE IF NOT EXISTS study_days (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      day     TEXT    NOT NULL,
      minutes INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, day)
    );

    CREATE TABLE IF NOT EXISTS activity (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type       TEXT    NOT NULL CHECK (type IN ('course', 'quiz', 'lab', 'portfolio')),
      text       TEXT    NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_activity_user ON activity(user_id, created_at DESC);

    -- Progres virtual lab per user. lab_id = id spec di lib/lab/labs.ts.
    -- state = JSON dari LabRunner (log aksi, isi terminal, hasil tugas, petunjuk).
    -- passed = jumlah tugas yang lolos pada pemeriksaan terakhir (sumber status di daftar lab).
    -- completed = 1 kalau semua tugas lab sudah lolos saat terakhir diperiksa.
    CREATE TABLE IF NOT EXISTS lab_state (
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      lab_id     TEXT    NOT NULL,
      state      TEXT    NOT NULL,
      completed  INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
      passed     INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, lab_id)
    );

    -- Project portofolio hasil lab yang tuntas. Satu baris per (user, lab); disimpan ulang = diperbarui.
    CREATE TABLE IF NOT EXISTS portfolio_items (
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      lab_id     TEXT    NOT NULL,
      title      TEXT    NOT NULL,
      vendor     TEXT    NOT NULL,
      summary    TEXT    NOT NULL,
      setup      TEXT    NOT NULL,
      tags       TEXT    NOT NULL,
      topology   TEXT    NOT NULL,
      config     TEXT    NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, lab_id)
    );

    -- Canvas topologi Cisco milik user (gaya Packet Tracer). data = JSON Topology
    -- (lihat lib/cisco-canvas.ts). Satu user bisa punya banyak canvas.
    CREATE TABLE IF NOT EXISTS cisco_canvases (
      id         TEXT    PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name       TEXT    NOT NULL,
      data       TEXT    NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_cisco_canvas_user ON cisco_canvases(user_id, updated_at DESC);

    -- Hasil Troubleshooting Challenge. Satu baris per (user, tantangan) berisi percobaan terbaik
    -- (skor tertinggi, waktu tercepat kalau skornya sama). scenario_id = id di lib/troubleshoot-data.ts.
    -- commands / wrong = jumlah command yang dibuka dan jawaban salah pada percobaan terbaik itu.
    -- attempts = berapa kali tantangan ini diselesaikan.
    CREATE TABLE IF NOT EXISTS troubleshoot_results (
      user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      scenario_id  TEXT    NOT NULL,
      best_score   INTEGER NOT NULL CHECK (best_score BETWEEN 0 AND 100),
      best_seconds INTEGER NOT NULL CHECK (best_seconds >= 0),
      commands     INTEGER NOT NULL DEFAULT 0,
      wrong        INTEGER NOT NULL DEFAULT 0,
      attempts     INTEGER NOT NULL DEFAULT 1,
      updated_at   INTEGER NOT NULL,
      PRIMARY KEY (user_id, scenario_id)
    );
    CREATE TABLE IF NOT EXISTS email_verifications (
      token_hash TEXT    PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      email      TEXT    NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_email_verif_user
      ON email_verifications(user_id, created_at DESC);
  `);

  // Migrasi ringan: tambah kolom avatar kalau database lama belum punya.
  const cols = (
    db.prepare("PRAGMA table_info(users)").all() as { name: string }[]
  ).map((c) => c.name);
  if (!cols.includes("avatar"))
    db.exec("ALTER TABLE users ADD COLUMN avatar BLOB");
  if (!cols.includes("avatar_mime"))
    db.exec("ALTER TABLE users ADD COLUMN avatar_mime TEXT");
  // Waktu avatar diubah (unix ms). NULL = belum punya avatar. Dipakai sebagai cache-buster URL.
  if (!cols.includes("avatar_updated"))
    db.exec("ALTER TABLE users ADD COLUMN avatar_updated INTEGER");
    // Bio singkat dan skill pilihan user (JSON array berisi id dari lib/skills.ts).
  if (!cols.includes("bio")) db.exec("ALTER TABLE users ADD COLUMN bio TEXT");
  if (!cols.includes("skills"))
    db.exec("ALTER TABLE users ADD COLUMN skills TEXT");
    // Link sosmed user: JSON object { platformId: url } (lihat lib/socials.ts).
  if (!cols.includes("socials"))
    db.exec("ALTER TABLE users ADD COLUMN socials TEXT");
  if (!cols.includes("email_verified_at"))
    db.exec("ALTER TABLE users ADD COLUMN email_verified_at INTEGER");

  // Migrasi ringan: quiz_attempts versi awal hanya menyimpan skor. Tambah detail percobaan.
  const attemptCols = (
    db.prepare("PRAGMA table_info(quiz_attempts)").all() as { name: string }[]
  ).map((c) => c.name);
  if (!attemptCols.includes("correct"))
    db.exec("ALTER TABLE quiz_attempts ADD COLUMN correct INTEGER");
  if (!attemptCols.includes("total"))
    db.exec("ALTER TABLE quiz_attempts ADD COLUMN total INTEGER");
  if (!attemptCols.includes("answers"))
    db.exec("ALTER TABLE quiz_attempts ADD COLUMN answers TEXT");
  if (!attemptCols.includes("duration_sec"))
    db.exec("ALTER TABLE quiz_attempts ADD COLUMN duration_sec INTEGER");
  

  // Migrasi ringan: lab_state versi awal belum punya kolom passed. Isi dari hasil
  // pemeriksaan yang sudah tersimpan di kolom state supaya progres lama tidak hilang.
  const labCols = (
    db.prepare("PRAGMA table_info(lab_state)").all() as { name: string }[]
  ).map((c) => c.name);
  if (!labCols.includes("passed")) {
    db.exec(
      "ALTER TABLE lab_state ADD COLUMN passed INTEGER NOT NULL DEFAULT 0",
    );
    const rows = db
      .prepare("SELECT user_id, lab_id, state FROM lab_state")
      .all() as {
      user_id: number;
      lab_id: string;
      state: string;
    }[];
    const upd = db.prepare(
      "UPDATE lab_state SET passed = ? WHERE user_id = ? AND lab_id = ?",
    );
    for (const r of rows) {
      try {
        const s = JSON.parse(r.state) as {
          results?: { ok?: boolean }[] | null;
        };
        upd.run(
          s.results?.filter((x) => x.ok).length ?? 0,
          r.user_id,
          r.lab_id,
        );
      } catch {
        /* state rusak: biarkan 0 */
      }
    }
  }
}

function open() {
  const db = new Database(path.join(dataDir, "networklab.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

export const db = globalForDb.__db ?? open();
if (process.env.NODE_ENV !== "production") globalForDb.__db = db;

// Dijalankan setiap modul ini dimuat, bukan hanya saat koneksi baru dibuka.
ensureSchema(db);

export type User = {
  id: number;
  name: string;
  email: string;
  created_at: string;
  avatar_updated: number | null;
};
