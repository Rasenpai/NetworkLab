"use client";

import { useTransition } from "react";
import Swal from "sweetalert2";
import { LogOut, Trash2 } from "lucide-react";
import { deleteAccountAction, logoutAction } from "@/app/actions/account";

// Warna dialog disamakan dengan tema gelap halaman. Sesuaikan jika tokenmu berbeda.
const dialog = {
  background: "#1a1523",
  color: "#f3f0f7",
  buttonsStyling: true,
  confirmButtonColor: "#dc2626",
  cancelButtonColor: "#3a3347",
} as const;

export default function AccountActions({ email }: { email: string }) {
  const [pending, start] = useTransition();

  async function onDelete() {
    const res = await Swal.fire({
      ...dialog,
      icon: "warning",
      title: "Hapus akun permanen?",
      html:
        "Semua data kamu akan <b>dihapus selamanya</b>: progres belajar, hasil quiz, lab, dan portofolio. " +
        "Tindakan ini <b>tidak bisa dibatalkan</b>.<br/><br/>" +
        `Ketik <b>${email}</b> untuk konfirmasi.`,
      input: "text",
      inputPlaceholder: email,
      inputAttributes: { autocapitalize: "off", autocomplete: "off" },
      showCancelButton: true,
      confirmButtonText: "Hapus akun",
      cancelButtonText: "Batal",
      focusCancel: true,
      reverseButtons: true,
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      preConfirm: (value: string) => {
        if (value.trim().toLowerCase() !== email.toLowerCase()) {
          Swal.showValidationMessage("Email tidak cocok.");
          return false;
        }
        return value;
      },
    });
    if (!res.isConfirmed) return;

    start(async () => {
      // Sukses = server me-redirect ke halaman login. Kode di bawah hanya jalan kalau gagal.
      const r = await deleteAccountAction(String(res.value));
      if (r?.error)
        Swal.fire({ ...dialog, icon: "error", title: "Gagal", text: r.error });
    });
  }

  function onLogout() {
    start(async () => {
      await logoutAction();
    });
  }

  return (
    <div className="mt-6 space-y-2 border-t border-line pt-5">
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-60"
      >
        <Trash2 className="size-4" />
        Hapus akun
      </button>
    </div>
  );
}
