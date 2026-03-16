import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    await resend.emails.send({
      from: "Loopin <onboarding@resend.dev>",
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("Failed to send email:", error);
  }
}

export async function sendNotificationEmail(
  email: string,
  title: string,
  message: string
) {
  await sendEmail({
    to: email,
    subject: `Loopin - ${title}`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #181719; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: #9ddad0; margin: 0;">Loopin</h1>
        </div>
        <div style="background: #f2f2f1; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #181719; margin-top: 0;">${title}</h2>
          <p style="color: #333; line-height: 1.8;">${message}</p>
        </div>
      </div>
    `,
  });
}
