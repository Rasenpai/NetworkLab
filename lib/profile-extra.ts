import "server-only";
import { db } from "@/lib/db";
import { ALL_SKILL_IDS, BIO_MAX, SKILLS_MAX } from "@/lib/skills";
import { SOCIAL_PLATFORMS, normalizeSocial } from "@/lib/socials";

export type ProfileExtras = {
  bio: string;
  skills: string[];
  socials: Record<string, string>;
};

export function getProfileExtras(userId: number): ProfileExtras {
  const row = db
    .prepare("SELECT bio, skills, socials FROM users WHERE id = ?")
    .get(userId) as
    | { bio: string | null; skills: string | null; socials: string | null }
    | undefined;

  let skills: string[] = [];
  try {
    const parsed: unknown = row?.skills ? JSON.parse(row.skills) : [];
    if (Array.isArray(parsed))
      skills = parsed.filter(
        (s): s is string => typeof s === "string" && ALL_SKILL_IDS.has(s),
      );
  } catch {
    /* JSON rusak: anggap kosong */
  }

  // Divalidasi ulang saat dibaca: nilai ini dipakai sebagai href, jadi jangan percaya isi DB begitu saja.
  const socials: Record<string, string> = {};
  try {
    const parsed: unknown = row?.socials ? JSON.parse(row.socials) : {};
    if (parsed && typeof parsed === "object") {
      for (const p of SOCIAL_PLATFORMS) {
        const v = (parsed as Record<string, unknown>)[p.id];
        if (typeof v !== "string") continue;
        const r = normalizeSocial(p.id, v);
        if (r.ok) socials[p.id] = r.url;
      }
    }
  } catch {
    /* JSON rusak: anggap kosong */
  }

  return { bio: row?.bio ?? "", skills, socials };
}

/** Validasi bio, skill, dan sosmed dari form. Tidak menyentuh DB. */
export function parseProfileExtras(
  fd: FormData,
): { error: string } | { data: ProfileExtras } {
  const bio = String(fd.get("bio") ?? "")
    .replace(/\r\n/g, "\n")
    .trim();
  if (bio.length > BIO_MAX) return { error: `Bio maksimal ${BIO_MAX} karakter.` };

  const skills = [...new Set(fd.getAll("skills").map(String))].filter((s) =>
    ALL_SKILL_IDS.has(s),
  );
  if (skills.length > SKILLS_MAX)
    return { error: `Pilih maksimal ${SKILLS_MAX} skill.` };

  const socials: Record<string, string> = {};
  for (const p of SOCIAL_PLATFORMS) {
    const raw = String(fd.get(`social_${p.id}`) ?? "").trim();
    if (!raw) continue;
    const r = normalizeSocial(p.id, raw);
    if (!r.ok) return { error: `${p.label}: ${r.error}` };
    socials[p.id] = r.url;
  }

  return { data: { bio, skills, socials } };
}

export function saveProfileExtras(userId: number, data: ProfileExtras) {
  db.prepare(
    "UPDATE users SET bio = ?, skills = ?, socials = ? WHERE id = ?",
  ).run(
    data.bio || null,
    JSON.stringify(data.skills),
    JSON.stringify(data.socials),
    userId,
  );
}