"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  TriangleAlert,
  User,
} from "lucide-react";
import {
  loginAction,
  registerAction,
  type AuthState,
} from "@/app/actions/auth";
import Captcha from "@/components/Captcha";
import VerifyPending from "@/components/VerifyPending";

const inputCls =
  "w-full rounded-lg border border-fg/15 bg-fg/5 py-2.5 pl-10 pr-3.5 text-sm outline-none transition-colors placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/30 aria-[invalid=true]:border-red-500/50 autofill:shadow-[inset_0_0_0_1000px_var(--color-card)] autofill:[-webkit-text-fill-color:var(--color-fg)]";

const iconCls =
  "pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted";

const LEVELS = [
  { label: "Terlalu pendek", bar: "bg-red-500", text: "text-red-400" },
  { label: "Cukup", bar: "bg-amber-500", text: "text-amber-400" },
  { label: "Bagus", bar: "bg-lime-500", text: "text-lime-400" },
  { label: "Kuat", bar: "bg-emerald-500", text: "text-emerald-400" },
];

// Mengembalikan indeks 0-3 untuk LEVELS.
function getStrength(pw: string) {
  if (pw.length < 8) return 0;
  let level = 1;
  if (pw.length >= 12) level++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw)) level++;
  if (/[^A-Za-z0-9]/.test(pw)) level++;
  return Math.min(level, 3);
}

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const isRegister = mode === "register";
  const [state, action, pending] = useActionState<AuthState, FormData>(
    isRegister ? registerAction : loginAction,
    {},
  );
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [captchaKey, setCaptchaKey] = useState(0);

  // Saat tampilan "cek email" muncul, samakan URL dengan halaman verifikasi
  // supaya refresh membuka /verify-email yang isinya sama.
  const verifying = Boolean(state.verify);
  useEffect(() => {
    if (verifying) window.history.replaceState(null, "", "/verify-email");
  }, [verifying]);

  // Ganti captcha dan kosongkan password tiap submit.
  // FormData sudah terbaca sebelum fungsi ini dipanggil, jadi aman.
  function handleAction(formData: FormData) {
    setCaptchaKey((k) => k + 1);
    setPassword("");
    action(formData);
  }

  function checkCaps(e: React.KeyboardEvent<HTMLInputElement>) {
    setCapsOn(e.getModifierState("CapsLock"));
  }

  if (state.verify) {
    return (
      <VerifyPending
        email={state.verify.email}
        retryAfter={state.verify.retryAfter}
        notice={state.verify.notice}
        error={state.verify.error}
      />
    );
  }

  const hasError = Boolean(state.error);
  const strength = getStrength(password);
  const level = LEVELS[strength];

  return (
    <form action={handleAction} className="space-y-4" noValidate>
      <div aria-live="polite">
        {state.error && (
          <p
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{state.error}</span>
          </p>
        )}
      </div>

      {isRegister && (
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
            Nama lengkap
          </label>
          <div className="relative">
            <User className={iconCls} aria-hidden />
            <input
              id="name"
              name="name"
              autoComplete="name"
              autoFocus
              required
              defaultValue={state.fields?.name}
              placeholder="Nama kamu"
              aria-invalid={hasError}
              className={inputCls}
            />
          </div>
        </div>
      )}

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
          Email
        </label>
        <div className="relative">
          <Mail className={iconCls} aria-hidden />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus={!isRegister}
            required
            defaultValue={state.fields?.email}
            placeholder="kamu@email.com"
            aria-invalid={hasError}
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
          Password
        </label>
        <div className="relative">
          <Lock className={iconCls} aria-hidden />
          <input
            id="password"
            name="password"
            type={showPw ? "text" : "password"}
            autoComplete={isRegister ? "new-password" : "current-password"}
            required
            minLength={isRegister ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isRegister ? "Minimal 8 karakter" : "Password kamu"}
            aria-invalid={hasError}
            aria-describedby={capsOn ? "caps-warning" : undefined}
            onKeyDown={checkCaps}
            onKeyUp={checkCaps}
            onBlur={() => setCapsOn(false)}
            className={`${inputCls} pr-11`}
          />
          <button
            type="button"
            // Cegah tombol mengambil fokus dari input saat diklik.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? "Sembunyikan password" : "Tampilkan password"}
            aria-pressed={showPw}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            {showPw ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
          </button>
        </div>

        {capsOn && (
          <p
            id="caps-warning"
            className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-400"
          >
            <TriangleAlert className="size-3.5" aria-hidden />
            Caps Lock sedang aktif
          </p>
        )}

        {isRegister && password.length > 0 && (
          <div className="mt-2.5" aria-live="polite">
            <div className="flex gap-1.5" aria-hidden>
              {LEVELS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i <= strength ? level.bar : "bg-fg/10"
                  }`}
                />
              ))}
            </div>
            <p className={`mt-1.5 text-xs ${level.text}`}>
              Kekuatan password: {level.label}
            </p>
          </div>
        )}
      </div>

      <Captcha refreshKey={captchaKey} />

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {pending ? "Memproses…" : isRegister ? "Buat Akun" : "Masuk"}
      </button>

      <p className="text-center text-sm text-muted">
        {isRegister ? (
          <>
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="font-medium text-accent hover:underline"
            >
              Masuk
            </Link>
          </>
        ) : (
          <>
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="font-medium text-accent hover:underline"
            >
              Daftar gratis
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
