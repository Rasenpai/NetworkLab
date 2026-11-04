import "server-only";
import fs from "node:fs";
import path from "node:path";
import { cache } from "react";

/**
 * Materi MikroTik dibaca dari file Markdown:
 *   content/mikrotik/<course-id>/<urutan>-<slug>.md
 * <course-id> = id di lib/data.ts (mt-1, mt-2, ...).
 * Urutan bab mengikuti nama file (01-, 02-, ...). Tidak perlu daftar/array lagi.
 */

const ROOT = path.join(process.cwd(), "content", "mikrotik");
const SAFE = /^[a-z0-9][a-z0-9_-]*$/i; // cegah path traversal

export type Lesson = {
  slug: string;
  number: number;
  title: string;
  summary: string;
  minutes: number;
  body: string;
};

function parse(raw: string) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  const meta: Record<string, string> = {};
  if (!m) return { meta, body: raw };
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i < 0) continue;
    meta[line.slice(0, i).trim()] = line
      .slice(i + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
  return { meta, body: m[2] };
}

function titleFromSlug(slug: string) {
  return slug
    .replace(/^\d+[-_]?/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getLessons(courseId: string): Lesson[] {
  if (!SAFE.test(courseId)) return [];
  const dir = path.join(ROOT, courseId);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((file, i) => {
      const slug = file.replace(/\.md$/, "");
      const { meta, body } = parse(fs.readFileSync(path.join(dir, file), "utf8"));
      return {
        slug,
        number: i + 1,
        title: meta.title || titleFromSlug(slug),
        summary: meta.summary || "",
        minutes: Number(meta.minutes) || 10,
        body,
      };
    });
}

export function getLesson(courseId: string, slug: string) {
  if (!SAFE.test(slug)) return null;
  const lessons = getLessons(courseId);
  const index = lessons.findIndex((l) => l.slug === slug);
  if (index < 0) return null;
  return {
    lesson: lessons[index],
    prev: lessons[index - 1] ?? null,
    next: lessons[index + 1] ?? null,
    total: lessons.length,
  };
}

/**
 * Ringkasan materi dari file .md yang benar-benar ada: daftar slug berurutan,
 * jumlah bab, dan total menit. Dipakai untuk menghitung progres dan menggantikan
 * angka `lessons` / `minutes` buatan tangan di lib/data.ts.
 */
export type CourseOutline = { slugs: string[]; count: number; minutes: number };

export const getCourseOutline = cache((courseId: string): CourseOutline => {
  const lessons = getLessons(courseId);
  return {
    slugs: lessons.map((l) => l.slug),
    count: lessons.length,
    minutes: lessons.reduce((sum, l) => sum + l.minutes, 0),
  };
});