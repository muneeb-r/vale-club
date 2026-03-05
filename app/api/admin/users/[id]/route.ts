import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";
import bcrypt from "bcryptjs";

async function adminOnly(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  const user = await verifyToken(token);
  return user?.role === "admin" ? user : null;
}

// PATCH /api/admin/users/[id]
// Editable fields: name, email, role, newPassword (optional)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await adminOnly(req);
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { name, email, role, newPassword } = body as {
    name?: string;
    email?: string;
    role?: string;
    newPassword?: string;
  };

  if (!name?.trim() || !email?.trim() || !role) {
    return NextResponse.json({ error: "Nombre, email y rol son requeridos" }, { status: 400 });
  }

  if (!["admin", "business_owner", "user"].includes(role)) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  }

  await connectDB();

  // Check email uniqueness (exclude current user)
  const existing = await User.findOne({ email: email.trim().toLowerCase(), _id: { $ne: id } });
  if (existing) {
    return NextResponse.json({ error: "El email ya está en uso" }, { status: 409 });
  }

  const update: Record<string, string> = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role,
  };

  if (newPassword?.trim()) {
    if (newPassword.trim().length < 8) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 });
    }
    update.passwordHash = await bcrypt.hash(newPassword.trim(), 10);
  }

  const updated = await User.findByIdAndUpdate(id, { $set: update }, { new: true })
    .select("name email role createdAt")
    .lean();

  if (!updated) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ user: updated });
}

// DELETE /api/admin/users/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await adminOnly(req);
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;

  // Prevent self-deletion
  if (auth.userId === id) {
    return NextResponse.json({ error: "No puedes eliminar tu propia cuenta" }, { status: 400 });
  }

  await connectDB();
  const deleted = await User.findByIdAndDelete(id);
  if (!deleted) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
