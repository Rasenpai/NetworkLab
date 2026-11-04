"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { Card } from "@/components/ui";
import PersonAvatar from "@/components/PersonAvatar";
import { dayKey, formatLongDay, formatTime } from "@/lib/chat-format";

type ChatMessage = {
  id: number;
  mine: boolean;
  body: string;
  createdAt: number;
};

type Peer = { id: number; name: string; avatarVersion: number | null };

const MAX = 1000;
const POLL_VISIBLE_MS = 3000;
const POLL_HIDDEN_MS = 10000;

export default function ChatRoom({
  peer,
  initial,
}: {
  peer: Peer;
  initial: ChatMessage[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initial);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastId = useRef(initial.at(-1)?.id ?? 0);
  const stick = useRef(true); // true = pengguna sedang di dasar percakapan

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  /** Gabungkan pesan baru tanpa duplikat. */
  const merge = useCallback((incoming: ChatMessage[]) => {
    if (!incoming.length) return;
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const add = incoming.filter((m) => !seen.has(m.id));
      return add.length ? [...prev, ...add] : prev;
    });
    lastId.current = Math.max(lastId.current, ...incoming.map((m) => m.id));
  }, []);

  // Buka percakapan: langsung ke pesan terbaru.
  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  // Setiap ada pesan baru: turun ke bawah kalau pengguna memang sedang di bawah / pesan miliknya.
  const last = messages.at(-1);
  useEffect(() => {
    if (stick.current || last?.mine) scrollToBottom();
  }, [last?.id, last?.mine, scrollToBottom]);

  // Polling pesan masuk. Diperlambat saat tab tersembunyi.
  useEffect(() => {
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;

    async function tick() {
      if (!document.hidden) {
        try {
          const res = await fetch(
            `/api/chat/${peer.id}?after=${lastId.current}`,
            { cache: "no-store" },
          );
          if (res.ok) {
            const data = (await res.json()) as { messages: ChatMessage[] };
            if (!stop) merge(data.messages);
          }
        } catch {
          /* jaringan putus: coba lagi di putaran berikutnya */
        }
      }
      if (!stop)
        timer = setTimeout(
          tick,
          document.hidden ? POLL_HIDDEN_MS : POLL_VISIBLE_MS,
        );
    }

    timer = setTimeout(tick, POLL_VISIBLE_MS);
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [peer.id, merge]);

  function onScroll() {
    const el = listRef.current;
    if (el)
      stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  function autosize() {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }

  async function send() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/chat/${peer.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: ChatMessage;
        error?: string;
      };
      if (!res.ok || !data.message) {
        setError(data.error ?? "Pesan gagal terkirim. Coba lagi.");
        return;
      }
      stick.current = true;
      merge([data.message]);
      setText("");
      requestAnimationFrame(() => {
        autosize();
        inputRef.current?.focus();
      });
    } catch {
      setError("Tidak bisa terhubung. Periksa koneksi lalu coba lagi.");
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  const remaining = MAX - text.length;

  return (
    <Card className="mx-auto flex h-[calc(100dvh-7rem)] w-full max-w-3xl flex-col overflow-hidden p-0 lg:h-[calc(100dvh-8rem)]">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-line px-3 py-3 sm:px-4">
        <Link
          href="/users"
          aria-label="Kembali ke daftar user"
          className="rounded-lg p-2 text-muted outline-none transition-colors hover:bg-fg/5 hover:text-fg focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <PersonAvatar
          id={peer.id}
          name={peer.name}
          version={peer.avatarVersion}
          className="size-10 text-sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium leading-tight">{peer.name}</p>
          <Link
            href={`/users/${peer.id}`}
            className="text-xs text-muted transition-colors hover:text-accent"
          >
            Lihat profil
          </Link>
        </div>
      </div>

      {/* Pesan */}
      <div
        ref={listRef}
        onScroll={onScroll}
        role="log"
        aria-live="polite"
        aria-label={`Percakapan dengan ${peer.name}`}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4 [scrollbar-width:thin]"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <PersonAvatar
              id={peer.id}
              name={peer.name}
              version={peer.avatarVersion}
              className="size-16 text-xl"
            />
            <p className="mt-3 font-medium">{peer.name}</p>
            <p className="mt-1 text-sm text-muted">
              Belum ada pesan. Mulai percakapan dengan menyapa.
            </p>
          </div>
        ) : (
          messages.map((m, i) => {
            const prev = messages[i - 1];
            const newDay =
              !prev || dayKey(prev.createdAt) !== dayKey(m.createdAt);
            const sameSender = prev && prev.mine === m.mine && !newDay;
            return (
              <div key={m.id}>
                {newDay && (
                  <div className="my-4 flex justify-center first:mt-0">
                    <span className="rounded-full border border-line bg-fg/5 px-3 py-1 text-xs text-muted">
                      {formatLongDay(m.createdAt)}
                    </span>
                  </div>
                )}
                <div
                  className={`flex ${m.mine ? "justify-end" : "justify-start"} ${
                    sameSender ? "mt-1" : "mt-3"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                      m.mine
                        ? "rounded-br-md bg-accent text-white"
                        : "rounded-bl-md border border-line bg-fg/5"
                    }`}
                  >
                    <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">
                      {m.body}
                    </p>
                    <p
                      className={`mt-0.5 text-right text-[11px] tabular-nums ${
                        m.mine ? "text-white/70" : "text-muted"
                      }`}
                    >
                      {formatTime(m.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-line p-3 sm:p-4">
        {error && (
          <p role="alert" className="mb-2 text-sm text-red-400">
            {error}
          </p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              autosize();
            }}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={MAX}
            placeholder={`Tulis pesan untuk ${peer.name}…`}
            aria-label="Tulis pesan"
            className="max-h-36 min-h-10 w-full resize-none rounded-xl border border-line bg-fg/5 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted/60 focus:border-accent/60 focus-visible:ring-2 focus-visible:ring-accent/40"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={sending || !text.trim()}
            aria-label="Kirim pesan"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-white outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent/60 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="size-4" aria-hidden />
          </button>
        </div>
        <p className="mt-1.5 flex justify-between text-[11px] text-muted">
          <span>Enter untuk kirim, Shift + Enter untuk baris baru.</span>
          {remaining <= 200 && (
            <span className={remaining <= 0 ? "text-red-400" : ""}>
              {remaining}
            </span>
          )}
        </p>
      </div>
    </Card>
  );
}
