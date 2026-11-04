// Aman dipakai di server maupun client (tanpa "server-only").
const TZ = "Asia/Jakarta";

const timeFmt = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: TZ,
});

const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: TZ,
});

const longDayFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: TZ,
});

const shortDayFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  timeZone: TZ,
});

/** "14:02" (WIB). */
export function formatTime(ts: number) {
  return timeFmt.format(ts).replace(".", ":");
}

/** Kunci hari "YYYY-MM-DD" (WIB), untuk mengelompokkan pesan per hari. */
export function dayKey(ts: number) {
  return dayKeyFmt.format(ts);
}

/** "4 November 2026". */
export function formatLongDay(ts: number) {
  return longDayFmt.format(ts);
}

/** Hari ini → jam, selain itu → "3 Nov". `now` diberikan pemanggil agar fungsi ini murni. */
export function formatShort(ts: number, now: number) {
  return dayKey(ts) === dayKey(now) ? formatTime(ts) : shortDayFmt.format(ts);
}