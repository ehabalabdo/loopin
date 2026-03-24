import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const count = await prisma.webAuthnCredential.count({
    where: { userId: session.id },
  });

  return NextResponse.json({ registered: count > 0 });
}
