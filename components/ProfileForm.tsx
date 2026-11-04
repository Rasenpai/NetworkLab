"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Camera, Lock, Trash2 } from "lucide-react";
import { type ProfileState } from "@/app/actions/profile";
import { saveProfileAction } from "@/app/actions/profile-extra";
import UserAvatar from "@/components/UserAvatar";
import { Card } from "@/components/ui";
import { BIO_MAX, SKILLS_MAX, SKILL_GROUPS, SKILL_LABEL } from "@/lib/skills";

const inputCls =
  "w-full rounded-lg border border-fg/15 bg-fg/5 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:opacity-60";

/** Potong jadi persegi (tengah) lalu kecilkan ke 256x256, supaya file kecil dan seragam. */
async function resizeToSquare(file: File, size = 256): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const side = Math.min(bmp.width, bmp.height);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak tersedia.");
  ctx.drawImage(
    bmp,
    (bmp.width - side) / 2,
    (bmp.height - side) / 2,
    side,
    side,
    0,
    0,
    size,
    size,
  );
  bmp.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Gagal memproses gambar."))),
      "image/webp",
      0.85,
    ),
  );
}

export default function ProfileForm({
  name,
  email,
  avatarVersion,
  joined,
  bio,
  skills,
}: {
  name: string;
  email: string;
  avatarVersion: number | null;
  joined: string;
  bio: string;
  skills: string[];
}) {
  const [state, dispatch, pending] = useActionState<ProfileState, FormData>(
    saveProfileAction,
    {},
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removeFlag, setRemoveFlag] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [nameValue, setNameValue] = useState(name);
  const [bioValue, setBioValue] = useState(bio);
  const [selected, setSelected] = useState<string[]>(skills);

  // Setelah berhasil disimpan, buang state sementara (data baru sudah datang dari server).
  useEffect(() => {
    if (state.ok) {
      setBlob(null);
      setRemoveFlag(false);
      setPreview((old) => {
        if (old) URL.revokeObjectURL(old);
        return null;
      });
    }
  }, [state]);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // supaya file yang sama bisa dipilih ulang
    if (!file) return;
    setLocalError(null);

    if (!file.type.startsWith("image/"))
      return setLocalError("File harus berupa gambar (JPG, PNG, atau WebP).");
    if (file.size > 10 * 1024 * 1024)
      return setLocalError("Ukuran file maksimal 10 MB.");

    try {
      const resized = await resizeToSquare(file);
      setBlob(resized);
      setRemoveFlag(false);
      setPreview((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(resized);
      });
    } catch {
      setLocalError("Gambar tidak bisa dibaca. Coba file lain.");
    }
  }

  function removeAvatar() {
    setBlob(null);
    setRemoveFlag(true);
    setLocalError(null);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
  }

  function toggleSkill(id: string) {
    setSelected((cur) =>
      cur.includes(id)
        ? cur.filter((s) => s !== id)
        : cur.length >= SKILLS_MAX
          ? cur
          : [...cur, id],
    );
  }

  function resetAll() {
    setBlob(null);
    setRemoveFlag(false);
    setLocalError(null);
    setNameValue(name);
    setBioValue(bio);
    setSelected(skills);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
  }

  function submit(fd: FormData) {
    if (blob) fd.set("avatar", new File([blob], "avatar", { type: blob.type }));
    else if (removeFlag) fd.set("remove_avatar", "1");
    dispatch(fd);
  }

  const hasAvatar = !!preview || (!removeFlag && avatarVersion !== null);
  const error = localError ?? state.error;
  const skillsChanged =
    [...selected].sort().join(",") !== [...skills].sort().join(",");
  const dirty =
    nameValue.trim() !== name ||
    bioValue.trim() !== bio ||
    skillsChanged ||
    !!blob ||
    removeFlag;
  const displayName = nameValue.trim() || name;
  const atLimit = selected.length >= SKILLS_MAX;

  return (
    <form
      action={submit}
      className="grid items-start gap-6 lg:grid-cols-[280px_1fr]"
    >
      {/* Kiri: identitas */}
      <Card className="flex flex-col items-center p-6 text-center">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-label={hasAvatar ? "Ganti foto" : "Unggah foto"}
          className="group relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Pratinjau avatar"
              className="size-28 rounded-full object-cover"
            />
          ) : (
            <UserAvatar
              name={displayName}
              version={removeFlag ? null : avatarVersion}
              className="size-28 text-4xl"
            />
          )}
          <span className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full border-2 border-card bg-accent text-white transition-transform group-hover:scale-110">
            <Camera className="size-4" />
          </span>
        </button>

        <p className="mt-4 max-w-full truncate text-lg font-semibold">
          {displayName}
        </p>
        <p className="max-w-full truncate text-sm text-muted">{email}</p>

        {bioValue.trim() && (
          <p className="mt-3 line-clamp-4 whitespace-pre-line break-words text-sm text-fg/80">
            {bioValue.trim()}
          </p>
        )}

        {selected.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {selected.map((id) => (
              <span
                key={id}
                className="rounded-full border border-fg/15 px-2.5 py-0.5 text-xs text-muted"
              >
                {SKILL_LABEL[id]}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-1">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-accent transition-colors hover:bg-accent/10"
          >
            {hasAvatar ? "Ganti foto" : "Unggah foto"}
          </button>
          {hasAvatar && (
            <button
              type="button"
              onClick={removeAvatar}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
            >
              <Trash2 className="size-3.5" />
              Hapus
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-muted">
          JPG, PNG, atau WebP. Otomatis dipotong persegi.
        </p>

        <p className="mt-5 w-full border-t border-line pt-4 text-xs text-muted">
          Bergabung sejak {joined}
        </p>

        {/* Tanpa atribut name: file asli tidak ikut terkirim, yang dikirim hanya hasil resize. */}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onPickFile}
          className="hidden"
        />
      </Card>

      {/* Kanan: form edit */}
      <Card className="p-6">
        <h2 className="text-base font-semibold">Detail akun</h2>

        <div aria-live="polite">
          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400"
            >
              {error}
            </p>
          )}
          {state.ok && !error && !dirty && (
            <p
              role="status"
              className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-sm text-emerald-400"
            >
              {state.message}
            </p>
          )}
        </div>

        <div className="mt-5 space-y-5">
          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <label htmlFor="name" className="text-sm font-medium">
                Nama lengkap
              </label>
              <span className="text-xs tabular-nums text-muted">
                {nameValue.length}/50
              </span>
            </div>
            <input
              id="name"
              name="name"
              required
              minLength={2}
              maxLength={50}
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              autoComplete="name"
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
              Email
            </label>
            <div className="relative">
              <input
                id="email"
                value={email}
                disabled
                readOnly
                className={`${inputCls} pr-10`}
              />
              <Lock className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
            </div>
            <p className="mt-1.5 text-xs text-muted">
              Email dipakai untuk login dan tidak bisa diubah.
            </p>
          </div>

          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <label htmlFor="bio" className="text-sm font-medium">
                Bio
              </label>
              <span className="text-xs tabular-nums text-muted">
                {bioValue.length}/{BIO_MAX}
              </span>
            </div>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              maxLength={BIO_MAX}
              value={bioValue}
              onChange={(e) => setBioValue(e.target.value)}
              placeholder="Ceritakan singkat tentang kamu, mis. mahasiswa TKJ yang lagi belajar MikroTik."
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>

        {/* Skill */}
        <div className="mt-8 border-t border-line pt-6">
          <div className="flex items-baseline justify-between">
            <h3 className="text-base font-semibold">Skill</h3>
            <span className="text-xs tabular-nums text-muted">
              {selected.length}/{SKILLS_MAX} dipilih
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Pilih yang benar-benar kamu kuasai atau sedang dipelajari.
          </p>

          <div className="mt-4 space-y-5">
            {SKILL_GROUPS.map((group) => (
              <div key={group.id}>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                  {group.title}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.skills.map((s) => {
                    const on = selected.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        aria-pressed={on}
                        disabled={!on && atLimit}
                        onClick={() => toggleSkill(s.id)}
                        className={`rounded-full border px-3 py-1 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          on
                            ? "border-accent/50 bg-accent/15 text-accent"
                            : "border-fg/15 text-muted hover:bg-fg/5 hover:text-fg"
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {selected.map((id) => (
            <input key={id} type="hidden" name="skills" value={id} />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 border-t border-line pt-5">
          {dirty && !pending && (
            <button
              type="button"
              onClick={resetAll}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-fg/5 hover:text-fg"
            >
              Batal
            </button>
          )}
          <button
            type="submit"
            disabled={pending || !dirty}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-fg/10 disabled:text-muted disabled:hover:opacity-100"
          >
            {pending ? "Menyimpan…" : "Simpan perubahan"}
          </button>
        </div>
      </Card>
    </form>
  );
}
