import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { PasswordResetToken } from "@/models/PasswordResetToken";
import { sendPasswordResetEmail } from "@/lib/email";
import { ratelimit, getClientIp } from "@/lib/ratelimit";

// 5 reset emails per 15 minutes per IP
const resetLimiter = ratelimit({ limit: 5, windowMs: 15 * 60 * 1000 });

export async function POST(req: NextRequest) {
  if (!resetLimiter(getClientIp(req))) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Espera unos minutos." },
      { status: 429 },
    );
  }
  try {
    const { email, locale = "es" } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return 200 to prevent user enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Invalidate any existing unused tokens for this user
    await PasswordResetToken.deleteMany({ userId: user._id, usedAt: null });

    // Generate a secure random token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await PasswordResetToken.create({
      userId: user._id,
      token: hashedToken,
      expiresAt,
    });

    const appUrl = process.env.BASE_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/${locale}/reset-password?token=${rawToken}`;

    await sendPasswordResetEmail({ to: user.email, resetUrl, locale });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 },
    );
  }
}
