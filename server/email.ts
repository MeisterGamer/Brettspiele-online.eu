import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let SMTP_HOST = process.env.SMTP_HOST || '';
let SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
let SMTP_SECURE = process.env.SMTP_SECURE === 'true' || SMTP_PORT === 465;
let SMTP_USER = process.env.SMTP_USER || '';
let SMTP_PASS = process.env.SMTP_PASS || '';
let SMTP_FROM = process.env.SMTP_FROM || '"FamPlay Brettspiele" <noreply@brettspiele-online.eu>';
let APP_URL = process.env.APP_URL || 'https://brettspiele-online.eu';

let transporter: any = null;

export function configureEmail(config: {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  from?: string;
  appUrl?: string;
}) {
  if (config.host !== undefined) SMTP_HOST = config.host;
  if (config.port !== undefined) SMTP_PORT = Number(config.port);
  if (config.secure !== undefined) SMTP_SECURE = Boolean(config.secure);
  if (config.user !== undefined) SMTP_USER = config.user;
  if (config.pass !== undefined) SMTP_PASS = config.pass;
  if (config.from !== undefined) SMTP_FROM = config.from;
  if (config.appUrl !== undefined) APP_URL = config.appUrl;

  if (SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    });
    console.log(`[E-Mail] SMTP Server configured: ${SMTP_HOST}:${SMTP_PORT} (Sender: ${SMTP_FROM})`);
  } else {
    transporter = null;
  }
}

export async function testSmtpConnection(config: {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from?: string;
  toEmail: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const testTransporter = nodemailer.createTransport({
      host: config.host,
      port: Number(config.port),
      secure: Boolean(config.secure),
      auth: config.user ? { user: config.user, pass: config.pass } : undefined,
      tls: {
        rejectUnauthorized: false,
      },
    });

    await testTransporter.verify();

    const sender = config.from || '"FamPlay Brettspiele" <noreply@brettspiele-online.eu>';
    await testTransporter.sendMail({
      from: sender,
      to: config.toEmail,
      subject: '🎲 FamPlay Web-Setup: SMTP Test erfolgreich!',
      html: `
        <div style="font-family: sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 16px;">
          <h2 style="color: #f59e0b; margin-top: 0;">Herzlichen Glückwunsch!</h2>
          <p>Deine SMTP E-Mail-Server Anbindung für <strong>FamPlay Brettspiele</strong> funktioniert einwandfrei.</p>
          <p style="color: #94a3b8; font-size: 12px;">Getestet am: ${new Date().toLocaleString('de-DE')}</p>
        </div>
      `,
    });

    return { 
      success: true, 
      message: `SMTP-Verbindung erfolgreich verifiziert und Test-Mail an ${config.toEmail} gesendet!` 
    };
  } catch (err: any) {
    return { 
      success: false, 
      message: `SMTP-Fehler: ${err?.message || err}` 
    };
  }
}

if (SMTP_HOST) {
  configureEmail({ host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_SECURE, user: SMTP_USER, pass: SMTP_PASS, from: SMTP_FROM, appUrl: APP_URL });
} else {
  console.log(`[E-Mail] ℹ️ SMTP_HOST not set. E-Mails will be simulated in server logs.`);
}

export async function sendVerificationEmail(toEmail: string, username: string, token: string, code: string): Promise<boolean> {
  username = username.replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]!));
  const verifyLink = `${APP_URL}/?verifyToken=${encodeURIComponent(token)}`;

  const subject = '🎲 Bestätige deine Registrierung bei FamPlay Brettspiele';
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="de">
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; margin: 0;">
      <div style="max-width: 580px; margin: 0 auto; background-color: #1e293b; border: 1px solid #334155; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
        <div style="background: linear-gradient(135deg, #f59e0b, #ea580c, #4f46e5); padding: 28px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">🎲 FamPlay Brettspiele</h1>
          <p style="color: #fef08a; margin: 6px 0 0 0; font-size: 13px; font-weight: 700;">Dein digitaler Familientisch</p>
        </div>
        <div style="padding: 32px 28px; line-height: 1.6;">
          <h2 style="color: #ffffff; font-size: 20px; margin-top: 0;">Willkommen, ${username}!</h2>
          <p style="color: #cbd5e1; font-size: 14px;">Vielen Dank für deine Registrierung auf unserer Online-Brettspiel-Plattform. Um dein Spielerkonto zu aktivieren, nutze bitte diesen 6-stelligen Bestätigungscode:</p>
          
          <div style="background-color: #0f172a; border: 2px dashed #f59e0b; border-radius: 14px; padding: 18px; text-align: center; margin: 24px 0;">
            <span style="font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #fbbf24;">${code}</span>
          </div>

          <p style="color: #cbd5e1; font-size: 14px; text-align: center;">Oder klicke direkt auf diesen Button:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${verifyLink}" style="display: inline-block; background-color: #f59e0b; color: #020617; font-weight: 900; font-size: 14px; padding: 12px 28px; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
              Konto jetzt aktivieren
            </a>
          </div>

          <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; border-top: 1px solid #334155; padding-top: 16px;">
            Falls du diese Registrierung nicht selbst durchgeführt hast, kannst du diese E-Mail einfach ignorieren.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: SMTP_FROM,
        to: toEmail,
        subject,
        html: htmlContent,
      });
      console.log('[E-Mail] Bestätigungs-E-Mail versendet.');
      return true;
    } catch (error: any) {
      console.error(`[E-Mail] ❌ Failed to send via SMTP:`, error?.message || error);
    }
  }

  if (process.env.NODE_ENV === 'production') return false;
  // Fallback logging for local / unconfigured SMTP
  console.log(`[E-Mail Simulation] Bestätigungscode für ${toEmail} (${username}):`);
  console.log(`>> CODE: [ ${code} ] | LINK: ${verifyLink}`);
  return true;
}

export async function sendPasswordResetEmail(toEmail: string, username: string, token: string): Promise<boolean> {
  username = username.replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]!));
  const resetLink = `${APP_URL}/?resetToken=${encodeURIComponent(token)}`;

  const subject = '🔒 Passwort zurücksetzen für FamPlay Brettspiele';
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="de">
    <body style="font-family: sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px;">
      <div style="max-width: 540px; margin: 0 auto; background-color: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 28px;">
        <h2 style="color: #f59e0b; margin-top: 0;">Passwort zurücksetzen</h2>
        <p style="color: #cbd5e1; font-size: 14px;">Hallo ${username}, du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${resetLink}" style="background-color: #f59e0b; color: #020617; font-weight: bold; font-size: 14px; padding: 12px 24px; border-radius: 10px; text-decoration: none;">
            Neues Passwort vergeben
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 12px;">Der Link ist 1 Stunde lang gültig.</p>
      </div>
    </body>
    </html>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: SMTP_FROM,
        to: toEmail,
        subject,
        html: htmlContent,
      });
      return true;
    } catch (err: any) {
      console.error(`[E-Mail] Failed to send password reset:`, err?.message || err);
    }
  }

  if (process.env.NODE_ENV === 'production') return false;
  console.log(`[E-Mail Simulation] Password reset link for ${toEmail}: ${resetLink}`);
  return true;
}

export async function sendTestEmail(toEmail: string): Promise<{ success: boolean; message: string }> {
  const subject = '🎲 FamPlay E-Mail Server Test';
  const htmlContent = `
    <div style="font-family: sans-serif; background-color: #0f172a; color: #f8fafc; padding: 20px;">
      <h2 style="color: #f59e0b;">SMTP Test erfolgreich!</h2>
      <p>Deine E-Mail-Server Anbindung für FamPlay Brettspiele funktioniert einwandfrei.</p>
      <p style="color: #94a3b8; font-size: 12px;">Zeitstempel: ${new Date().toISOString()}</p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: SMTP_FROM,
        to: toEmail,
        subject,
        html: htmlContent,
      });
      return { success: true, message: `Test-E-Mail erfolgreich via SMTP an ${toEmail} gesendet!` };
    } catch (err: any) {
      return { success: false, message: `SMTP-Fehler: ${err?.message || err}` };
    }
  }

  return { success: false, message: 'SMTP_HOST ist in .env nicht konfiguriert. Der Server befindet sich im Simulationsmodus.' };
}

export function getEmailServiceStatus() {
  return {
    configured: Boolean(transporter && SMTP_HOST),
    host: SMTP_HOST || 'Nicht konfiguriert (Simulationsmodus aktiv)',
    port: SMTP_PORT,
    sender: SMTP_FROM,
  };
}
