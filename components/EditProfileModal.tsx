"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Camera, Lock, Pencil, Trash2, X } from "lucide-react";
import { type ProfileState } from "@/app/actions/profile";
import { saveProfileAction } from "@/app/actions/profile-extra";
import SkillIcon from "@/components/SkillIcon";
import SocialIcon from "@/components/SocialIcon";
import UserAvatar from "@/components/UserAvatar";
import { BIO_MAX, SKILLS_MAX, SKILL_GROUPS } from "@/lib/skills";
import { SOCIAL_PLATFORMS, normalizeSocial } from "@/lib/socials";

const inputCls =
  "w-full rounded-lg border border-fg/15 bg-fg/5 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/30 disabled:opacity-60";

type Props = {
  name: string;
  email: string;
  avatarVersion: number | null;
  bio: string;
  skills: string[];
  socials: Record<string, string>;
};

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

function EditForm({
  name,
  email,
  avatarVersion,
  bio,
  skills,
  socials,
  onClose,
}: Props & { onClose: () => void }) {
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
  const [socialValues, setSocialValues] = useState<Record<string, string>>(
    () => ({ ...socials }),
  );
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Tutup modal kalau berhasil disimpan.
  useEffect(() => {
    if (state.ok) onClose();
  }, [state, onClose]);

  // Bebaskan object URL lama saat preview berganti atau modal ditutup.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

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
      setPreview(URL.createObjectURL(resized));
    } catch {
      setLocalError("Gambar tidak bisa dibaca. Coba file lain.");
    }
  }

  function removeAvatar() {
    setBlob(null);
    setRemoveFlag(true);
    setLocalError(null);
    setPreview(null);
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

  function submit(fd: FormData) {
    if (blob) fd.set("avatar", new File([blob], "avatar", { type: blob.type }));
    else if (removeFlag) fd.set("remove_avatar", "1");
    dispatch(fd);
  }

  // Validasi sosmed di client hanya untuk umpan balik cepat; server tetap yang menentukan.
  const socialErrors: Record<string, string> = {};
  for (const p of SOCIAL_PLATFORMS) {
    const v = (socialValues[p.id] ?? "").trim();
    if (!v) continue;
    const r = normalizeSocial(p.id, v);
    if (!r.ok) socialErrors[p.id] = r.error;
  }
  const hasSocialError = Object.keys(socialErrors).length > 0;
  const socialsChanged = SOCIAL_PLATFORMS.some(
    (p) => (socialValues[p.id] ?? "").trim() !== (socials[p.id] ?? ""),
  );

  const hasAvatar = !!preview || (!removeFlag && avatarVersion !== null);
  const error = localError ?? state.error;
  const atLimit = selected.length >= SKILLS_MAX;
  const dirty =
    nameValue.trim() !== name ||
    bioValue.trim() !== bio ||
    [...selected].sort().join(",") !== [...skills].sort().join(",") ||
    socialsChanged ||
    !!blob ||
    removeFlag;

  return (
    <form action={submit} className="flex max-h-[calc(100dvh-2rem)] flex-col">
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <h2 id="edit-profile-title" className="text-base font-semibold">
          Edit profil
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="rounded-lg p-1.5 text-muted transition-colors hover:bg-fg/5 hover:text-fg"
        >
          <X className="size-5" />
        </button>
      </header>

      <div className="space-y-6 overflow-y-auto px-6 py-5">
        <div aria-live="polite">
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400"
            >
              {error}
            </p>
          )}
        </div>

        {/* Foto */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label={hasAvatar ? "Ganti foto" : "Unggah foto"}
            className="group relative shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Pratinjau avatar"
                className="size-20 rounded-full object-cover"
              />
            ) : (
              <UserAvatar
                name={nameValue.trim() || name}
                version={removeFlag ? null : avatarVersion}
                className="size-20 text-2xl"
              />
            )}
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <Camera className="size-5" />
            </span>
          </button>
          <div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-lg border border-fg/15 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-fg/5"
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
            <p className="mt-1.5 text-xs text-muted">
              JPG, PNG, atau WebP. Otomatis dipotong persegi.
            </p>
          </div>
          {/* Tanpa atribut name: file asli tidak ikut terkirim, yang dikirim hanya hasil resize. */}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onPickFile}
            className="hidden"
          />
        </div>

        {/* Nama */}
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

        {/* Email */}
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

        {/* Bio */}
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
            placeholder="Ceritakan singkat tentang kamu, mis. siswa SMK TKJ yang lagi belajar MikroTik."
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* Sosial media */}
        <div>
          <h3 className="text-sm font-medium">Sosial media</h3>
          <p className="mt-1 text-xs text-muted">
            Tempel link profil kamu. Link yang bukan milik platform bersangkutan
            akan ditolak.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {SOCIAL_PLATFORMS.map((p) => {
              const err = touched[p.id] ? socialErrors[p.id] : undefined;
              return (
                <div key={p.id}>
                  <label
                    htmlFor={`social_${p.id}`}
                    className="mb-1.5 flex items-center gap-2 text-sm font-medium"
                  >
                    <SocialIcon id={p.id} />
                    {p.label}
                  </label>
                  <input
                    id={`social_${p.id}`}
                    name={`social_${p.id}`}
                    type="text"
                    inputMode="url"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    maxLength={200}
                    value={socialValues[p.id] ?? ""}
                    onChange={(e) =>
                      setSocialValues((cur) => ({
                        ...cur,
                        [p.id]: e.target.value,
                      }))
                    }
                    onBlur={() =>
                      setTouched((cur) => ({ ...cur, [p.id]: true }))
                    }
                    placeholder={p.placeholder}
                    aria-invalid={!!err}
                    aria-describedby={err ? `social_${p.id}_err` : undefined}
                    className={`${inputCls} ${err ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/30" : ""}`}
                  />
                  {err && (
                    <p
                      id={`social_${p.id}_err`}
                      className="mt-1.5 text-xs text-red-400"
                    >
                      {err}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Skill */}
        <div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-medium">Skill</h3>
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
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          on
                            ? "border-accent/60 bg-accent/10 text-fg"
                            : "border-fg/15 text-muted hover:bg-fg/5 hover:text-fg"
                        }`}
                      >
                        <SkillIcon id={s.id} />
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
      </div>

      <footer className="flex items-center justify-end gap-2 border-t border-line px-6 py-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-fg/5 hover:text-fg"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={pending || !dirty || hasSocialError}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-fg/10 disabled:text-muted disabled:hover:opacity-100"
        >
          {pending ? "Menyimpan…" : "Simpan"}
        </button>
      </footer>
    </form>
  );
}

export default function EditProfileModal(props: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  function openModal() {
    setOpen(true);
    ref.current?.showModal();
  }
  const closeModal = () => ref.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-2 rounded-lg border border-fg/15 px-3.5 py-2 text-sm font-medium transition-colors hover:bg-fg/5 sm:self-start"
      >
        <Pencil className="size-4" />
        Edit profil
      </button>

      {/* Form hanya dipasang saat terbuka, jadi state & error selalu bersih tiap dibuka. */}
      <dialog
        ref={ref}
        aria-labelledby="edit-profile-title"
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === ref.current) closeModal(); // klik backdrop
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-2xl border border-line bg-card p-0 text-fg backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      >
        {open && <EditForm {...props} onClose={closeModal} />}
      </dialog>
    </>
  );
}
