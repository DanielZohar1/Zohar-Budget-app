import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Trash2,
  Check,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  CreditCardItem,
  FamilyMember,
  CardColor,
  calculateFiveDayStatus,
  formatILS,
} from '../utils/budgetMath';

interface CreditCardsSectionProps {
  cards: CreditCardItem[];
  onUpdateCardAmount: (cardId: string, newAmount: number) => void;
  onMarkAllUpdated: () => void;
  onAddCard: (card: {
    name: string;
    holder: FamilyMember;
    amount: number;
    color: CardColor;
  }) => void;
  onDeleteCard: (cardId: string) => void;
}

const COLOR_STYLES: Record<
  CardColor,
  {
    headerBg: string;
    border: string;
    accentText: string;
    buttonBg: string;
    buttonBorder: string;
  }
> = {
  blue: {
    headerBg: 'bg-[#1CB0F6]/12',
    border: 'border-[#1CB0F6]',
    accentText: 'text-[#0c8bc7]',
    buttonBg: 'bg-[#1CB0F6] hover:bg-[#1899D6]',
    buttonBorder: 'border-[#1899D6]',
  },
  green: {
    headerBg: 'bg-[#58CC02]/12',
    border: 'border-[#58CC02]',
    accentText: 'text-[#3c8d00]',
    buttonBg: 'bg-[#58CC02] hover:bg-[#4eb800]',
    buttonBorder: 'border-[#46A302]',
  },
  orange: {
    headerBg: 'bg-[#FF9600]/12',
    border: 'border-[#FF9600]',
    accentText: 'text-[#c27200]',
    buttonBg: 'bg-[#FF9600] hover:bg-[#e68600]',
    buttonBorder: 'border-[#CC7800]',
  },
  purple: {
    headerBg: 'bg-purple-500/12',
    border: 'border-purple-500',
    accentText: 'text-purple-700',
    buttonBg: 'bg-purple-500 hover:bg-purple-600',
    buttonBorder: 'border-purple-700',
  },
};

export const CreditCardsSection: React.FC<CreditCardsSectionProps> = ({
  cards,
  onUpdateCardAmount,
  onMarkAllUpdated,
  onAddCard,
  onDeleteCard,
}) => {
  const [draftAmounts, setDraftAmounts] = useState<Record<string, string>>({});
  const [savedCardId, setSavedCardId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newName, setNewName] = useState('');
  const [newHolder, setNewHolder] = useState<FamilyMember>('דניאל');
  const [newAmount, setNewAmount] = useState('');
  const [newColor, setNewColor] = useState<CardColor>('blue');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const nextDrafts: Record<string, string> = {};
    for (const c of cards) {
      nextDrafts[c.id] = String(c.amount);
    }
    setDraftAmounts(nextDrafts);
  }, [cards]);

  const totalCredit = cards.reduce((sum, c) => sum + c.amount, 0);

  const handleCardSave = (cardId: string, e: React.FormEvent) => {
    e.preventDefault();
    const raw = draftAmounts[cardId];
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    onUpdateCardAmount(cardId, parsed);
    setSavedCardId(cardId);
    setTimeout(() => {
      setSavedCardId((prev) => (prev === cardId ? null : prev));
    }, 1600);
  };

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    const parsedAmount = Number(newAmount);
    if (!trimmed) {
      setFormError('נא להזין שם כרטיס אשראי או מקור חיוב.');
      return;
    }
    if (newAmount === '' || !Number.isFinite(parsedAmount) || parsedAmount < 0) {
      setFormError('נא להזין סכום חיוב מצטבר תקין (0 ומעלה).');
      return;
    }
    setFormError(null);
    onAddCard({
      name: trimmed,
      holder: newHolder,
      amount: parsedAmount,
      color: newColor,
    });
    setNewName('');
    setNewAmount('');
    setShowAddForm(false);
  };

  return (
    <section aria-labelledby="credit-cards-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#1CB0F6]" />
            <h2
              id="credit-cards-heading"
              className="text-xl sm:text-2xl font-extrabold text-slate-900"
            >
              הוצאות משתנות – כרטיסי אשראי ומקורות חיוב
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            סה״כ חיוב אשראי מצטבר החודש:{' '}
            <strong
              dir="ltr"
              data-testid="total-credit-cards-amount"
              className="font-num text-slate-900 font-extrabold inline-block whitespace-nowrap"
            >
              {formatILS(totalCredit)}
            </strong>{' '}
            · עדכנו כל 5 ימים כדי לשמור על הרצף!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onMarkAllUpdated}
            className="rounded-2xl bg-[#58CC02] border-2 border-[#46A302] border-b-4 px-4 py-2.5 text-xs sm:text-sm font-extrabold text-white hover:bg-[#4eb800] active:translate-y-1 active:border-b-0 transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Check className="w-4 h-4" />
            <span>סימון כל הכרטיסים כמעודכנים להיום</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="rounded-2xl bg-[#1CB0F6] border-2 border-[#1899D6] border-b-4 px-4 py-2.5 text-xs sm:text-sm font-extrabold text-white hover:bg-[#1899D6] active:translate-y-1 active:border-b-0 transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'ביטול הוספה' : 'הוספת כרטיס אשראי'}</span>
          </button>
        </div>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleCreateCard}
          className="rounded-3xl bg-white border-2 border-[#1CB0F6] border-b-6 p-5 space-y-4"
        >
          <h3 className="text-base font-extrabold text-slate-900">
            הוספת כרטיס אשראי או מקור חיוב חדש
          </h3>

          {formError && (
            <div className="rounded-xl bg-[#FF4B4B]/10 border border-[#FF4B4B] px-3 py-2 text-xs font-bold text-[#EA2B2B]">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label
                htmlFor="new-card-name"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                שם הכרטיס
              </label>
              <input
                id="new-card-name"
                type="text"
                maxLength={80}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="למשל: דיינרס / ישראכרט"
                className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 focus:border-[#1CB0F6] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="new-card-holder"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                שייך ל-
              </label>
              <select
                id="new-card-holder"
                value={newHolder}
                onChange={(e) => setNewHolder(e.target.value as FamilyMember)}
                className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 focus:border-[#1CB0F6] focus:outline-none"
              >
                <option value="דניאל">דניאל</option>
                <option value="עדן">עדן</option>
                <option value="משותף">משותף</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="new-card-amount"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                חיוב מצטבר נוכחי (₪)
              </label>
              <input
                id="new-card-amount"
                type="number"
                min="0"
                step="10"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm font-bold font-num text-slate-900 focus:border-[#1CB0F6] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="new-card-color"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                צבע כרטיסייה
              </label>
              <select
                id="new-card-color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value as CardColor)}
                className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 focus:border-[#1CB0F6] focus:outline-none"
              >
                <option value="blue">כחול עמוק</option>
                <option value="green">ירוק דואלינגו</option>
                <option value="orange">כתום שמח</option>
                <option value="purple">סגול מלכותי</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              className="rounded-2xl bg-[#58CC02] border-2 border-[#46A302] border-b-4 px-5 py-2.5 text-xs font-extrabold text-white hover:bg-[#4eb800] active:translate-y-1 active:border-b-0 transition-all cursor-pointer"
            >
              שמירת כרטיס חדש
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {cards.map((card) => {
          const style = COLOR_STYLES[card.color] || COLOR_STYLES.blue;
          const cardStatus = calculateFiveDayStatus(card.lastUpdatedIso);
          const isSaved = savedCardId === card.id;

          return (
            <div
              key={card.id}
              data-testid={`credit-card-${card.id}`}
              className={`rounded-3xl bg-white border-2 ${style.border} border-b-6 p-5 flex flex-col justify-between transition-all`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className={`rounded-2xl ${style.headerBg} px-3.5 py-2`}>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                      {card.name} – {card.holder}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mt-0.5">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span
                        className={
                          cardStatus.isOverdue
                            ? 'text-[#EA2B2B] font-extrabold'
                            : style.accentText
                        }
                      >
                        {cardStatus.relativeBadgeText}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{cardStatus.lastUpdateFormatted}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteCard(card.id)}
                    aria-label={`מחיקת כרטיס ${card.name} – ${card.holder}`}
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-[#FF4B4B]/15 text-slate-500 hover:text-[#EA2B2B] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mb-4 flex items-baseline justify-between">
                  <span className="text-xs font-bold text-slate-500">
                    חיוב מצטבר צפוי כרגע:
                  </span>
                  <span
                    dir="ltr"
                    className="text-2xl sm:text-3xl font-extrabold font-num text-slate-900 whitespace-nowrap"
                  >
                    {formatILS(card.amount)}
                  </span>
                </div>
              </div>

              <form
                onSubmit={(e) => handleCardSave(card.id, e)}
                className="space-y-2.5"
              >
                <label
                  htmlFor={`card-input-${card.id}`}
                  className="block text-xs font-bold text-slate-600"
                >
                  עדכון סכום החיוב המצטבר הצפוי (₪):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id={`card-input-${card.id}`}
                    type="number"
                    min="0"
                    step="10"
                    value={draftAmounts[card.id] ?? String(card.amount)}
                    onChange={(e) =>
                      setDraftAmounts((prev) => ({
                        ...prev,
                        [card.id]: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-3.5 py-2.5 text-base font-extrabold font-num text-slate-900 focus:border-[#1CB0F6] focus:bg-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    aria-label={`עדכון סכום עבור ${card.name} – ${card.holder}`}
                    className={`rounded-2xl ${style.buttonBg} border-2 ${style.buttonBorder} border-b-4 px-4 py-2.5 text-xs sm:text-sm font-extrabold text-white active:translate-y-1 active:border-b-0 transition-all whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1`}
                  >
                    {isSaved ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>עודכן היום!</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>עדכון</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Quick step buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    dir="ltr"
                    onClick={() => {
                      const next = card.amount + 250;
                      setDraftAmounts((prev) => ({
                        ...prev,
                        [card.id]: String(next),
                      }));
                      onUpdateCardAmount(card.id, next);
                    }}
                    className="flex-1 rounded-xl bg-slate-100 hover:bg-slate-200 py-1.5 text-xs font-bold font-num text-slate-700 cursor-pointer whitespace-nowrap"
                  >
                    +250 ₪
                  </button>
                  <button
                    type="button"
                    dir="ltr"
                    onClick={() => {
                      const next = card.amount + 100;
                      setDraftAmounts((prev) => ({
                        ...prev,
                        [card.id]: String(next),
                      }));
                      onUpdateCardAmount(card.id, next);
                    }}
                    className="flex-1 rounded-xl bg-slate-100 hover:bg-slate-200 py-1.5 text-xs font-bold font-num text-slate-700 cursor-pointer whitespace-nowrap"
                  >
                    +100 ₪
                  </button>
                  <button
                    type="button"
                    dir="ltr"
                    onClick={() => {
                      const next = Math.max(0, card.amount - 100);
                      setDraftAmounts((prev) => ({
                        ...prev,
                        [card.id]: String(next),
                      }));
                      onUpdateCardAmount(card.id, next);
                    }}
                    className="flex-1 rounded-xl bg-slate-100 hover:bg-slate-200 py-1.5 text-xs font-bold font-num text-slate-700 cursor-pointer whitespace-nowrap"
                  >
                    -100 ₪
                  </button>
                </div>
              </form>
            </div>
          );
        })}
      </div>
    </section>
  );
};
