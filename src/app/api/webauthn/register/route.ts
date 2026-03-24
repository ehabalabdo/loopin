import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";

const rpName = "Loopin";
const rpID = process.env.WEBAUTHN_RP_ID || "loopin-beige.vercel.app";
const origin = process.env.WEBAUTHN_ORIGIN || `https://${rpID}`;

// GET - Generate registration options
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const existingCreds = await prisma.webAuthnCredential.findMany({
    where: { userId: session.id },
  });

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: session.email,
    userDisplayName: session.name,
    attestationType: "none",
    excludeCredentials: existingCreds.map((c: { credentialId: string; transports: string | null }) => ({
      id: c.credentialId,
      transports: c.transports
        ? (c.transports.split(",") as AuthenticatorTransport[])
        : undefined,
    })),
    authenticatorSelection: {
      userVerification: "required",
      residentKey: "preferred",
    },
  });

  // Store challenge in a cookie for verification
  const response = NextResponse.json(options);
  response.cookies.set("webauthn_challenge", options.challenge, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 300,
    path: "/",
  });

  return response;
}

// POST - Verify registration
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const challenge = req.cookies.get("webauthn_challenge")?.value;
  if (!challenge) {
    return NextResponse.json({ error: "انتهت صلاحية التسجيل" }, { status: 400 });
  }

  const body = await req.json();

  try {
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: "فشل التحقق" }, { status: 400 });
    }

    const { credential } = verification.registrationInfo;

    await prisma.webAuthnCredential.create({
      data: {
        userId: session.id,
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey).toString("base64"),
        counter: BigInt(credential.counter),
        transports: body.response?.transports?.join(",") || null,
        deviceName: getDeviceName(req.headers.get("user-agent") || ""),
      },
    });

    const response = NextResponse.json({ success: true });
    response.cookies.delete("webauthn_challenge");
    return response;
  } catch (e) {
    console.error("WebAuthn register error:", e);
    return NextResponse.json({ error: "فشل تسجيل البصمة" }, { status: 500 });
  }
}

function getDeviceName(ua: string): string {
  if (ua.includes("iPhone")) return "iPhone";
  if (ua.includes("iPad")) return "iPad";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac")) return "Mac";
  return "جهاز غير معروف";
}
