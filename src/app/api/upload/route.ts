import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) {
    return NextResponse.json({ error: "لم يتم رفع ملف" }, { status: 400 });
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "حجم الملف يجب أن يكون أقل من 5 ميجابايت" }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "نوع الملف غير مدعوم. الأنواع المدعومة: JPG, PNG, GIF, WEBP, MP4, WEBM" }, { status: 400 });
  }

  // Convert to base64 data URL
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${file.type};base64,${base64}`;

  const mediaType = file.type.startsWith("image/") ? "image" : "video";

  return NextResponse.json({ url: dataUrl, mediaType });
}
