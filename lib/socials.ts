export type SocialPlatform = {
  id: string;
  label: string;
  placeholder: string;
  /** Host yang diterima (setelah lowercase). */
  host: RegExp;
  /** Host hasil normalisasi yang disimpan. */
  canonicalHost: string;
  /** Path harus berbentuk link profil, bukan beranda atau halaman lain. */
  path: RegExp;
  /** Segmen pertama path yang bukan username. */
  reserved?: string[];
};

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    id: "linkedin",
    label: "LinkedIn",
    placeholder: "linkedin.com/in/username",
    host: /^([a-z]{2,3}\.)?linkedin\.com$/,
    canonicalHost: "www.linkedin.com",
    path: /^\/(in|company)\/[A-Za-z0-9\-_%.]{3,100}$/,
  },
  {
    id: "github",
    label: "GitHub",
    placeholder: "github.com/username",
    host: /^(www\.)?github\.com$/,
    canonicalHost: "github.com",
    path: /^\/[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/,
    reserved: ["features", "pricing", "login", "join", "settings", "about", "explore", "topics", "orgs", "marketplace", "sponsors"],
  },
  {
    id: "instagram",
    label: "Instagram",
    placeholder: "instagram.com/username",
    host: /^(www\.)?instagram\.com$/,
    canonicalHost: "www.instagram.com",
    path: /^\/[A-Za-z0-9._]{1,30}$/,
    reserved: ["p", "reel", "reels", "explore", "accounts", "stories", "tv", "direct"],
  },
  {
    id: "tiktok",
    label: "TikTok",
    placeholder: "tiktok.com/@username",
    host: /^(www\.)?tiktok\.com$/,
    canonicalHost: "www.tiktok.com",
    path: /^\/@[A-Za-z0-9._]{2,24}$/,
  },
  {
    id: "x",
    label: "X (Twitter)",
    placeholder: "x.com/username",
    host: /^(www\.)?(x|twitter)\.com$/,
    canonicalHost: "x.com",
    path: /^\/[A-Za-z0-9_]{1,15}$/,
    reserved: ["home", "explore", "search", "settings", "i", "intent", "share", "login", "notifications", "messages"],
  },
  {
    id: "youtube",
    label: "YouTube",
    placeholder: "youtube.com/@channel",
    host: /^(www\.|m\.)?youtube\.com$/,
    canonicalHost: "www.youtube.com",
    path: /^\/(@[A-Za-z0-9._-]{3,30}|channel\/UC[A-Za-z0-9_-]{22}|c\/[A-Za-z0-9._%-]{1,60}|user\/[A-Za-z0-9._%-]{1,60})$/,
  },
  {
    id: "facebook",
    label: "Facebook",
    placeholder: "facebook.com/username",
    host: /^(www\.|m\.)?facebook\.com$/,
    canonicalHost: "www.facebook.com",
    path: /^\/(profile\.php|[A-Za-z0-9.]{5,50})$/,
    reserved: ["watch", "groups", "marketplace", "events", "pages", "login", "help", "policies", "gaming", "reel", "share", "sharer"],
  },
  {
    id: "telegram",
    label: "Telegram",
    placeholder: "t.me/username",
    host: /^(t|telegram)\.me$/,
    canonicalHost: "t.me",
    path: /^\/[A-Za-z0-9_]{5,32}$/,
    reserved: ["joinchat", "addstickers", "share", "proxy", "socks", "login"],
  },
];

export const SOCIAL_BY_ID: Record<string, SocialPlatform> = Object.fromEntries(
  SOCIAL_PLATFORMS.map((p) => [p.id, p]),
);

export type SocialResult = { ok: true; url: string } | { ok: false; error: string };

/**
 * Validasi + normalisasi satu link. Panggil hanya untuk input yang tidak kosong.
 * Dipakai di client (pesan error langsung) dan di server (yang menentukan).
 */
export function normalizeSocial(id: string, raw: string): SocialResult {
  const p = SOCIAL_BY_ID[id];
  if (!p) return { ok: false, error: "Platform tidak dikenal." };
  const fail = (error: string): SocialResult => ({ ok: false, error });
  const wrong = () =>
    fail(`Bukan link profil ${p.label}. Contoh: ${p.placeholder}`);

  let input = raw.trim();
  if (!input || input.length > 200 || /\s/.test(input)) return wrong();
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(input)) input = `https://${input}`;

  let u: URL;
  try {
    u = new URL(input);
  } catch {
    return wrong();
  }

  if (u.protocol !== "https:" && u.protocol !== "http:") return wrong();
  if (u.username || u.password || u.port) return wrong();
  if (!p.host.test(u.hostname.toLowerCase())) return wrong();

  const path = u.pathname.replace(/\/+$/, "");
  if (!p.path.test(path)) return wrong();

  const first = path.split("/")[1]?.toLowerCase() ?? "";
  if (p.reserved?.includes(first)) return wrong();

  // Facebook: profile.php wajib membawa id numerik.
  if (p.id === "facebook" && path === "/profile.php") {
    const fid = u.searchParams.get("id") ?? "";
    if (!/^\d{5,20}$/.test(fid)) return wrong();
    return { ok: true, url: `https://${p.canonicalHost}/profile.php?id=${fid}` };
  }

  return { ok: true, url: `https://${p.canonicalHost}${path}` };
}