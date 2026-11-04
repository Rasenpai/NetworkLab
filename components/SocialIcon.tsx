import type { CSSProperties, ComponentType } from "react";
import { Link2 } from "lucide-react";
import {
  FaFacebook,
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
  FaTelegram,
  FaTiktok,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";

type IconCmp = ComponentType<{ className?: string; style?: CSSProperties }>;

/** Tanpa color = ikut warna teks (GitHub, X, TikTok hitam/putih di tema gelap). */
const ICONS: Record<string, { icon: IconCmp; color?: string }> = {
  linkedin: { icon: FaLinkedinIn, color: "#4C9BE8" },
  github: { icon: FaGithub },
  instagram: { icon: FaInstagram, color: "#E4528A" },
  tiktok: { icon: FaTiktok },
  x: { icon: FaXTwitter },
  youtube: { icon: FaYoutube, color: "#FF3B3B" },
  facebook: { icon: FaFacebook, color: "#4C8DF6" },
  telegram: { icon: FaTelegram, color: "#2AABEE" },
};

export default function SocialIcon({
  id,
  className = "size-4",
}: {
  id: string;
  className?: string;
}) {
  const def = ICONS[id] ?? { icon: Link2 as IconCmp };
  const Icon = def.icon;
  return (
    <Icon
      className={`${className} shrink-0`}
      style={def.color ? { color: def.color } : undefined}
    />
  );
}
