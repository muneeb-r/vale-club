import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Business } from "@/models/Business";
import { signToken, createCookieOptions } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { ratelimit, getClientIp } from "@/lib/ratelimit";

// 5 registrations per hour per IP
const registerLimiter = ratelimit({ limit: 5, windowMs: 60 * 60 * 1000 });

export async function POST(req: NextRequest) {
  if (!registerLimiter(getClientIp(req))) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera un momento." },
      { status: 429 }
    );
  }
  try {
    const {
      email,
      password,
      name,
      businessName,
      nrt,
      accountType = "business_owner",
    } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      );
    }

    const role = accountType === "user" ? "user" : "business_owner";

    await connectDB();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      name,
      role,
    });

    // Create a stub business profile only for business owners
    if (role === "business_owner" && businessName) {
      let slug = slugify(businessName);
      const existingSlug = await Business.findOne({ slug });
      if (existingSlug) slug = `${slug}-${Date.now()}`;

      await Business.create({
        name: businessName,
        slug,
        ownerId: user._id,
        status: "pending",
        ...(nrt ? { nrt: nrt.trim() } : {}),
      });
    }

    const token = await signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json(
      {
        user: {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          name: user.name,
        },
      },
      { status: 201 }
    );

    response.cookies.set(createCookieOptions(token));
    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
