"use client";

import { createContext, useContext } from "react";

export type SessionUser = {
  name: string;
  email: string;
  /** Waktu avatar diubah (unix ms), null kalau belum punya avatar. */
  avatarVersion: number | null;
  /** Hari berturut-turut belajar. */
  streak: number;
  /** Level saat ini (Beginner / Intermediate / Advanced) dan persentase menuju level berikutnya. */
  level: string;
  levelPercent: number;
};

const UserContext = createContext<SessionUser | null>(null);

export function UserProvider({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  const user = useContext(UserContext);
  if (!user) throw new Error("useUser harus dipakai di dalam <UserProvider>.");
  return user;
}
