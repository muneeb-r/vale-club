import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  const token = getTokenFromRequest(req);
  const user = token ? await verifyToken(token) : null;

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { fileName, contentType } = await req.json();

  if (!fileName || !contentType) {
    return NextResponse.json(
      { error: "Nombre de archivo y tipo requeridos" },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json(
      { error: "Tipo de archivo no permitido. Solo JPEG, PNG o WebP." },
      { status: 400 }
    );
  }

  const timestamp = Date.now();
  const ext = fileName.split(".").pop();
  const storagePath = `businesses/${user.userId}/${timestamp}.${ext}`;

  return NextResponse.json({ storagePath });
}
