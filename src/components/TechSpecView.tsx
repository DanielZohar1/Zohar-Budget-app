import React from 'react';
import {
  Code2,
  Shield,
  Database,
  BellRing,
  Calculator,
  Sparkles,
} from 'lucide-react';

export const TechSpecView: React.FC = () => {
  return (
    <section
      aria-label="מפרט טכני וארכיטקטורה"
      className="space-y-6"
    >
      <div className="rounded-3xl bg-white border-2 border-slate-200 border-b-8 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-2xl bg-[#1CB0F6]/15 text-[#1CB0F6] flex items-center justify-center">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              מפרט טכני וארכיטקטורת מערכת – התקציב של דניאל ועדן
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              תיעוד הנדסי מלא של שפת העיצוב, מודל הנתונים, נוסחת החיזוי, בקרת
              הגישה ומנגנון התזכורות הדו-שבועי
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
          {/* 1. Design System */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-2.5">
            <div className="flex items-center gap-2 text-base font-extrabold text-slate-900">
              <Sparkles className="w-5 h-5 text-[#58CC02]" />
              <span>1. שפת עיצוב ו-UX (Duolingo Design System)</span>
            </div>
            <ul className="text-xs sm:text-sm text-slate-600 space-y-1.5 leading-relaxed">
              <li>
                <strong>גיאומטריה ותלת-ממד:</strong> כרטיסים עם פינות מעוגלות{' '}
                <code className="font-num bg-white px-1.5 py-0.5 rounded">
                  rounded-3xl
                </code>{' '}
                וכפתורים קופצים עם מסגרת תחתונה{' '}
                <code className="font-num bg-white px-1.5 py-0.5 rounded">
                  border-b-4 active:translate-y-1 active:border-b-0
                </code>
                .
              </li>
              <li>
                <strong>פלטת צבעים סמנטית:</strong> ירוק דואלינגו{' '}
                <code className="font-num">#58CC02</code> (בטוח / פעולה ראשית),
                כחול עמוק <code className="font-num">#1CB0F6</code> (יתרת עו״ש),
                כתום שמח <code className="font-num">#FF9600</code> (סטטוס בינוני
                / רצף), אדום רך <code className="font-num">#FF4B4B</code> (חריגה
                / איחור 5+ ימים).
              </li>
              <li>
                <strong>משחוק (Gamification):</strong> מונה רצף הזנות (Streak
                Counter) + אפקט קונפטי בעת עדכון אשראי או יתרת בנק.
              </li>
            </ul>
          </div>

          {/* 2. Security & Whitelist */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-2.5">
            <div className="flex items-center gap-2 text-base font-extrabold text-slate-900">
              <Shield className="w-5 h-5 text-[#1CB0F6]" />
              <span>2. בקרת גישה ו-Whitelist (דניאל ועדן בלבד)</span>
            </div>
            <ul className="text-xs sm:text-sm text-slate-600 space-y-1.5 leading-relaxed">
              <li>
                <strong>אימות:</strong> התחברות מהירה עם Google OAuth דרך
                Firebase Authentication.
              </li>
              <li>
                <strong>אכיפה כפולה (UI + Database Rules):</strong> רק חשבונות
                עם <code className="font-num">email_verified == true</code> של
                דניאל או עדן מורשים לקרוא או לכתוב ל-Firestore.
              </li>
              <li>
                <strong>חסימת זרים:</strong> כל משתמש אחר מקבל את מסך החסימה:{' '}
                <em>&quot;האפליקציה הזו היא של המשפחה של דניאל ועדן בלבד 🦉&quot;</em>.
              </li>
            </ul>
          </div>

          {/* 3. Mathematical Forecasting Model */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-2.5">
            <div className="flex items-center gap-2 text-base font-extrabold text-slate-900">
              <Calculator className="w-5 h-5 text-[#FF9600]" />
              <span>3. מודל מתמטי לחיזוי ה-1 לחודש הבא</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              התחזית מחושבת בזמן אמת בכל שינוי של עו״ש, כרטיס אשראי, שורה קבועה
              או חיוב ישיר:
            </p>
            <div className="rounded-xl bg-white border border-slate-200 p-3 text-xs font-bold text-slate-800">
              יתרה צפויה ב-1 לחודש = עו״ש נוכחי − סה״כ אשראי מצטבר − הוצאות
              קבועות שנותרו החודש (יום חיוב &gt; היום הנוכחי) − חיובים ישירים
              נוספים + שכר חודשי (34,000 ₪) − הוצאות קבועות של ה-1 לחודש (גן
              3,700 ₪ + משכנתא 7,300 ₪).
            </div>
          </div>

          {/* 4. 5-Day Cron & Notification Engine */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-2.5">
            <div className="flex items-center gap-2 text-base font-extrabold text-slate-900">
              <BellRing className="w-5 h-5 text-[#FF4B4B]" />
              <span>4. מנוע התראות ותזכורות (כל 5 ימים + PWA)</span>
            </div>
            <ul className="text-xs sm:text-sm text-slate-600 space-y-1.5 leading-relaxed">
              <li>
                <strong>Cron Endpoint:</strong> הנתיב{' '}
                <code className="font-num">/api/cron/check-5-days</code> בודק האם
                חלפו 5 ימים ממועד <code className="font-num">lastCreditUpdateIso</code>{' '}
                או שהתאריך הוא 5, 10, 15, 20, 25, 30 לחודש.
              </li>
              <li>
                <strong>מייל מעוצב (Resend):</strong> הנתיב{' '}
                <code className="font-num">/api/reminders/send-email</code> מפיק
                ושולח מייל RTL לדניאל ולעדן עם הכפתור{' '}
                <em>&quot;הגיע הזמן לעדכן כרטיסים! 💳&quot;</em>.
              </li>
              <li>
                <strong>PWA &amp; Web Push:</strong> כולל Service Worker,
                Web App Manifest להתקנה מלאה בנייד והתראות דפדפן.
              </li>
            </ul>
          </div>
        </div>

        {/* Database Schema Table */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="flex items-center gap-2 text-base font-extrabold text-slate-900 mb-3">
            <Database className="w-5 h-5 text-[#1CB0F6]" />
            <span>5. מבנה מסד הנתונים בזמן אמת (Firestore Collections)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 px-3 font-bold">נתיב אוסף (Collection)</th>
                  <th className="py-2.5 px-3 font-bold">ייעוד</th>
                  <th className="py-2.5 px-3 font-bold">שדות מרכזיים</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-2.5 px-3 font-num font-bold">
                    /households/&#123;householdId&#125;
                  </td>
                  <td className="py-2.5 px-3">סטטוס עו״ש, שכר ורצף עדכונים</td>
                  <td className="py-2.5 px-3 font-num">
                    bankBalance, monthlySalary, streakCount, lastCreditUpdateIso
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-num font-bold">
                    .../creditCards/&#123;cardId&#125;
                  </td>
                  <td className="py-2.5 px-3">כרטיסי אשראי ומקורות חיוב משתנים</td>
                  <td className="py-2.5 px-3 font-num">
                    name, holder, amount, color, lastUpdatedIso
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-num font-bold">
                    .../fixedItems/&#123;itemId&#125;
                  </td>
                  <td className="py-2.5 px-3">הוצאות והכנסות קבועות מהעו״ש</td>
                  <td className="py-2.5 px-3 font-num">
                    title, amount, dayOfMonth, category
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-num font-bold">
                    .../directCharges/&#123;chargeId&#125;
                  </td>
                  <td className="py-2.5 px-3">חיובים ישירים (מזומן, העברות, צ׳קים)</td>
                  <td className="py-2.5 px-3 font-num">
                    description, amount, chargeDate, chargeType
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
