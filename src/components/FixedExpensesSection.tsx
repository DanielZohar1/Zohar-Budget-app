import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
} from 'lucide-react';
import {
  FixedBudgetItem,
  FixedCategory,
  formatILS,
} from '../utils/budgetMath';

interface FixedExpensesSectionProps {
  monthlySalary: number;
  fixedItems: FixedBudgetItem[];
  onUpdateMonthlySalary: (newSalary: number) => void;
  onAddFixedItem: (item: {
    title: string;
    amount: number;
    dayOfMonth: number;
    category: FixedCategory;
  }) => void;
  onUpdateFixedItem: (
    id: string,
    updates: {
      title: string;
      amount: number;
      dayOfMonth: number;
      category: FixedCategory;
    }
  ) => void;
  onDeleteFixedItem: (id: string) => void;
}

export const FixedExpensesSection: React.FC<FixedExpensesSectionProps> = ({
  monthlySalary,
  fixedItems,
  onUpdateMonthlySalary,
  onAddFixedItem,
  onUpdateFixedItem,
  onDeleteFixedItem,
}) => {
  const [salaryDraft, setSalaryDraft] = useState(String(monthlySalary));
  const [isEditingSalary, setIsEditingSalary] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDay, setEditDay] = useState('1');
  const [editCategory, setEditCategory] = useState<FixedCategory>('expense');

  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDay, setNewDay] = useState('1');
  const [newCategory, setNewCategory] = useState<FixedCategory>('expense');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setSalaryDraft(String(monthlySalary));
  }, [monthlySalary]);

  const totalFixedExpenses = fixedItems
    .filter((i) => i.category === 'expense')
    .reduce((sum, i) => sum + i.amount, 0);

  const startEdit = (item: FixedBudgetItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditAmount(String(item.amount));
    setEditDay(String(item.dayOfMonth));
    setEditCategory(item.category);
  };

  const saveEdit = (id: string) => {
    const trimmed = editTitle.trim();
    const parsedAmount = Number(editAmount);
    const parsedDay = Math.min(31, Math.max(1, Number(editDay) || 1));
    if (!trimmed || !Number.isFinite(parsedAmount) || parsedAmount < 0) return;

    onUpdateFixedItem(id, {
      title: trimmed,
      amount: parsedAmount,
      dayOfMonth: parsedDay,
      category: editCategory,
    });
    setEditingId(null);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    const parsedAmount = Number(newAmount);
    const parsedDay = Math.min(31, Math.max(1, Number(newDay) || 1));

    if (!trimmed) {
      setFormError('נא להזין שם עבור השורה הקבועה (למשל: ארנונה / צהרון).');
      return;
    }
    if (newAmount === '' || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFormError('נא להזין סכום קבוע גדול מ-0.');
      return;
    }

    setFormError(null);
    onAddFixedItem({
      title: trimmed,
      amount: parsedAmount,
      dayOfMonth: parsedDay,
      category: newCategory,
    });
    setNewTitle('');
    setNewAmount('');
    setNewDay('1');
  };

  return (
    <section
      aria-labelledby="fixed-items-heading"
      className="rounded-3xl bg-white border-2 border-slate-200 border-b-6 p-6 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#58CC02]/15 text-[#58CC02] flex items-center justify-center shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="fixed-items-heading"
                className="text-lg sm:text-xl font-extrabold text-slate-900"
              >
                הכנסות והוצאות קבועות מהעו״ש
              </h2>
              <p className="text-xs text-slate-500">
                שכר חודשי ב-1 לחודש והוראות קבע (גן, משכנתא, הלוואה)
              </p>
            </div>
          </div>

          <div className="text-left shrink-0">
            <span className="text-[11px] font-bold text-slate-400 block">
              סה״כ קבועות
            </span>
            <span
              data-testid="total-fixed-expenses-amount"
              className="text-lg font-extrabold font-num text-slate-900"
            >
              {formatILS(totalFixedExpenses)}
            </span>
          </div>
        </div>

        {/* Fixed Monthly Salary Row */}
        <div className="rounded-2xl bg-[#58CC02]/10 border border-[#58CC02]/30 p-3.5 mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-extrabold text-slate-900">
              שכר חודשי (דניאל ועדן)
            </div>
            <div className="text-xs text-slate-600">
              הכנסה קבועה · מתוזמן לכניסה בכל 1 לחודש
            </div>
          </div>

          {isEditingSalary ? (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={salaryDraft}
                onChange={(e) => setSalaryDraft(e.target.value)}
                aria-label="עריכת שכר חודשי"
                className="w-28 rounded-xl border-2 border-[#58CC02] bg-white px-2.5 py-1.5 text-xs font-extrabold font-num text-slate-900"
              />
              <button
                type="button"
                onClick={() => {
                  const parsed = Number(salaryDraft);
                  if (Number.isFinite(parsed) && parsed >= 0) {
                    onUpdateMonthlySalary(parsed);
                  }
                  setIsEditingSalary(false);
                }}
                aria-label="שמירת שכר חודשי"
                className="w-8 h-8 rounded-xl bg-[#58CC02] text-white flex items-center justify-center cursor-pointer"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSalaryDraft(String(monthlySalary));
                  setIsEditingSalary(false);
                }}
                aria-label="ביטול עריכת שכר"
                className="w-8 h-8 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span dir="ltr" className="text-base font-extrabold font-num text-[#388200] whitespace-nowrap">
                +{formatILS(monthlySalary)}
              </span>
              <button
                type="button"
                onClick={() => setIsEditingSalary(true)}
                aria-label="עריכת סכום שכר חודשי"
                className="w-8 h-8 rounded-xl bg-white/80 hover:bg-white text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Fixed Items List */}
        <div className="divide-y divide-slate-100 mb-5">
          {fixedItems.map((item) => {
            const isEditing = editingId === item.id;
            return (
              <div
                key={item.id}
                className="py-3 flex items-center justify-between gap-2"
              >
                {isEditing ? (
                  <div className="w-full grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-2xl">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      aria-label="עריכת שם שורה קבועה"
                      className="sm:col-span-4 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold"
                    />
                    <input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      aria-label="עריכת סכום שורה קבועה"
                      className="sm:col-span-3 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold font-num"
                    />
                    <select
                      value={editDay}
                      onChange={(e) => setEditDay(e.target.value)}
                      aria-label="עריכת יום בחודש"
                      className="sm:col-span-3 rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-xs font-bold"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>
                          בכל {d} לחודש
                        </option>
                      ))}
                    </select>
                    <div className="sm:col-span-2 flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => saveEdit(item.id)}
                        aria-label={`שמירת שינויים עבור ${item.title}`}
                        className="w-8 h-8 rounded-xl bg-[#58CC02] text-white flex items-center justify-center cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        aria-label="ביטול עריכה"
                        className="w-8 h-8 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="text-sm font-extrabold text-slate-900">
                        {item.title}
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.category === 'income'
                          ? 'הכנסה קבועה'
                          : 'הוצאה קבועה מהעו״ש'}{' '}
                        · בכל <strong className="font-num">{item.dayOfMonth}</strong>{' '}
                        לחודש
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        dir="ltr"
                        className={`text-sm font-extrabold font-num whitespace-nowrap ${
                          item.category === 'income'
                            ? 'text-[#58CC02]'
                            : 'text-slate-900'
                        }`}
                      >
                        {item.category === 'income' ? '+' : '-'}
                        {formatILS(item.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        aria-label={`עריכת ${item.title}`}
                        className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteFixedItem(item.id)}
                        aria-label={`מחיקת ${item.title}`}
                        className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-[#FF4B4B]/15 text-slate-500 hover:text-[#EA2B2B] flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Add New Fixed Row Form */}
        <form
          onSubmit={handleAdd}
          className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3"
        >
          <div className="text-xs font-extrabold text-slate-700">
            הוספת שורה קבועה חדשה (הוצאה או הכנסה):
          </div>

          {formError && (
            <div className="rounded-xl bg-[#FF4B4B]/10 border border-[#FF4B4B] px-3 py-2 text-xs font-bold text-[#EA2B2B]">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label
                htmlFor="fixed-title-input"
                className="block text-[11px] font-bold text-slate-600 mb-1"
              >
                שם השורה הקבועה
              </label>
              <input
                id="fixed-title-input"
                type="text"
                maxLength={80}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="למשל: צהרון / ביטוח חיים"
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#58CC02] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="fixed-amount-input"
                className="block text-[11px] font-bold text-slate-600 mb-1"
              >
                סכום קבוע (₪)
              </label>
              <input
                id="fixed-amount-input"
                type="number"
                min="1"
                step="50"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="למשל: 1200"
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-xs font-bold font-num text-slate-900 focus:border-[#58CC02] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="fixed-day-select"
                className="block text-[11px] font-bold text-slate-600 mb-1"
              >
                יום חיוב בחודש
              </label>
              <select
                id="fixed-day-select"
                value={newDay}
                onChange={(e) => setNewDay(e.target.value)}
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#58CC02] focus:outline-none"
              >
                {[1, 2, 5, 10, 15, 20, 25, 28, 30].map((d) => (
                  <option key={d} value={d}>
                    בכל {d} לחודש
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="fixed-cat-select"
                className="block text-[11px] font-bold text-slate-600 mb-1"
              >
                סוג שורה
              </label>
              <select
                id="fixed-cat-select"
                value={newCategory}
                onChange={(e) =>
                  setNewCategory(e.target.value as FixedCategory)
                }
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#58CC02] focus:outline-none"
              >
                <option value="expense">הוצאה קבועה מהעו״ש</option>
                <option value="income">הכנסה קבועה נוספת</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-[#58CC02] border-2 border-[#46A302] border-b-4 py-2.5 text-xs font-extrabold text-white hover:bg-[#4eb800] active:translate-y-1 active:border-b-0 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>הוספת שורה קבועה</span>
          </button>
        </form>
      </div>
    </section>
  );
};
