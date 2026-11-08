import React, { useState } from 'react';
import {
  Flame,
  Bell,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  CalendarClock,
} from 'lucide-react';
import { FiveDayReminderStatus } from '../utils/budgetMath';

interface ReminderBannerAndModalProps {
  reminderStatus: FiveDayReminderStatus;
  streakCount: number;
  projectedBalanceFormatted: string;
  onMarkAllCardsUpdatedToday: () => void;
  onSimulateOverdueSixDays: () => void;
}

export const ReminderBannerAndModal: React.FC<ReminderBannerAndModalProps> = ({
  reminderStatus,
  streakCount,
  projectedBalanceFormatted,
  onMarkAllCardsUpdatedToday,
  onSimulateOverdueSixDays,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [emailHtmlPreview, setEmailHtmlPreview] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleSendEmailReminder = async () => {
    setIsSendingEmail(true);
    setEmailStatus(null);
    try {
      const response = await fetch('/api/reminders/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: ['danielXzohar@gmail.com', 'eden@family.co.il'],
          daysSinceLastUpdate: reminderStatus.daysSinceLastUpdate,
          projectedBalanceFormatted,
          streakCount,
        }),
      });
      const data = await response.json();
      if (data.ok) {
        setEmailStatus(
          data.providerStatus === 'sent-via-resend'
            ? 'המייל נשלח בהצלחה לדניאל ולעדן דרך Resend!'
            : 'תזכורת המייל הופקה בהצלחה לדניאל ולעדן (כולל כפתור "הגיע הזמן לעדכן כרטיסים! 💳").'
        );
        setEmailHtmlPreview(data.htmlPreview || null);
      } else {
        setEmailStatus('אירעה שגיאה בהפקת תזכורת המייל.');
      }
    } catch {
      setEmailStatus('אירעה שגיאה בתקשורת עם שרת התזכורות.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleTriggerWebPush = async () => {
    if (!('Notification' in window)) {
      setPushStatus(
        'התראת PWA הופעלה בתוך האפליקציה: "הגיע הזמן לעדכן כרטיסים! 💳"'
      );
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification('התקציב של דניאל ועדן 🦉', {
        body: 'הגיע הזמן לעדכן כרטיסים! 💳 שמרו על רצף העדכונים המשפחתי שלכם.',
        icon: '/icon.svg',
      });
      setPushStatus('התראת Push נשלחה לדפדפן / למכשיר שלכם!');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification('התקציב של דניאל ועדן 🦉', {
          body: 'הגיע הזמן לעדכן כרטיסים! 💳 שמרו על רצף העדכונים המשפחתי שלכם.',
          icon: '/icon.svg',
        });
        setPushStatus('התראות Push הופעלו ונשלחה התראה חיה למכשיר!');
      } else {
        setPushStatus(
          'התראת תזכורת פנימית הופעלה: "הגיע הזמן לעדכן כרטיסים! 💳"'
        );
      }
    } catch {
      setPushStatus(
        'התראת תזכורת פנימית הופעלה: "הגיע הזמן לעדכן כרטיסים! 💳"'
      );
    }
  };

  const isOverdue = reminderStatus.isOverdue;

  return (
    <>
      <section
        aria-label="באנר מעקב עדכונים כל 5 ימים"
        data-testid="five-day-reminder-banner"
        className={`rounded-3xl border-2 border-b-6 p-5 transition-all ${
          isOverdue
            ? 'bg-[#FF4B4B] border-[#EA2B2B] text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-extrabold ${
                isOverdue
                  ? 'bg-white/20 text-white'
                  : 'bg-[#58CC02]/15 text-[#58CC02]'
              }`}
            >
              {isOverdue ? (
                <AlertCircle className="w-7 h-7" />
              ) : (
                <CheckCircle2 className="w-7 h-7" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold mb-1">
                <span
                  className={
                    isOverdue ? 'text-white/95' : 'text-[#58CC02]'
                  }
                >
                  {isOverdue
                    ? `חריגת זמן! עברו ${reminderStatus.daysSinceLastUpdate} ימים מהעדכון האחרון`
                    : 'מעקב 5 ימים תקין'}
                </span>
                <span aria-hidden="true">·</span>
                <span
                  className={isOverdue ? 'text-white/90' : 'text-slate-500'}
                >
                  עודכן לאחרונה: {reminderStatus.lastUpdateFormatted}
                </span>
                <span aria-hidden="true">·</span>
                <span
                  className={isOverdue ? 'text-white/90' : 'text-slate-500'}
                >
                  העדכון הבא: {reminderStatus.nextUpdateFormatted} (מועד קבוע:{' '}
                  {reminderStatus.nextFixedScheduleDay} לחודש)
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-extrabold">
                {isOverdue
                  ? 'עברו מעל 5 ימים! הגיע הזמן לעדכן את כרטיסי האשראי של דניאל ועדן 💳'
                  : `כל הכבוד! הכרטיסים מעודכנים (${reminderStatus.relativeBadgeText}) – העדכון הבא בעוד ${reminderStatus.daysUntilNextUpdate} ימים`}
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Streak Counter */}
            <div
              data-testid="streak-counter-badge"
              className={`inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-extrabold ${
                isOverdue
                  ? 'bg-black/20 text-white'
                  : 'bg-[#FF9600]/15 text-[#CC7800]'
              }`}
            >
              <Flame className="w-4 h-4 text-[#FF9600] fill-[#FF9600]" />
              <span className="font-num">{streakCount}</span>
              <span>רצף עדכונים</span>
            </div>

            {isOverdue ? (
              <button
                type="button"
                onClick={onMarkAllCardsUpdatedToday}
                className="rounded-2xl bg-white text-[#EA2B2B] border-2 border-white border-b-4 px-4 py-2 text-xs font-extrabold hover:bg-slate-50 active:translate-y-1 active:border-b-0 transition-all cursor-pointer whitespace-nowrap"
              >
                עדכנו הכל עכשיו (+1 לרצף!)
              </button>
            ) : (
              <button
                type="button"
                onClick={onSimulateOverdueSixDays}
                className="rounded-2xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 border-b-4 px-3.5 py-2 text-xs font-bold text-slate-700 active:translate-y-1 active:border-b-0 transition-all cursor-pointer whitespace-nowrap"
              >
                בדיקת התראת 5+ ימים
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsModalOpen(true);
                if (!emailHtmlPreview) {
                  handleSendEmailReminder();
                }
              }}
              className={`rounded-2xl border-2 border-b-4 px-4 py-2 text-xs font-extrabold active:translate-y-1 active:border-b-0 transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
                isOverdue
                  ? 'bg-black/25 border-white/40 text-white hover:bg-black/35'
                  : 'bg-[#FF9600] border-[#CC7800] text-white hover:bg-[#e68600]'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>ערוצי התראה (מייל ו-Push)</span>
            </button>
          </div>
        </div>
      </section>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reminders-modal-title"
        >
          <div className="w-full max-w-2xl rounded-3xl bg-white border-2 border-slate-200 border-b-8 p-6 sm:p-7 shadow-xl my-8">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#FF9600]/15 text-[#FF9600] flex items-center justify-center">
                  <CalendarClock className="w-6 h-6" />
                </div>
                <div>
                  <h2
                    id="reminders-modal-title"
                    className="text-xl font-extrabold text-slate-900"
                  >
                    מודול התראות ותזכורות אוטומטי (כל 5 ימים)
                  </h2>
                  <p className="text-xs text-slate-500">
                    מופעל אוטומטית כל 5 ימים מהעדכון האחרון או בתאריכים 5, 10, 15,
                    20, 25, 30 לחודש
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="סגירת חלון התראות"
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 mb-1">
                    <Mail className="w-4 h-4 text-[#1CB0F6]" />
                    <span>1. מייל אוטומטי (Resend / SendGrid)</span>
                  </div>
                  <p className="text-xs text-slate-600 mb-3">
                    נשלח לדניאל ולעדן עם סיכום התחזית וכפתור לחיץ ישיר לעדכון
                    האשראי.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isSendingEmail}
                  onClick={handleSendEmailReminder}
                  className="w-full rounded-xl bg-[#1CB0F6] border-2 border-[#1899D6] border-b-4 py-2.5 text-xs font-extrabold text-white hover:bg-[#1899D6] active:translate-y-1 active:border-b-0 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isSendingEmail
                      ? 'שולח מייל תזכורת...'
                      : 'שליחת מייל תזכורת עכשיו'}
                  </span>
                </button>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 mb-1">
                    <Bell className="w-4 h-4 text-[#FF9600]" />
                    <span>2. התראות Push / PWA לדפדפן ולנייד</span>
                  </div>
                  <p className="text-xs text-slate-600 mb-3">
                    התראת דפדפן ומובייל חמודה שמזכירה לפתוח את האפליקציה ולהזין
                    את הסטטוס.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTriggerWebPush}
                  className="w-full rounded-xl bg-[#FF9600] border-2 border-[#CC7800] border-b-4 py-2.5 text-xs font-extrabold text-white hover:bg-[#e68600] active:translate-y-1 active:border-b-0 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>הפעלת התראת Push לבדיקה</span>
                </button>
              </div>
            </div>

            {emailStatus && (
              <div className="mb-4 rounded-2xl bg-[#58CC02]/15 border border-[#58CC02]/40 px-4 py-3 text-xs font-bold text-[#388200]">
                {emailStatus}
              </div>
            )}

            {pushStatus && (
              <div className="mb-4 rounded-2xl bg-[#1CB0F6]/15 border border-[#1CB0F6]/40 px-4 py-3 text-xs font-bold text-[#0f76a8]">
                {pushStatus}
              </div>
            )}

            {/* Visual Email Template Preview */}
            <div className="rounded-2xl border border-slate-200 bg-[#F7F7F7] p-4">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-3">
                <span>תצוגה מקדימה של המייל שנשלח לדניאל ולעדן:</span>
                <span className="font-num">Cron: 0 9 5,10,15,20,25,30 * *</span>
              </div>

              <div className="rounded-2xl bg-white border-2 border-slate-200 border-b-4 p-5 text-right">
                <div className="text-xs font-bold text-[#FF9600] mb-2">
                  🔥 רצף משפחתי: {streakCount} עדכונים בזמן!
                </div>
                <h4 className="text-base font-extrabold text-slate-900 mb-1.5">
                  היי דניאל ועדן! הגיע מועד העדכון הדו-שבועי 🦉
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  כדי שהתחזית ל-1 לחודש תישאר מדויקת ומחייכת (כרגע צפוי:{' '}
                  <strong className="font-num">{projectedBalanceFormatted}</strong>
                  ), היכנסו לעדכן את סכומי האשראי המצטברים.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onMarkAllCardsUpdatedToday();
                    setIsModalOpen(false);
                  }}
                  className="w-full sm:w-auto rounded-2xl bg-[#58CC02] border-2 border-[#46A302] border-b-4 px-6 py-3 text-sm font-extrabold text-white hover:bg-[#4eb800] active:translate-y-1 active:border-b-0 transition-all cursor-pointer"
                >
                  הגיע הזמן לעדכן כרטיסים! 💳
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
