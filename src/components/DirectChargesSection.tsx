import React, { useState } from 'react';
import {
  Banknote,
  Plus,
  Trash2,
  Calendar,
  ArrowUpLeft,
} from 'lucide-react';
import {
  DirectChargeItem,
  DirectChargeType,
  formatILS,
} from '../utils/budgetMath';

interface DirectChargesSectionProps {
  charges: DirectChargeItem[];
  onAddCharge: (charge: {
    description: string;
    amount: number;
    chargeDate: string;
    chargeType: DirectChargeType;
  }) => void;
  onDeleteCharge: (chargeId: string) => void;
}

const CHARGE_TYPE_LABELS: Record<DirectChargeType, string> = {
  cash: 'משיכת מזומן',
  transfer: 'העברה בנקאית / ביט',
  check: 'צ׳ק',
  other: 'חיוב ישיר אחר',
};

export const DirectChargesSection: React.FC<DirectChargesSectionProps> = ({
  charges,
  onAddCharge,
  onDeleteCharge,
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [chargeDate, setChargeDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [chargeType, setChargeType] = useState<DirectChargeType>('transfer');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const totalDirect = charges.reduce((sum, c) => sum + c.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = description.trim();
    const parsedAmount = Number(amount);

    if (!trimmed) {
      setErrorMsg('נא להזין תיאור לחיוב הישיר (למשל: משיכת מזומן / העברה).');
      return;
    }
    if (amount === '' || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('נא להזין סכום חיוב גדול מ-0.');
      return;
    }
    if (!chargeDate) {
      setErrorMsg('נא לבחור תאריך חיוב.');
      return;
    }

    setErrorMsg(null);
    onAddCharge({
      description: trimmed,
      amount: parsedAmount,
      chargeDate,
      chargeType,
    });
    setDescription('');
    setAmount('');
  };

  return (
    <section
      aria-labelledby="direct-charges-heading"
      className="rounded-3xl bg-white border-2 border-slate-200 border-b-6 p-6 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FF9600]/15 text-[#FF9600] flex items-center justify-center shrink-0">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="direct-charges-heading"
                className="text-lg sm:text-xl font-extrabold text-slate-900"
              >
                חיובים ישירים נוספים (מחוץ לאשראי)
              </h2>
              <p className="text-xs text-slate-500">
                משיכת מזומן, העברות בנקאיות, ביט וצ׳קים שיורדים ישירות מהעו״ש
              </p>
            </div>
          </div>

          <div className="text-left shrink-0">
            <span className="text-[11px] font-bold text-slate-400 block">
              סה״כ ישירים
            </span>
            <span
              data-testid="total-direct-charges-amount"
              className="text-lg font-extrabold font-num text-[#FF9600]"
            >
              {formatILS(totalDirect)}
            </span>
          </div>
        </div>

        {/* Add Direct Charge Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-slate-50 border border-slate-200 p-4 mb-5 space-y-3"
        >
          <div className="text-xs font-extrabold text-slate-700">
            הוספת הוצאה ישירה מהעו״ש:
          </div>

          {errorMsg && (
            <div className="rounded-xl bg-[#FF4B4B]/10 border border-[#FF4B4B] px-3 py-2 text-xs font-bold text-[#EA2B2B]">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label
                htmlFor="direct-desc-input"
                className="block text-[11px] font-bold text-slate-600 mb-1"
              >
                תיאור ההוצאה
              </label>
              <input
                id="direct-desc-input"
                type="text"
                maxLength={100}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="למשל: העברה בנקאית / מזומן"
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#FF9600] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="direct-amount-input"
                className="block text-[11px] font-bold text-slate-600 mb-1"
              >
                סכום (₪)
              </label>
              <input
                id="direct-amount-input"
                type="number"
                min="1"
                step="10"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="למשל: 450"
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-xs font-bold font-num text-slate-900 focus:border-[#FF9600] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="direct-date-input"
                className="block text-[11px] font-bold text-slate-600 mb-1"
              >
                תאריך חיוב
              </label>
              <input
                id="direct-date-input"
                type="date"
                value={chargeDate}
                onChange={(e) => setChargeDate(e.target.value)}
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-xs font-bold font-num text-slate-900 focus:border-[#FF9600] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="direct-type-select"
                className="block text-[11px] font-bold text-slate-600 mb-1"
              >
                סוג פעולה
              </label>
              <select
                id="direct-type-select"
                value={chargeType}
                onChange={(e) =>
                  setChargeType(e.target.value as DirectChargeType)
                }
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#FF9600] focus:outline-none"
              >
                <option value="transfer">העברה בנקאית / ביט</option>
                <option value="cash">משיכת מזומן</option>
                <option value="check">צ׳ק</option>
                <option value="other">אחר</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-[#FF9600] border-2 border-[#CC7800] border-b-4 py-2.5 text-xs font-extrabold text-white hover:bg-[#e68600] active:translate-y-1 active:border-b-0 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>הוספת חיוב ישיר</span>
          </button>
        </form>

        {/* Direct Charges List */}
        {charges.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
            אין חיובים ישירים נוספים החודש – כל ההוצאות עוברות דרך כרטיסי האשראי!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {charges.map((item) => (
              <div
                key={item.id}
                className="py-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <ArrowUpLeft className="w-4 h-4 text-[#FF4B4B]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-slate-900 truncate">
                      {item.description}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span>{CHARGE_TYPE_LABELS[item.chargeType]}</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 font-num">
                        <Calendar className="w-3 h-3" />
                        {item.chargeDate}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span dir="ltr" className="text-sm font-extrabold font-num text-[#FF4B4B] whitespace-nowrap">
                    -{formatILS(item.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteCharge(item.id)}
                    aria-label={`מחיקת חיוב ישיר ${item.description}`}
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-[#FF4B4B]/15 text-slate-500 hover:text-[#EA2B2B] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
