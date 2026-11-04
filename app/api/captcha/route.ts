import { createCaptcha } from "@/lib/captcha";

export async function GET() {
  const { svg, token } = createCaptcha();
  return Response.json(
    { svg, token },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}