/* eslint-disable @next/next/no-img-element */

/** Avatar bulat: foto kalau ada, kalau tidak inisial nama. Atur ukuran lewat className (mis. "size-9 text-sm"). */
export default function UserAvatar({
  name,
  version,
  className = "size-9 text-sm",
}: {
  name: string;
  version: number | null;
  className?: string;
}) {
  if (version) {
    return (
      <img
        src={`/api/avatar?v=${version}`}
        alt=""
        className={`${className} shrink-0 rounded-full object-cover`}
      />
    );
  }
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      aria-hidden
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-accent/20 font-semibold text-accent`}
    >
      {initial}
    </span>
  );
}
