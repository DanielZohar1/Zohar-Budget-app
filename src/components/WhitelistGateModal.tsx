import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  LogIn,
  LogOut,
  Users,
  X,
  Lock,
} from 'lucide-react';
import {
  BLOCKED_OWL_MESSAGE,
  WHITELISTED_EMAILS,
  isUserWhitelisted,
} from '../utils/budgetMath';

interface WhitelistGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMember: 'דניאל' | 'עדן';
  onSwitchMember: (member: 'דניאל' | 'עדן') => void;
  firebaseEmail: string | null;
  isAuthorizedUser: boolean;
  onGoogleLogin: () => Promise<void>;
  onLogout: () => Promise<void>;
  isSimulatedIntruder: boolean;
  onToggleSimulatedIntruder: (val: boolean) => void;
}

export const BlockedOwlScreen: React.FC<{
  attemptedEmail?: string | null;
  onReturnToFamily: () => void;
  onGoogleLogin: () => Promise<void>;
}> = ({ attemptedEmail, onReturnToFamily, onGoogleLogin }) => {
  return (
    <div
      data-testid="blocked-owl-screen"
      className="min-h-[75vh] flex items-center justify-center p-4"
    >
      <div className="w-full max-w-lg rounded-3xl bg-white border-2 border-[#FF4B4B] border-b-8 p-8 text-center shadow-xl">
        <div className="w-24 h-24 rounded-3xl bg-[#FF4B4B]/12 border-2 border-[#FF4B4B]/30 mx-auto mb-5 flex items-center justify-center text-5xl">
          <span role="img" aria-label="ינשוף שומר הסף">
            🦉
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3 text-balance">
          {BLOCKED_OWL_MESSAGE}
        </h1>

        <p className="text-sm sm:text-base text-slate-600 mb-6 leading-relaxed">
          {attemptedEmail ? (
            <>
              הכתובת <strong className="font-num">{attemptedEmail}</strong> אינה
              מופיעה ברשימת המורשים (Whitelist) של המשפחה. רק דניאל ועדן יכולים
              לצפות או לעדכן את תזרים המזומנים.
            </>
          ) : (
            <>
              גישה למערכת מוגבלת אך ורק לחשבונות המאומתים של דניאל ועדן ברמת
              מסד הנתונים (Firestore Security Rules).
            </>
          )}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={onReturnToFamily}
            className="w-full sm:w-auto rounded-2xl bg-[#58CC02] border-2 border-[#46A302] border-b-4 px-6 py-3 text-sm font-extrabold text-white hover:bg-[#4eb800] active:translate-y-1 active:border-b-0 transition-all cursor-pointer"
          >
            חזרה לחשבון המשפחתי של דניאל ועדן
          </button>
          <button
            type="button"
            onClick={onGoogleLogin}
            className="w-full sm:w-auto rounded-2xl bg-[#1CB0F6] border-2 border-[#1899D6] border-b-4 px-6 py-3 text-sm font-extrabold text-white hover:bg-[#1899D6] active:translate-y-1 active:border-b-0 transition-all cursor-pointer"
          >
            התחברות עם Google מורשה
          </button>
        </div>
      </div>
    </div>
  );
};

export const WhitelistGateModal: React.FC<WhitelistGateModalProps> = ({
  isOpen,
  onClose,
  currentMember,
  onSwitchMember,
  firebaseEmail,
  isAuthorizedUser,
  onGoogleLogin,
  onLogout,
  onToggleSimulatedIntruder,
}) => {
  const [testEmail, setTestEmail] = useState('guest@stranger.com');
  const [testResult, setTestResult] = useState<{
    allowed: boolean;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleCheckEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const allowed = isUserWhitelisted(testEmail);
    setTestResult({
      allowed,
      message: allowed
        ? `גישה מאושרת! הכתובת שייכת למשפחה של דניאל ועדן.`
        : BLOCKED_OWL_MESSAGE,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="whitelist-modal-title"
    >
      <div className="w-full max-w-xl rounded-3xl bg-white border-2 border-slate-200 border-b-8 p-6 sm:p-7 shadow-xl my-8">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#58CC02]/15 text-[#58CC02] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2
                id="whitelist-modal-title"
                className="text-xl font-extrabold text-slate-900"
              >
                בקרת גישה ומשתמשים מורשים (Whitelist)
              </h2>
              <p className="text-xs text-slate-500">
                גישה מוגבלת אך ורק לדניאל ולעדן באמצעות Google OAuth ו-Security
                Rules
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="סגירת חלון בקרת גישה"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Family Profile & Firebase Auth Status */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 mb-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-slate-500 block">
                סטטוס חיבור נוכחי:
              </span>
              <span className="text-sm font-extrabold text-slate-900">
                {firebaseEmail
                  ? `מחובר/ת עם Google: ${firebaseEmail}`
                  : `מצב משפחתי פעיל (${currentMember})`}
              </span>
            </div>

            {firebaseEmail ? (
              <button
                type="button"
                onClick={onLogout}
                className="rounded-xl bg-slate-200 hover:bg-slate-300 px-3.5 py-2 text-xs font-extrabold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>התנתקות</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onGoogleLogin}
                className="rounded-xl bg-[#1CB0F6] border-2 border-[#1899D6] border-b-4 px-4 py-2 text-xs font-extrabold text-white hover:bg-[#1899D6] active:translate-y-1 active:border-b-0 transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>סנכרון ענן עם Google</span>
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#1CB0F6]" />
              <span>פרופיל מעדכן נוכחי:</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSwitchMember('דניאל')}
                className={`rounded-xl px-4 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                  currentMember === 'דניאל'
                    ? 'bg-[#1CB0F6] text-white'
                    : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
                דניאל
              </button>
              <button
                type="button"
                onClick={() => onSwitchMember('עדן')}
                className={`rounded-xl px-4 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                  currentMember === 'עדן'
                    ? 'bg-[#58CC02] text-white'
                    : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
                עדן
              </button>
            </div>
          </div>
        </div>

        {/* Whitelisted Emails List */}
        <div className="mb-5">
          <h3 className="text-xs font-extrabold text-slate-600 mb-2 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#58CC02]" />
            <span>רשימת המורשים המוגדרת ב-Whitelist ובחוקי מסד הנתונים:</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-[#1CB0F6]/10 border border-[#1CB0F6]/30 px-3 py-2 font-bold text-slate-800">
              דניאל · <span className="font-num">danielXzohar@gmail.com</span>
            </div>
            <div className="rounded-xl bg-[#58CC02]/10 border border-[#58CC02]/30 px-3 py-2 font-bold text-slate-800">
              עדן · <span className="font-num">eden@family.co.il</span>
            </div>
          </div>
        </div>

        {/* Interactive Whitelist & Owl Gate Simulator */}
        <form
          onSubmit={handleCheckEmail}
          className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3"
        >
          <div className="text-xs font-extrabold text-slate-800">
            בדיקת חסימת משתמש לא מורשה (Whitelist Gate):
          </div>
          <div className="flex items-center gap-2">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              aria-label="אימייל לבדיקת הרשאת כניסה"
              className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-xs font-bold font-num text-slate-900"
              placeholder="הזינו כתובת מייל לבדיקה..."
            />
            <button
              type="submit"
              className="rounded-xl bg-slate-900 text-white px-4 py-2 text-xs font-extrabold whitespace-nowrap cursor-pointer"
            >
              בדיקת גישה
            </button>
          </div>

          {testResult && (
            <div
              className={`rounded-xl p-3 text-xs font-extrabold flex items-center gap-2 ${
                testResult.allowed
                  ? 'bg-[#58CC02]/15 text-[#388200] border border-[#58CC02]/40'
                  : 'bg-[#FF4B4B]/15 text-[#EA2B2B] border border-[#FF4B4B]/40'
              }`}
            >
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
            <span className="text-xs text-slate-600">
              רוצים לראות איך נראה מסך החסימה המלא למשתמש זר?
            </span>
            <button
              type="button"
              onClick={() => {
                onToggleSimulatedIntruder(true);
                onClose();
              }}
              className="rounded-xl bg-[#FF4B4B] border-2 border-[#EA2B2B] border-b-4 px-3.5 py-2 text-xs font-extrabold text-white hover:bg-[#e03e3e] active:translate-y-1 active:border-b-0 transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>הצגת מסך חסימה 🦉</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
