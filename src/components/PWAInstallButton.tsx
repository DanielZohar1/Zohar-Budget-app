import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={async () => {
          if (isInstallable) {
            await install();
          } else {
            setShowGuide(true);
          }
        }}
        className="inline-flex items-center gap-1.5 rounded-xl bg-white border-2 border-slate-200 border-b-4 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:translate-y-1 active:border-b-0 transition-all whitespace-nowrap shrink-0 cursor-pointer"
        aria-label="התקנת אפליקציה למסך הבית"
      >
        <Download className="w-3.5 h-3.5 text-[#1CB0F6]" />
        <span>התקנת אפליקציה</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-title"
        >
          <div className="w-full max-w-md rounded-3xl bg-white border-2 border-slate-200 border-b-8 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#1CB0F6]/15 flex items-center justify-center text-[#1CB0F6]">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3
                  id="pwa-install-title"
                  className="text-lg font-extrabold text-slate-900"
                >
                  התקנת האפליקציה בנייד או במחשב
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="סגירת חלונית התקנה"
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
              {isIOS ? (
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 space-y-2">
                  <p className="font-bold text-slate-900">
                    התקנה מהירה באייפון / אייפד (Safari):
                  </p>
                  <p>1. לחצו על כפתור השיתוף (Share) בסרגל התחתון.</p>
                  <p>2. גללו ובחרו &quot;הוספה למסך הבית&quot; (Add to Home Screen).</p>
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 space-y-2">
                  <p className="font-bold text-slate-900">
                    גישה מהירה מהבית כמו אפליקציה טבעית (PWA):
                  </p>
                  <p>
                    1. בדפדפן Chrome / Edge לחצו על סמל ההתקנה בשורת הכתובת או
                    בתפריט הדפדפן (&quot;Install App&quot; / &quot;הוספה למסך הבית&quot;).
                  </p>
                  <p>
                    2. באייפון (Safari): לחצו על כפתור השיתוף ובחרו &quot;הוספה למסך
                    הבית&quot;.
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full rounded-2xl bg-[#58CC02] border-b-4 border-[#46A302] py-3 text-sm font-extrabold text-white hover:bg-[#4eb800] active:translate-y-1 active:border-b-0 transition-all cursor-pointer"
            >
              הבנתי, תודה!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
