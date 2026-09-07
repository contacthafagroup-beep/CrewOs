import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { parseBody, jsonOk, jsonErr, zEmail } from "@/lib/api";
import { authLimiter } from "@/lib/rate-limit";
import { sendEmail, shellEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const Body = z.object({ email: zEmail });

export async function POST(req: Request) {
  try {
    const ctx = { ip: req.headers.get("x-forwarded-for") ?? "local" };
    if (!authLimiter(ctx.ip)) return jsonErr(429, "Too many attempts — try again in a minute");

    const { email } = await parseBody(req, Body);
    const token = crypto.randomUUID();
    await prisma.verificationToken.create({
      data: { identifier: email.toLowerCase(), token, expires: new Date(Date.now() + 30 * 60_000) },
    });

    const origin = process.env.APP_URL || new URL(req.url).origin;
    const link = `${origin}/api/auth/verify?token=${token}`;
    const res = await sendEmail({
      to: email,
      subject: "Sign in to CrewOS",
      html: shellEmail(
        "Your sign-in link",
        "<p>Click below to sign in. The link expires in 30 minutes.</p><p>If you didn't request it, ignore this email.</p>",
        { label: "Sign in to CrewOS", url: link },
      ),
    });
    if (!res.delivered) {
      console.log(`[auth] magic link for ${email}: ${link}`);
    }
    return jsonOk({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.name === "ApiError") return jsonErr(400, e.message);
    console.error("[auth/magic-link]", e);
    return jsonErr(500, "Could not send sign-in link");
  }
}
