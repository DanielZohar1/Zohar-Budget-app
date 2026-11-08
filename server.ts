import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function buildReminderEmailHtml(params: {
  appUrl: string;
  daysSinceLastUpdate: number;
  projectedBalanceFormatted: string;
  streakCount: number;
}) {
  const { appUrl, daysSinceLastUpdate, projectedBalanceFormatted, streakCount } =
    params;

  return `<!doctype html>
<html lang="he" dir="rtl">
  <body style="margin:0;padding:24px;background-color:#F7F7F7;font-family:'Rubik',Arial,sans-serif;direction:rtl;text-align:right;color:#1E293B;">
    <div style="max-width:520px;margin:0 auto;background:#FFFFFF;border-radius:24px;border:2px solid #E2E8F0;border-bottom:6px solid #CBD5E1;padding:28px;">
      <div style="display:inline-block;background:#FFF4E5;color:#FF9600;font-weight:800;font-size:14px;padding:6px 14px;border-radius:14px;margin-bottom:16px;">
        🔥 רצף משפחתי: ${streakCount} עדכונים בזמן!
      </div>
      <h1 style="margin:0 0 12px;font-size:24px;font-weight:800;color:#1E293B;">
        היי דניאל ועדן! עברו ${daysSinceLastUpdate} ימים מהעדכון האחרון 🦉
      </h1>
      <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#475569;">
        כדי שהתחזית ל-1 לחודש תישאר מדויקת ומחייכת (כרגע צפוי: <strong>${projectedBalanceFormatted}</strong>), זה הזמן להציץ באפליקציית הבנק והאשראי ולעדכן את הסכומים המצטברים.
      </p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${appUrl}" style="display:inline-block;background-color:#58CC02;color:#FFFFFF;font-size:18px;font-weight:800;text-decoration:none;padding:16px 28px;border-radius:18px;border-bottom:5px solid #46A302;">
          הגיע הזמן לעדכן כרטיסים! 💳
        </a>
      </div>
      <p style="margin:0;font-size:13px;color:#94A3B8;text-align:center;">
        נשלח אוטומטית ממודול התזכורות המשפחתי (כל 5 ימים · 5, 10, 15, 20, 25, 30 לחודש)
      </p>
    </div>
  </body>
</html>`;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  app.post('/api/reminders/send-email', async (req, res) => {
    try {
      const {
        recipients = ['danielXzohar@gmail.com', 'eden@family.co.il'],
        daysSinceLastUpdate = 5,
        projectedBalanceFormatted = '27,350 ₪',
        streakCount = 4,
      } = req.body || {};

      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      const subject = 'הגיע הזמן לעדכן כרטיסים! 💳 – התקציב של דניאל ועדן';
      const html = buildReminderEmailHtml({
        appUrl,
        daysSinceLastUpdate: Number(daysSinceLastUpdate) || 5,
        projectedBalanceFormatted: String(projectedBalanceFormatted),
        streakCount: Number(streakCount) || 0,
      });

      const resendApiKey = process.env.RESEND_API_KEY;
      let providerStatus = 'simulated-preview';

      if (
        resendApiKey &&
        resendApiKey !== 'MY_RESEND_API_KEY' &&
        resendApiKey.startsWith('re_')
      ) {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from:
              process.env.RESEND_FROM_EMAIL ||
              'Family Budget <onboarding@resend.dev>',
            to: Array.isArray(recipients)
              ? recipients
              : ['danielXzohar@gmail.com'],
            subject,
            html,
          }),
        });

        if (response.ok) {
          providerStatus = 'sent-via-resend';
        } else {
          providerStatus = 'resend-fallback-preview';
        }
      }

      res.json({
        ok: true,
        providerStatus,
        recipients,
        subject,
        ctaLabel: 'הגיע הזמן לעדכן כרטיסים! 💳',
        sentAt: new Date().toISOString(),
        htmlPreview: html,
      });
    } catch (error) {
      console.error('Error in /api/reminders/send-email:', error);
      res.status(500).json({
        ok: false,
        error: 'שגיאה בשליחת תזכורת המייל',
      });
    }
  });

  app.get('/api/cron/check-5-days', (req, res) => {
    const lastUpdateIso =
      typeof req.query.lastUpdateIso === 'string'
        ? req.query.lastUpdateIso
        : new Date().toISOString();
    const parsed = new Date(lastUpdateIso);
    const now = new Date();
    const diffDays = Number.isNaN(parsed.getTime())
      ? 5
      : Math.floor(
          Math.max(0, now.getTime() - parsed.getTime()) / (1000 * 60 * 60 * 24)
        );
    const shouldTrigger =
      diffDays >= 5 || [5, 10, 15, 20, 25, 30].includes(now.getDate());

    res.json({
      ok: true,
      cronSchedule: '0 9 5,10,15,20,25,30 * *',
      daysSinceLastUpdate: diffDays,
      shouldTriggerReminder: shouldTrigger,
      message: shouldTrigger
        ? 'הגיע הזמן לעדכן כרטיסים! 💳'
        : 'הכרטיסים מעודכנים בזמן – הרצף נשמר!',
      checkedAt: now.toISOString(),
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Family Budget Server running on http://localhost:${PORT}`);
  });
}

startServer();
