import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

/** Taruh di Shell (sidebar / menu user). Server component, tidak perlu "use client". */
export default function LogoutButton({
  className = "",
}: {
  className?: string;
}) {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-fg/5 hover:text-fg ${className}`}
      >
        <LogOut className="size-4" />
        Keluar
      </button>
    </form>
  );
}
