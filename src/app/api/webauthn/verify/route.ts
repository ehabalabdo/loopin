import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";

const rpID = process.env.WEBAUTHN_RP_ID || "loopin-beige.vercel.app";
const origin = process.env.WEBAUTHN_ORIGIN || `https://${rpID}`;

// GET - Generate authentication options
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const credentials = await prisma.webAuthnCredential.findMany({
    where: { userId: session.id },
  });

  if (credentials.length === 0) {
    return NextResponse.json({ error: "لم يتم تسجيل بصمة بعد" }, { status: 404 });
  }

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: credentials.map((c: { credentialId: string; transports: string | null }) => ({
      id: c.credentialId,
      transports: c.transports
        ? (c.transports.split(",") as AuthenticatorTransport[])
        : undefined,
    })),
    userVerification: "required",
  });

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

// POST - Verify authentication
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const challenge = req.cookies.get("webauthn_challenge")?.value;
  if (!challenge) {
    return NextResponse.json({ error: "انتهت صلاحية التحقق" }, { status: 400 });
  }

  const body = await req.json();

  try {
    const credential = await prisma.webAuthnCredential.findUnique({
      where: { credentialId: body.id },
    });

    if (!credential || credential.userId !== session.id) {
      return NextResponse.json({ error: "بصمة غير معروفة" }, { status: 400 });
    }

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: credential.credentialId,
        publicKey: new Uint8Array(Buffer.from(credential.publicKey, "base64")),
        counter: Number(credential.counter),
        transports: credential.transports
          ? (credential.transports.split(",") as AuthenticatorTransport[])
          : undefined,
      },
    });

    if (!verification.verified) {
      return NextResponse.json({ error: "فشل التحقق من البصمة" }, { status: 400 });
    }

    // Update counter
    await prisma.webAuthnCredential.update({
      where: { id: credential.id },
      data: { counter: BigInt(verification.authenticationInfo.newCounter) },
    });

    const response = NextResponse.json({ success: true });
    response.cookies.delete("webauthn_challenge");
    return response;
  } catch (e) {
    console.error("WebAuthn verify error:", e);
    return NextResponse.json({ error: "فشل التحقق" }, { status: 500 });
  }
}
