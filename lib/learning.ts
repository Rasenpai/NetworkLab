import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { avgProgress, courses, quizzes } from "@/lib/data";
import { getModuleById } from "@/lib/catalog";
import { getCourseOutline, getLesson } from "@/lib/mikrotik-content";
import { getQuizBank, type QuizQuestion } from "@/lib/quiz-bank";
// Hanya mengimpor data statis (bukan lib/troubleshoot.ts) supaya tidak ada import melingkar,
// karena lib/troubleshoot.ts sendiri memanggil recordActivity dari file ini.
import { SCENARIOS } from "@/lib/troubleshoot-data";

/**
 * Data belajar per user.
 *  - Katalog (materi, quiz) tetap statis di lib/data.ts.
 *  - Kemajuan user disimpan di SQLite lalu digabung ke katalog di sini.
 *  - Materi MikroTik: jumlah bab, durasi, dan progres dihitung dari file Markdown
 *    (content/mikrotik/<id>/*.md) dan tabel lesson_progress, bukan dari angka di lib/data.ts.
 *
 * Catatan waktu: "hari" memakai WIB (UTC+7) dan dihitung di SQL (date('now','+7 hours')),
 * bukan Date.now() di JS, supaya aman dipanggil dari render (Cache Components).
 */

export type ActivityType = "course" | "quiz" | "lab" | "portfolio";
export type ActivityItem = { id: number; type: ActivityType; text: string; time: string };
export type WeekDay = { day: string; minutes: number };

const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

/* ---------- Helper tanggal (string YYYY-MM-DD) ---------- */

function shiftDay(day: string, delta: number) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10);
}

function dayLabel(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return DAY_LABELS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

function formatAgo(ms: number) {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Kemarin";
  if (days < 7) return `${days} hari lalu`;
  return `${Math.floor(days / 7)} minggu lalu`;
}

function levelFor(overall: number) {
  if (overall < 30) return { level: "Beginner", levelPercent: Math.round((overall / 30) * 100) };
  if (overall < 70) return { level: "Intermediate", levelPercent: Math.round(((overall - 30) / 40) * 100) };
  return { level: "Advanced", levelPercent: Math.round(((overall - 70) / 30) * 100) };
}

/* ---------- Progres bab (materi MikroTik) ---------- */

/** Slug bab yang sudah diselesaikan user pada satu materi. */
export function getCompletedLessons(userId: number, courseId: string): Set<string> {
  const rows = db
    .prepare("SELECT lesson_slug FROM lesson_progress WHERE user_id = ? AND course_id = ?")
    .all(userId, courseId) as { lesson_slug: string }[];
  return new Set(rows.map((r) => r.lesson_slug));
}

/**
 * Persentase 0-100 = bab selesai / jumlah file .md. Hanya slug yang masih ada
 * di folder yang dihitung, jadi file yang dihapus atau diganti nama tidak membuat progres > 100.
 */
function lessonPercent(slugs: string[], done: Set<string>) {
  if (slugs.length === 0) return 0;
  const finished = slugs.filter((s) => done.has(s)).length;
  return Math.round((finished / slugs.length) * 100);
}

/* ---------- Baca ---------- */

export const getLearningData = cache((userId: number) => {
  const today = (db.prepare("SELECT date('now', '+7 hours') AS d").get() as { d: string }).d;

  // Progres materi digabung ke katalog
  const progressRows = db
    .prepare("SELECT course_id, progress FROM course_progress WHERE user_id = ?")
    .all(userId) as { course_id: string; progress: number }[];
  const progressMap = new Map(progressRows.map((r) => [r.course_id, r.progress]));

  // Bab selesai per materi (hanya dipakai materi MikroTik)
  const lessonRows = db
    .prepare("SELECT course_id, lesson_slug FROM lesson_progress WHERE user_id = ?")
    .all(userId) as { course_id: string; lesson_slug: string }[];
  const doneByCourse = new Map<string, Set<string>>();
  for (const r of lessonRows) {
    const set = doneByCourse.get(r.course_id) ?? new Set<string>();
    set.add(r.lesson_slug);
    doneByCourse.set(r.course_id, set);
  }

  const userCourses = courses.map((c) => {
    const id = String(c.id);
    if (c.vendor !== "MikroTik") return { ...c, progress: progressMap.get(id) ?? 0 };

    // MikroTik: angka diambil dari isi materi yang benar-benar ada.
    const outline = getCourseOutline(id);
    if (outline.count === 0) return { ...c, progress: 0 }; // materi belum ditulis
    return {
      ...c,
      lessons: outline.count,
      minutes: outline.minutes,
      progress: lessonPercent(outline.slugs, doneByCourse.get(id) ?? new Set()),
    };
  });

  // Progres semua modul (materi lama + modul Learning Path) berdasarkan id
  const progressById: Record<string, number> = Object.fromEntries(progressMap);
  for (const c of userCourses) {
    if (c.vendor === "MikroTik") progressById[String(c.id)] = c.progress;
  }

  // Skor terbaik tiap quiz digabung ke katalog
  const scoreRows = db
    .prepare("SELECT quiz_id, MAX(score) AS score FROM quiz_attempts WHERE user_id = ? GROUP BY quiz_id")
    .all(userId) as { quiz_id: string; score: number }[];
  const scoreMap = new Map(scoreRows.map((r) => [r.quiz_id, r.score]));
  const userQuizzes = quizzes.map((q) => ({
    ...q,
    // Jumlah soal diambil dari bank soal kalau sudah ada, supaya kartu selalu akurat.
    questions: getQuizBank(String(q.id))?.length ?? q.questions,
    score: scoreMap.get(String(q.id)) ?? null,
  }));

  // Jam belajar, streak, grafik 7 hari
  const studyMinutes = (
    db.prepare("SELECT COALESCE(SUM(minutes), 0) AS m FROM study_days WHERE user_id = ?").get(userId) as { m: number }
  ).m;

  const studyDays = db
    .prepare("SELECT day, minutes FROM study_days WHERE user_id = ? AND day >= ? ORDER BY day DESC")
    .all(userId, shiftDay(today, -400)) as { day: string; minutes: number }[];
  const minutesByDay = new Map(studyDays.map((r) => [r.day, r.minutes]));

  // Streak: hari berturut-turut dengan belajar. Hari ini belum belajar tidak memutus streak kemarin.
  let cursor = (minutesByDay.get(today) ?? 0) > 0 ? today : shiftDay(today, -1);
  let streak = 0;
  while ((minutesByDay.get(cursor) ?? 0) > 0) {
    streak++;
    cursor = shiftDay(cursor, -1);
  }

  const weekly: WeekDay[] = Array.from({ length: 7 }, (_, i) => {
    const day = shiftDay(today, i - 6);
    return { day: dayLabel(day), minutes: minutesByDay.get(day) ?? 0 };
  });

  // Aktivitas terakhir
  const recent = (
    db
      .prepare(
        `SELECT id, type, text,
                (CAST(strftime('%s', 'now') AS INTEGER) * 1000 - created_at) AS age
           FROM activity WHERE user_id = ?
          ORDER BY created_at DESC, id DESC LIMIT 6`,
      )
      .all(userId) as { id: number; type: ActivityType; text: string; age: number }[]
  ).map<ActivityItem>((r) => ({ id: r.id, type: r.type, text: r.text, time: formatAgo(Math.max(0, r.age)) }));

  const overall = avgProgress(userCourses);
  const isEmpty =
    progressRows.length === 0 &&
    lessonRows.length === 0 &&
    scoreRows.length === 0 &&
    studyMinutes === 0 &&
    recent.length === 0;

  return {
    courses: userCourses,
    progressById,
    quizzes: userQuizzes,
    studyMinutes,
    streak,
    weekly,
    recent,
    overall,
    isEmpty,
    ...levelFor(overall),
  };
});

/**
 * Ringkasan latihan praktik untuk dashboard: Troubleshooting Challenge, Virtual Lab, dan
 * portofolio. Dibaca langsung dari tabel troubleshoot_results, lab_state, dan portfolio_items.
 */
export const getPracticeStats = cache((userId: number) => {
  const count = (sql: string) => (db.prepare(sql).get(userId) as { n: number }).n;

  // Hanya tantangan yang masih ada di katalog yang dihitung (id lama yang sudah dihapus diabaikan).
  const known = new Set(SCENARIOS.map((s) => s.id));
  const tsRows = (
    db
      .prepare("SELECT scenario_id, best_score FROM troubleshoot_results WHERE user_id = ?")
      .all(userId) as { scenario_id: string; best_score: number }[]
  ).filter((r) => known.has(r.scenario_id));

  return {
    labsDone: count("SELECT COUNT(*) AS n FROM lab_state WHERE user_id = ? AND completed = 1"),
    portfolio: count("SELECT COUNT(*) AS n FROM portfolio_items WHERE user_id = ?"),
    tsSolved: tsRows.length,
    tsTotal: SCENARIOS.length,
    tsScore: tsRows.reduce((s, r) => s + r.best_score, 0),
  };
});

/* ---------- Tulis ---------- */

function addStudy(userId: number, minutes: number) {
  if (minutes <= 0) return;
  db.prepare(
    `INSERT INTO study_days (user_id, day, minutes) VALUES (?, date('now', '+7 hours'), ?)
     ON CONFLICT(user_id, day) DO UPDATE SET minutes = minutes + excluded.minutes`,
  ).run(userId, minutes);
}

function addActivity(userId: number, type: ActivityType, text: string) {
  db.prepare("INSERT INTO activity (user_id, type, text, created_at) VALUES (?, ?, ?, ?)").run(
    userId,
    type,
    text,
    Date.now(),
  );
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Batas menit belajar yang dicatat dari satu kenaikan progres materi (setCourseProgress). */
const MAX_PROGRESS_STUDY_MIN = 30;

/**
 * Tandai satu bab materi MikroTik selesai. Idempoten: memanggilnya ulang untuk bab yang
 * sama tidak menambah menit belajar atau aktivitas. Progres materi dihitung ulang dari
 * jumlah bab dan ikut disimpan ke course_progress supaya halaman lain yang membaca
 * tabel itu tetap konsisten.
 */
export function completeLesson(userId: number, courseId: string, slug: string) {
  const course = courses.find((c) => c.vendor === "MikroTik" && String(c.id) === courseId);
  if (!course) throw new Error("Materi tidak ditemukan.");
  const found = getLesson(courseId, slug);
  if (!found) throw new Error("Bab tidak ditemukan.");

  db.transaction(() => {
    const res = db
      .prepare(
        "INSERT OR IGNORE INTO lesson_progress (user_id, course_id, lesson_slug, completed_at) VALUES (?, ?, ?, ?)",
      )
      .run(userId, courseId, slug, Date.now());

    if (res.changes > 0) {
      addStudy(userId, found.lesson.minutes);
      addActivity(
        userId,
        "course",
        `Menyelesaikan bab ${found.lesson.number}: ${found.lesson.title} (${course.title})`,
      );
    }

    const percent = lessonPercent(getCourseOutline(courseId).slugs, getCompletedLessons(userId, courseId));
    db.prepare(
      `INSERT INTO course_progress (user_id, course_id, progress, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, course_id) DO UPDATE SET progress = excluded.progress, updated_at = excluded.updated_at`,
    ).run(userId, courseId, percent, Date.now());
  })();
}

/**
 * Set progres modul (0-100). Dipakai materi non-MikroTik dan modul Learning Path.
 * Progres tidak diturunkan. Kenaikan dihitung sebagai menit belajar.
 */
export function setCourseProgress(userId: number, courseId: string, progress: number) {
  const course = getModuleById(courseId);
  if (!course) throw new Error("Materi tidak ditemukan.");
  if (!Number.isFinite(progress)) throw new Error("Progres tidak valid.");
  const next = clamp(Math.round(progress), 0, 100);

  db.transaction(() => {
    const prev =
      (
        db.prepare("SELECT progress FROM course_progress WHERE user_id = ? AND course_id = ?").get(userId, courseId) as
          | { progress: number }
          | undefined
      )?.progress ?? 0;
    const value = Math.max(prev, next);
    const delta = value - prev;

    db.prepare(
      `INSERT INTO course_progress (user_id, course_id, progress, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, course_id) DO UPDATE SET progress = excluded.progress, updated_at = excluded.updated_at`,
    ).run(userId, courseId, value, Date.now());

    if (delta > 0) {
      // Kenaikan progres bukan waktu belajar sungguhan (user bisa melompat ke 100% sekali klik),
      // jadi menit yang dicatat dibatasi MAX_PROGRESS_STUDY_MIN per aksi.
      addStudy(
        userId,
        clamp(Math.round((course.minutes * delta) / 100), 1, MAX_PROGRESS_STUDY_MIN),
      );
      addActivity(
        userId,
        "course",
        `${value === 100 ? "Menyelesaikan" : "Melanjutkan"} ${course.title} (${course.vendor})`,
      );
    }
  })();
}

/** Catat hasil quiz. `minutes` = perkiraan waktu mengerjakan, dihitung sebagai waktu belajar. */
export function recordQuizAttempt(userId: number, quizId: string, score: number, minutes = 15) {
  const quiz = quizzes.find((q) => String(q.id) === quizId);
  if (!quiz) throw new Error("Quiz tidak ditemukan.");
  if (!Number.isFinite(score)) throw new Error("Skor tidak valid.");
  const value = clamp(Math.round(score), 0, 100);

  db.transaction(() => {
    db.prepare("INSERT INTO quiz_attempts (user_id, quiz_id, score, created_at) VALUES (?, ?, ?, ?)").run(
      userId,
      quizId,
      value,
      Date.now(),
    );
    addStudy(userId, clamp(Math.round(minutes), 0, 240));
    addActivity(userId, "quiz", `Mengerjakan Quiz ${quiz.title} · skor ${value}`);
  })();
}

/* ---------- Sesi quiz / exam ---------- */

export type QuizSession = {
  /** Indeks opsi yang dipilih per soal. Pilihan tunggal berisi satu angka, pilihan ganda bisa lebih. */
  answers: Record<string, number[]>;
  current: number;
  /** Sisa waktu dalam ms, dihitung dari jam database (bisa <= 0 kalau sudah lewat). */
  remainingMs: number;
};

export type QuizReviewItem = { chosen: number[]; answer: number[]; explain: string | null };
export type QuizResult = {
  score: number;
  correct: number;
  total: number;
  passed: boolean;
  passing: number;
  review: QuizReviewItem[];
};
export type QuizAttemptRow = { id: number; score: number; correct: number | null; total: number | null; time: string };

const NOW_MS_SQL = "CAST(strftime('%s', 'now') AS INTEGER) * 1000";

function findQuiz(quizId: string) {
  const quiz = quizzes.find((q) => String(q.id) === quizId);
  if (!quiz) throw new Error("Quiz tidak ditemukan.");
  const bank = getQuizBank(quizId);
  if (!bank) throw new Error("Soal untuk quiz ini belum tersedia.");
  return { quiz, bank };
}

/** Rapikan jawaban: buang soal/opsi tidak valid, urutkan, dan batasi soal pilihan tunggal ke satu jawaban. */
function cleanAnswers(raw: unknown, bank: QuizQuestion[]): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const qi = Number(k);
    if (!Number.isInteger(qi) || qi < 0 || qi >= bank.length) continue;
    const list = (Array.isArray(v) ? v : [v]).filter(
      (n): n is number => typeof n === "number" && Number.isInteger(n) && n >= 0 && n < bank[qi].options.length,
    );
    const uniq = [...new Set(list)].sort((x, y) => x - y);
    if (uniq.length === 0) continue;
    out[String(qi)] = Array.isArray(bank[qi].answer) ? uniq : uniq.slice(0, 1);
  }
  return out;
}

/** Baca jawaban dari DB. Sesi lama menyimpan satu angka per soal; ubah ke array. */
function normalizeStored(raw: unknown): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const arr = (Array.isArray(v) ? v : [v]).filter((n): n is number => typeof n === "number" && Number.isInteger(n) && n >= 0);
    if (arr.length) out[k] = arr;
  }
  return out;
}

/** Sesi yang sedang berjalan untuk quiz ini (null kalau tidak ada). Aman dipanggil dari render. */
export function getQuizSession(userId: number, quizId: string): QuizSession | null {
  const row = db
    .prepare(
      `SELECT answers, current, (deadline - ${NOW_MS_SQL}) AS remaining
         FROM quiz_sessions WHERE user_id = ? AND quiz_id = ?`,
    )
    .get(userId, quizId) as { answers: string; current: number; remaining: number } | undefined;
  if (!row) return null;
  let answers: Record<string, number[]> = {};
  try {
    answers = normalizeStored(JSON.parse(row.answers));
  } catch {
    /* rusak: mulai kosong */
  }
  return { answers, current: row.current, remainingMs: row.remaining };
}

/** Riwayat percobaan terbaru milik user untuk satu quiz. */
export function getQuizAttempts(userId: number, quizId: string): QuizAttemptRow[] {
  const rows = db
    .prepare(
      `SELECT id, score, correct, total, (${NOW_MS_SQL} - created_at) AS age
         FROM quiz_attempts WHERE user_id = ? AND quiz_id = ?
        ORDER BY created_at DESC, id DESC LIMIT 5`,
    )
    .all(userId, quizId) as { id: number; score: number; correct: number | null; total: number | null; age: number }[];
  return rows.map((r) => ({
    id: r.id,
    score: r.score,
    correct: r.correct,
    total: r.total,
    time: formatAgo(Math.max(0, r.age)),
  }));
}

/** Mulai sesi baru, atau lanjutkan yang sudah ada (tidak mengulang timer). */
export function startQuizSession(userId: number, quizId: string): QuizSession {
  const { quiz } = findQuiz(quizId);
  const existing = getQuizSession(userId, quizId);
  if (existing) return existing;

  const now = Date.now();
  const deadline = now + quiz.minutes * 60_000;
  db.prepare(
    `INSERT INTO quiz_sessions (user_id, quiz_id, answers, current, started_at, deadline, updated_at)
     VALUES (?, ?, '{}', 0, ?, ?, ?)`,
  ).run(userId, quizId, now, deadline, now);
  return { answers: {}, current: 0, remainingMs: deadline - now };
}

/** Simpan jawaban dan posisi soal. Diam-diam diabaikan kalau sesinya sudah tidak ada. */
export function saveQuizProgress(userId: number, quizId: string, answers: unknown, current: number) {
  const { bank } = findQuiz(quizId);
  const clean = cleanAnswers(answers, bank);
  const pos = clamp(Number.isFinite(current) ? Math.round(current) : 0, 0, bank.length - 1);
  db.prepare("UPDATE quiz_sessions SET answers = ?, current = ?, updated_at = ? WHERE user_id = ? AND quiz_id = ?").run(
    JSON.stringify(clean),
    pos,
    Date.now(),
    userId,
    quizId,
  );
}

/**
 * Kumpulkan sesi: nilai di server, simpan percobaan lengkap (skor, benar/total, jawaban, durasi),
 * hapus sesi, dan catat menit belajar serta aktivitas. Mengembalikan hasil beserta pembahasan.
 */
export function submitQuizSession(userId: number, quizId: string, finalAnswers?: unknown): QuizResult {
  const { quiz, bank } = findQuiz(quizId);

  const row = db
    .prepare("SELECT answers, started_at FROM quiz_sessions WHERE user_id = ? AND quiz_id = ?")
    .get(userId, quizId) as { answers: string; started_at: number } | undefined;
  if (!row) throw new Error("Sesi quiz tidak ditemukan. Mulai ulang quiz.");

  let saved: Record<string, number[]> = {};
  try {
    saved = normalizeStored(JSON.parse(row.answers));
  } catch {
    /* rusak: pakai kosong */
  }
  // Jawaban terakhir dari browser menimpa yang tersimpan (mis. klik terakhir sebelum waktu habis).
  const answers = { ...cleanAnswers(saved, bank), ...cleanAnswers(finalAnswers, bank) };

  const total = bank.length;
  let correct = 0;
  const review: QuizReviewItem[] = bank.map((q, i) => {
    const chosen = answers[String(i)] ?? [];
    const right = Array.isArray(q.answer) ? [...q.answer].sort((x, y) => x - y) : [q.answer];
    // Benar hanya kalau himpunan pilihan sama persis dengan kunci (berlaku juga untuk soal pilihan ganda).
    if (chosen.length === right.length && chosen.every((n, j) => n === right[j])) correct++;
    return { chosen, answer: right, explain: q.explain ?? null };
  });
  const score = Math.round((correct / total) * 100);
  const now = Date.now();
  const durationSec = Math.max(0, Math.round((now - row.started_at) / 1000));
  const studyMin = clamp(Math.max(1, Math.round(durationSec / 60)), 1, quiz.minutes);

  db.transaction(() => {
    db.prepare(
      `INSERT INTO quiz_attempts (user_id, quiz_id, score, created_at, correct, total, answers, duration_sec)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(userId, quizId, score, now, correct, total, JSON.stringify(answers), durationSec);
    db.prepare("DELETE FROM quiz_sessions WHERE user_id = ? AND quiz_id = ?").run(userId, quizId);
    addStudy(userId, studyMin);
    addActivity(userId, "quiz", `Mengerjakan ${quiz.kind} ${quiz.title} · skor ${score}`);
  })();

  return { score, correct, total, passed: score >= quiz.passing, passing: quiz.passing, review };
}

/** Batalkan sesi yang sedang berjalan tanpa menilai. */
export function discardQuizSession(userId: number, quizId: string) {
  db.prepare("DELETE FROM quiz_sessions WHERE user_id = ? AND quiz_id = ?").run(userId, quizId);
}

/** Catat aktivitas lab / portofolio beserta durasinya. */
export function recordActivity(userId: number, type: "lab" | "portfolio", text: string, minutes: number) {
  const label = text.trim().slice(0, 120);
  if (!label) throw new Error("Deskripsi aktivitas kosong.");
  db.transaction(() => {
    addStudy(userId, clamp(Math.round(Number.isFinite(minutes) ? minutes : 0), 0, 480));
    addActivity(userId, type, label);
  })();
}

/**
 * Isi data contoh agar dashboard bisa dicoba. Hanya jalan kalau user belum punya data apa pun.
 * Progres materi TIDAK lagi diisi di sini: progres harus berasal dari bab yang benar-benar diselesaikan.
 */
export function seedDemoData(userId: number) {
  const existing = db
    .prepare(
      `SELECT (SELECT COUNT(*) FROM course_progress WHERE user_id = @u)
            + (SELECT COUNT(*) FROM lesson_progress WHERE user_id = @u)
            + (SELECT COUNT(*) FROM quiz_attempts   WHERE user_id = @u)
            + (SELECT COUNT(*) FROM study_days      WHERE user_id = @u) AS n`,
    )
    .get({ u: userId }) as { n: number };
  if (existing.n > 0) return false;

  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  db.transaction(() => {
    const scores = [85, 92, 68, 74, 55, 88];
    quizzes.slice(0, scores.length).forEach((q, i) => {
      db.prepare("INSERT INTO quiz_attempts (user_id, quiz_id, score, created_at) VALUES (?, ?, ?, ?)").run(
        userId,
        String(q.id),
        scores[i],
        now - i * DAY,
      );
    });

    // Menit belajar 0..6 hari lalu (0 = hari ini). Hari ke-3 kosong sehingga streak = 3.
    const minutesAgo = [40, 25, 50, 0, 30, 45, 20];
    minutesAgo.forEach((m, daysAgo) => {
      if (m <= 0) return;
      db.prepare("INSERT INTO study_days (user_id, day, minutes) VALUES (?, date('now', '+7 hours', ?), ?)").run(
        userId,
        `-${daysAgo} days`,
        m,
      );
    });

    const first = courses[4] ?? courses[0];
    const second = courses[1] ?? courses[0];
    const quiz = quizzes[0];
    const items: [ActivityType, string, number][] = [
      ["course", `Melanjutkan ${first.title} (${first.vendor})`, 2 * 60 * 60 * 1000],
      ["lab", "Mengerjakan lab VLAN & Inter-VLAN Routing", DAY],
      ["quiz", `Mengerjakan Quiz ${quiz?.title ?? "Subnetting"} · skor ${scores[0]}`, 2 * DAY],
      ["course", `Menyelesaikan ${second.title} (${second.vendor})`, 3 * DAY],
    ];
    for (const [type, text, age] of items) {
      db.prepare("INSERT INTO activity (user_id, type, text, created_at) VALUES (?, ?, ?, ?)").run(
        userId,
        type,
        text,
        now - age,
      );
    }
  })();

  return true;
}

/** Data belajar milik user yang sedang login (null kalau belum login). Dipakai halaman server. */
export async function getMyLearning() {
  const user = await getCurrentUser();
  return user ? getLearningData(user.id) : null;
}