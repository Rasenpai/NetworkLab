import "server-only";
import { createHmac, randomBytes, randomInt, timingSafeEqual } from "crypto";

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // tanpa I, O, 0, 1
const LENGTH = 5;
const TTL_MS = 5 * 60 * 1000;

function secret() {
  const s = process.env.CAPTCHA_SECRET;
  if (!s) throw new Error("CAPTCHA_SECRET belum di-set");
  return s;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

function renderSvg(text: string) {
  const w = 180;
  const h = 56;
  let body = `<rect width="${w}" height="${h}" fill="#1a1a24"/>`;

  for (let i = 0; i < 6; i++) {
    const hue = randomInt(200, 320);
    body += `<line x1="${randomInt(0, w)}" y1="${randomInt(0, h)}" x2="${randomInt(0, w)}" y2="${randomInt(0, h)}" stroke="hsl(${hue},40%,45%)" stroke-width="${randomInt(1, 3)}" opacity="0.7"/>`;
  }
  for (let i = 0; i < 40; i++) {
    body += `<circle cx="${randomInt(0, w)}" cy="${randomInt(0, h)}" r="${randomInt(1, 2)}" fill="hsl(${randomInt(0, 360)},40%,60%)" opacity="0.5"/>`;
  }

  const step = w / (text.length + 1);
  for (let i = 0; i < text.length; i++) {
    const x = Math.round(step * (i + 1));
    const y = randomInt(34, 44);
    const rot = randomInt(-22, 23);
    const skew = randomInt(-15, 16);
    const size = randomInt(26, 32);
    const light = randomInt(78, 92);
    body += `<text x="${x}" y="${y}" font-family="monospace" font-weight="700" font-size="${size}" fill="hsl(${randomInt(0, 360)},35%,${light}%)" text-anchor="middle" transform="rotate(${rot} ${x} ${y}) skewX(${skew})">${text[i]}</text>`;
  }

  for (let i = 0; i < 3; i++) {
    body += `<path d="M0 ${randomInt(8, h - 8)} Q ${randomInt(40, 140)} ${randomInt(0, h)} ${w} ${randomInt(8, h - 8)}" stroke="hsl(${randomInt(0, 360)},50%,65%)" stroke-width="1.5" fill="none" opacity="0.8"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
}

export function createCaptcha() {
  let text = "";
  for (let i = 0; i < LENGTH; i++) text += CHARSET[randomInt(0, CHARSET.length)];

  const exp = Date.now() + TTL_MS;
  const nonce = randomBytes(8).toString("hex");
  const payload = `${exp}.${nonce}.${text}`;
  const token = `${exp}.${nonce}.${sign(payload)}`;

  return { svg: renderSvg(text), token };
}

export function verifyCaptcha(token: unknown, answer: unknown): boolean {
  if (typeof token !== "string" || typeof answer !== "string") return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [exp, nonce, sig] = parts;

  const expNum = Number(exp);
  if (!Number.isFinite(expNum) || Date.now() > expNum) return false;

  const guess = answer.trim().toUpperCase();
  if (guess.length !== LENGTH) return false;

  const expected = sign(`${exp}.${nonce}.${guess}`);
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}