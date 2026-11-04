/**
 * Avatar untuk user mana pun (bukan hanya yang sedang login).
 * Foto diambil dari /api/users/:id/avatar; kalau belum punya, tampil inisial.
 */
export default function PersonAvatar({
  id,
  name,
  version,
  className = "size-10 text-sm",
}: {
  id: number;
  name: string;
  version: number | null;
  className?: string;
}) {
  const base = `shrink-0 rounded-full ${className}`;

  if (version) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/api/users/${id}/avatar?v=${version}`}
        alt=""
        loading="lazy"
        className={`${base} bg-fg/10 object-cover`}
      />
    );
  }

  const initial = (name.trim().charAt(0) || "?").toUpperCase();
  return (
    <span
      aria-hidden
      className={`${base} inline-flex select-none items-center justify-center bg-accent font-semibold text-white`}
    >
      {initial}
    </span>
  );
}
