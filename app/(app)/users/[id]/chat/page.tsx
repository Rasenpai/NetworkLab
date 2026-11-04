import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import ChatRoom from "@/components/ChatRoom";
import { getCurrentUser } from "@/lib/auth";
import { findUser, getMessages, markRead } from "@/lib/chat";

export const metadata: Metadata = { title: "Chat" };

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Menandai pesan terbaca memakai Date.now(), jadi halaman dirender saat request.
  await connection();

  const me = await getCurrentUser();
  if (!me) return null;

  const peerId = Number((await params).id);
  if (!Number.isInteger(peerId) || peerId < 1) notFound();
  if (peerId === me.id) redirect("/users");

  const peer = findUser(peerId);
  if (!peer) notFound();

  const initial = getMessages(me.id, peerId);
  markRead(me.id, peerId);

  return (
    <ChatRoom
      // key: pindah ke lawan bicara lain selalu memulai state yang bersih.
      key={peer.id}
      peer={{ id: peer.id, name: peer.name, avatarVersion: peer.avatarVersion }}
      initial={initial}
    />
  );
}
