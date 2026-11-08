import React, { useState, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  Check,
  Sparkles,
} from 'lucide-react';
import {
  ForecastBreakdown,
  formatILS,
} from '../utils/budgetMath';

interface ForecastingHeroCardProps {
  forecast: ForecastBreakdown;
  bankBalance: number;
  lastBankUpdateFormatted: string;
  currentDayOfMonth: number;
  onUpdateBankBalance: (newBalance: number) => void;
  onChangeDayOfMonth: (day: number) => void;
}

export const ForecastingHeroCard: React.FC<ForecastingHeroCardProps> = ({
  forecast,
  bankBalance,
  lastBankUpdateFormatted,
  currentDayOfMonth,
  onUpdateBankBalance,
  onChangeDayOfMonth,
}) => {
  const [balanceInput, setBalanceInput] = useState<string>(String(bankBalance));
  const [justSavedBank, setJustSavedBank] = useState(false);

  useEffect(() => {
    setBalanceInput(String(bankBalance));
  }, [bankBalance]);

  const handleBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(balanceInput);
    if (!Number.isFinite(parsed)) return;
    onUpdateBankBalance(parsed);
    setJustSavedBank(true);
    setTimeout(() => setJustSavedBank(false), 1800);
  };

  const statusConfig = {
    safe: {
      bg: 'bg-[#58CC02]',
      borderDark: 'border-[#46A302]',
      badgeText: 'מצב פיננסי: בטוח ומחייך',
      icon: ShieldCheck,
    },
    warning: {
      bg: 'bg-[#FF9600]',
      borderDark: 'border-[#CC7800]',
      badgeText: 'מצב פיננסי: גבולי – כדאי לעקוב',
      icon: AlertTriangle,
    },
    danger: {
      bg: 'bg-[#FF4B4B]',
      borderDark: 'border-[#EA2B2B]',
      badgeText: 'מצב פיננסי: התראת חריגה / מינוס צפוי',
      icon: AlertTriangle,
    },
  }[forecast.status];

  const StatusIcon = statusConfig.icon;

  return (
    <section
      aria-label="תחזית ל-1 לחודש ויתרת עו״ש"
      className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
    >
      {/* Right Column (in RTL): The Forecasting Hero Card (7 cols) */}
      <div
        className={`lg:col-span-7 rounded-3xl ${statusConfig.bg} border-2 ${statusConfig.borderDark} border-b-8 p-6 sm:p-8 text-white flex flex-col justify-between transition-colors`}
      >
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white/95">
              <StatusIcon className="w-5 h-5 shrink-0" />
              <span>{statusConfig.badgeText}</span>
              <span aria-hidden="true">·</span>
              <span>תחזית ל-1 לחודש הבא</span>
            </div>

            {/* Day of month simulation switcher for remaining current-month fixed expenses */}
            <div className="flex items-center gap-2 bg-black/15 rounded-2xl px-3 py-1.5 text-xs font-bold">
              <Calendar className="w-4 h-4 shrink-0" />
              <label htmlFor="sim-day-select" className="whitespace-nowrap">
                יום בחודש לחישוב:
              </label>
              <select
                id="sim-day-select"
                value={currentDayOfMonth}
                onChange={(e) => onChangeDayOfMonth(Number(e.target.value))}
                className="bg-white text-slate-900 font-extrabold rounded-lg px-2 py-0.5 text-xs cursor-pointer focus:outline-none"
              >
                {[1, 5, 8, 10, 15, 19, 20, 22, 25, 30].map((d) => (
                  <option key={d} value={d}>
                    {d} לחודש {d < 20 ? '(לפני הלוואה)' : '(אחרי הלוואה)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1 text-balance">
            {forecast.encouragingTitle}
          </h1>
          <p className="text-white/90 text-sm sm:text-base font-medium mb-6">
            {forecast.encouragingSubtitle}
          </p>

          {/* Dominant Visual Focal Anchor: Projected Balance on 1st of Next Month */}
          <div className="rounded-2xl bg-black/15 p-5 mb-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <span className="text-xs sm:text-sm font-bold text-white/85 block">
                יתרה צפויה בעו״ש ב-1 לחודש הבא (אחרי שכר וקבועות 1 לחודש):
              </span>
              <span className="text-xs text-white/75">
                יתרה צפויה ערב ה-1 לחודש:{' '}
                <strong dir="ltr" className="font-num inline-block whitespace-nowrap">
                  {formatILS(forecast.balanceBeforeFirstOfMonth)}
                </strong>
              </span>
            </div>
            <div
              dir="ltr"
              data-testid="projected-balance-value"
              className="text-4xl sm:text-5xl font-extrabold font-num tracking-tight whitespace-nowrap"
            >
              {formatILS(forecast.projectedFirstOfMonthBalance)}
            </div>
          </div>
        </div>

        {/* Formula Breakdown Strip */}
        <div className="rounded-2xl bg-white/95 text-slate-900 p-4">
          <div className="text-xs font-extrabold text-slate-500 mb-3 flex flex-wrap items-center justify-between gap-1">
            <span>נוסחת החישוב המלאה בזמן אמת:</span>
            <span className="text-slate-400 font-normal">
              עו״ש − אשראי − קבועות שנותרו − ישירים + שכר − קבועות ה-1 לחודש
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-right">
            <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-600">
                1. עו״ש נוכחי
              </span>
              <span dir="ltr" className="text-xs sm:text-sm font-extrabold font-num text-[#1CB0F6] whitespace-nowrap">
                {formatILS(forecast.currentBankBalance)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-600">
                2. אשראי מצטבר
              </span>
              <span dir="ltr" className="text-xs sm:text-sm font-extrabold font-num text-[#FF4B4B] whitespace-nowrap">
                -{formatILS(forecast.totalCreditCards)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-600">
                3. קבועות החודש
              </span>
              <span dir="ltr" className="text-xs sm:text-sm font-extrabold font-num text-[#FF9600] whitespace-nowrap">
                -{formatILS(forecast.remainingFixedThisMonth)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-600">
                4. חיובים ישירים
              </span>
              <span dir="ltr" className="text-xs sm:text-sm font-extrabold font-num text-[#FF4B4B] whitespace-nowrap">
                -{formatILS(forecast.totalDirectCharges)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-600">
                5. שכר (1 לחודש)
              </span>
              <span dir="ltr" className="text-xs sm:text-sm font-extrabold font-num text-[#58CC02] whitespace-nowrap">
                +{formatILS(forecast.nextMonthSalary)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-600">
                6. קבועות (1 לחודש)
              </span>
              <span dir="ltr" className="text-xs sm:text-sm font-extrabold font-num text-[#FF4B4B] whitespace-nowrap">
                -{formatILS(forecast.firstOfNextMonthFixedExpenses)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Left Column (in RTL): Current Bank Balance Status Card (#1CB0F6) (5 cols) */}
      <div className="lg:col-span-5 rounded-3xl bg-[#1CB0F6] border-2 border-[#1899D6] border-b-8 p-6 sm:p-8 text-white flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white/95">
              <Wallet className="w-5 h-5 shrink-0" />
              <span>סטטוס עו״ש עליון</span>
            </div>
            <span className="text-xs text-white/85 font-medium">
              עודכן: {lastBankUpdateFormatted}
            </span>
          </div>

          <h2 className="text-2xl font-extrabold mb-1">
            יתרת הבנק הנוכחית שלכם
          </h2>
          <p className="text-sm text-white/90 mb-5">
            הזינו את יתרת העו״ש כפי שמופיעה כרגע באפליקציית הבנק.
          </p>

          <div
            data-testid="current-bank-balance-display"
            className="text-3xl sm:text-4xl font-extrabold font-num mb-5 bg-black/15 rounded-2xl px-4 py-3.5 flex items-center justify-between"
          >
            <span dir="ltr" className="whitespace-nowrap">{formatILS(bankBalance)}</span>
            <TrendingUp className="w-7 h-7 text-white/80 shrink-0" />
          </div>
        </div>

        <form onSubmit={handleBankSubmit} className="space-y-3">
          <div>
            <label
              htmlFor="bank-balance-input"
              className="block text-xs font-extrabold text-white/90 mb-1.5"
            >
              עדכון מהיר של יתרת העו״ש (₪):
            </label>
            <div className="flex items-center gap-2">
              <input
                id="bank-balance-input"
                type="number"
                step="50"
                value={balanceInput}
                onChange={(e) => setBalanceInput(e.target.value)}
                className="w-full rounded-2xl bg-white text-slate-900 font-extrabold font-num text-lg px-4 py-3 border-2 border-white focus:outline-none focus:ring-4 focus:ring-white/40"
                placeholder="הזינו יתרת עו״ש..."
              />
              <button
                type="submit"
                className="rounded-2xl bg-[#58CC02] border-2 border-[#46A302] border-b-4 px-5 py-3 text-base font-extrabold text-white hover:bg-[#4eb800] active:translate-y-1 active:border-b-0 transition-all whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                {justSavedBank ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>נשמר!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>עדכון עו״ש</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick adjustment buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              dir="ltr"
              onClick={() => {
                const next = bankBalance + 1000;
                setBalanceInput(String(next));
                onUpdateBankBalance(next);
              }}
              className="flex-1 rounded-xl bg-white/20 hover:bg-white/30 border-b-2 border-black/20 py-2 text-xs font-extrabold text-white active:translate-y-0.5 transition-all cursor-pointer font-num whitespace-nowrap"
            >
              +1,000 ₪
            </button>
            <button
              type="button"
              dir="ltr"
              onClick={() => {
                const next = bankBalance + 500;
                setBalanceInput(String(next));
                onUpdateBankBalance(next);
              }}
              className="flex-1 rounded-xl bg-white/20 hover:bg-white/30 border-b-2 border-black/20 py-2 text-xs font-extrabold text-white active:translate-y-0.5 transition-all cursor-pointer font-num whitespace-nowrap"
            >
              +500 ₪
            </button>
            <button
              type="button"
              dir="ltr"
              onClick={() => {
                const next = bankBalance - 500;
                setBalanceInput(String(next));
                onUpdateBankBalance(next);
              }}
              className="flex-1 rounded-xl bg-white/20 hover:bg-white/30 border-b-2 border-black/20 py-2 text-xs font-extrabold text-white active:translate-y-0.5 transition-all cursor-pointer font-num whitespace-nowrap"
            >
              -500 ₪
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};
