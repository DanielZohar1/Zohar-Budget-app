export type FamilyMember = 'דניאל' | 'עדן' | 'משותף';
export type CardColor = 'blue' | 'green' | 'orange' | 'purple';
export type FixedCategory = 'expense' | 'income';
export type DirectChargeType = 'cash' | 'transfer' | 'check' | 'other';

export interface CreditCardItem {
  id: string;
  householdId: string;
  ownerId: string;
  name: string;
  holder: FamilyMember;
  amount: number;
  color: CardColor;
  lastUpdatedIso: string;
}

export interface FixedBudgetItem {
  id: string;
  householdId: string;
  ownerId: string;
  title: string;
  amount: number;
  dayOfMonth: number;
  category: FixedCategory;
}

export interface DirectChargeItem {
  id: string;
  householdId: string;
  ownerId: string;
  description: string;
  amount: number;
  chargeDate: string;
  chargeType: DirectChargeType;
}

export interface HouseholdState {
  bankBalance: number;
  monthlySalary: number;
  streakCount: number;
  lastCreditUpdateIso: string;
  lastBankUpdateIso: string;
}

export type ForecastHealthStatus = 'safe' | 'warning' | 'danger';

export interface ForecastBreakdown {
  currentBankBalance: number;
  totalCreditCards: number;
  remainingFixedThisMonth: number;
  totalDirectCharges: number;
  nextMonthSalary: number;
  firstOfNextMonthFixedExpenses: number;
  additionalFixedIncomes: number;
  balanceBeforeFirstOfMonth: number;
  projectedFirstOfMonthBalance: number;
  status: ForecastHealthStatus;
  encouragingTitle: string;
  encouragingSubtitle: string;
}

export const WHITELISTED_EMAILS = [
  'danielxzohar@gmail.com',
  'danielXzohar@gmail.com',
  'daniel@family.co.il',
  'eden@family.co.il',
  'edenzohar@gmail.com',
];

export const BLOCKED_OWL_MESSAGE =
  'האפליקציה הזו היא של המשפחה של דניאל ועדן בלבד 🦉';

/**
 * Checks whether an email or display name belongs to Daniel or Eden's whitelist.
 */
export function isUserWhitelisted(
  email?: string | null,
  customWhitelist: string[] = []
): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes('@')) return false;

  const allowedSet = new Set([
    ...WHITELISTED_EMAILS.map((e) => e.toLowerCase()),
    ...customWhitelist.map((e) => e.trim().toLowerCase()),
  ]);

  if (allowedSet.has(normalized)) return true;

  const localPart = normalized.split('@')[0];
  if (localPart.startsWith('daniel') || localPart.startsWith('eden')) {
    return true;
  }

  return false;
}

/**
 * Resolves the Hebrew family member name from an authenticated email.
 */
export function getFamilyMemberName(email?: string | null): 'דניאל' | 'עדן' {
  if (!email) return 'דניאל';
  const normalized = email.trim().toLowerCase();
  if (normalized.includes('eden')) return 'עדן';
  return 'דניאל';
}

/**
 * Calculates the exact 1st-of-next-month cashflow forecast according to the specification:
 * עו"ש נוכחי - אשראי מצטבר - הוצאות קבועות שנותרו החודש - חיובים ישירים נוספים + שכר (34,000 ₪) - קבועות 1 לחודש
 */
export function calculateFirstOfMonthForecast(params: {
  bankBalance: number;
  monthlySalary: number;
  creditCards: Pick<CreditCardItem, 'amount'>[];
  fixedItems: Pick<FixedBudgetItem, 'amount' | 'dayOfMonth' | 'category'>[];
  directCharges: Pick<DirectChargeItem, 'amount'>[];
  currentDayOfMonth: number;
}): ForecastBreakdown {
  const {
    bankBalance,
    monthlySalary,
    creditCards,
    fixedItems,
    directCharges,
    currentDayOfMonth,
  } = params;

  const safeDay = Math.min(31, Math.max(1, Math.floor(currentDayOfMonth)));

  const totalCreditCards = creditCards.reduce(
    (sum, card) => sum + (Number.isFinite(card.amount) ? card.amount : 0),
    0
  );

  // Fixed expenses remaining in the current month (scheduled strictly after currentDayOfMonth, e.g., loan on the 20th when today is before the 20th)
  const remainingFixedThisMonth = fixedItems
    .filter((item) => item.category === 'expense' && item.dayOfMonth > safeDay)
    .reduce((sum, item) => sum + item.amount, 0);

  // Fixed expenses charged on the 1st of the month (e.g., Kindergarten 3,700 + Mortgage 7,300 = 11,000)
  const firstOfNextMonthFixedExpenses = fixedItems
    .filter((item) => item.category === 'expense' && item.dayOfMonth === 1)
    .reduce((sum, item) => sum + item.amount, 0);

  // Any extra fixed income rows beyond the primary monthlySalary
  const additionalFixedIncomes = fixedItems
    .filter((item) => item.category === 'income')
    .reduce((sum, item) => sum + item.amount, 0);

  const totalDirectCharges = directCharges.reduce(
    (sum, charge) => sum + (Number.isFinite(charge.amount) ? charge.amount : 0),
    0
  );

  const balanceBeforeFirstOfMonth =
    bankBalance -
    totalCreditCards -
    remainingFixedThisMonth -
    totalDirectCharges;

  const projectedFirstOfMonthBalance =
    balanceBeforeFirstOfMonth +
    monthlySalary +
    additionalFixedIncomes -
    firstOfNextMonthFixedExpenses;

  let status: ForecastHealthStatus = 'safe';
  let encouragingTitle = 'וואו, אתם בשליטה החודש!';
  let encouragingSubtitle = 'התקציב שלכם מחייך! נכנסים ל-1 לחודש עם מרווח ביטחון מצוין.';

  if (projectedFirstOfMonthBalance < 0) {
    status = 'danger';
    encouragingTitle = 'שימו לב – צפוי מינוס ב-1 לחודש';
    encouragingSubtitle =
      'כדאי למתן הוצאות משתנות או לבדוק את החיובים הישירים כדי לחזור לפלוס.';
  } else if (projectedFirstOfMonthBalance < 4000) {
    status = 'warning';
    encouragingTitle = 'אתם במסלול חיובי, אבל קצת צפוף!';
    encouragingSubtitle =
      'התחזית חיובית אך גבולית – מעקב צמוד כל 5 ימים ישמור אתכם מעל המים.';
  }

  return {
    currentBankBalance: bankBalance,
    totalCreditCards,
    remainingFixedThisMonth,
    totalDirectCharges,
    nextMonthSalary: monthlySalary + additionalFixedIncomes,
    firstOfNextMonthFixedExpenses,
    additionalFixedIncomes,
    balanceBeforeFirstOfMonth,
    projectedFirstOfMonthBalance,
    status,
    encouragingTitle,
    encouragingSubtitle,
  };
}

/**
 * Calculates the 5-day reminder status from the last credit update timestamp.
 */
export interface FiveDayReminderStatus {
  daysSinceLastUpdate: number;
  daysUntilNextUpdate: number;
  isOverdue: boolean;
  lastUpdateFormatted: string;
  nextUpdateFormatted: string;
  nextFixedScheduleDay: number;
  relativeBadgeText: string;
}

export function calculateFiveDayStatus(
  lastUpdateIso: string,
  nowDate: Date = new Date()
): FiveDayReminderStatus {
  const parsed = new Date(lastUpdateIso);
  const validLastDate = Number.isNaN(parsed.getTime()) ? nowDate : parsed;

  const diffMs = Math.max(0, nowDate.getTime() - validLastDate.getTime());
  const daysSinceLastUpdate = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const isOverdue = daysSinceLastUpdate >= 5;
  const daysUntilNextUpdate = Math.max(0, 5 - daysSinceLastUpdate);

  const nextUpdateDate = new Date(
    validLastDate.getTime() + 5 * 24 * 60 * 60 * 1000
  );

  const formatHebrewDate = (d: Date) =>
    d.toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  let relativeBadgeText = 'עודכן היום';
  if (daysSinceLastUpdate === 1) {
    relativeBadgeText = 'עודכן אתמול';
  } else if (daysSinceLastUpdate > 1) {
    relativeBadgeText = `עודכן לפני ${daysSinceLastUpdate} ימים`;
  }

  // Fixed checkpoints: 5, 10, 15, 20, 25, 30
  const checkpoints = [5, 10, 15, 20, 25, 30];
  const currentDay = nowDate.getDate();
  const nextFixedScheduleDay =
    checkpoints.find((day) => day >= currentDay) ?? 5;

  return {
    daysSinceLastUpdate,
    daysUntilNextUpdate,
    isOverdue,
    lastUpdateFormatted: formatHebrewDate(validLastDate),
    nextUpdateFormatted: formatHebrewDate(nextUpdateDate),
    nextFixedScheduleDay,
    relativeBadgeText,
  };
}

/**
 * Formats an ILS amount cleanly with Hebrew locale and ₪ symbol.
 */
export function formatILS(amount: number): string {
  const rounded = Math.round(amount);
  const formattedAbs = Math.abs(rounded).toLocaleString('he-IL');
  if (rounded < 0) {
    return `-${formattedAbs} ₪`;
  }
  return `${formattedAbs} ₪`;
}

/**
 * Default seed data matching Section 4 of the specification.
 */
export const DEFAULT_HOUSEHOLD_ID = 'daniel-eden-family';

export const DEFAULT_HOUSEHOLD_STATE: HouseholdState = {
  bankBalance: 18500,
  monthlySalary: 34000,
  streakCount: 4,
  lastCreditUpdateIso: new Date().toISOString(),
  lastBankUpdateIso: new Date().toISOString(),
};

export const DEFAULT_FIXED_ITEMS: Omit<
  FixedBudgetItem,
  'householdId' | 'ownerId'
>[] = [
  {
    id: 'fixed-gan',
    title: 'גן',
    amount: 3700,
    dayOfMonth: 1,
    category: 'expense',
  },
  {
    id: 'fixed-mortgage',
    title: 'משכנתא',
    amount: 7300,
    dayOfMonth: 1,
    category: 'expense',
  },
  {
    id: 'fixed-loan',
    title: 'הלוואה',
    amount: 1000,
    dayOfMonth: 20,
    category: 'expense',
  },
];

export const DEFAULT_CREDIT_CARDS: Omit<
  CreditCardItem,
  'householdId' | 'ownerId' | 'lastUpdatedIso'
>[] = [
  {
    id: 'card-amex-daniel',
    name: 'אמריקן אקספרס',
    holder: 'דניאל',
    amount: 4250,
    color: 'blue',
  },
  {
    id: 'card-visa-eden',
    name: 'ויזה',
    holder: 'עדן',
    amount: 3800,
    color: 'green',
  },
  {
    id: 'card-max-daniel',
    name: 'מקס בהצדעה',
    holder: 'דניאל',
    amount: 2150,
    color: 'orange',
  },
  {
    id: 'card-max-eden',
    name: 'מקס בהצדעה',
    holder: 'עדן',
    amount: 1900,
    color: 'purple',
  },
];

export const DEFAULT_DIRECT_CHARGES: Omit<
  DirectChargeItem,
  'householdId' | 'ownerId'
>[] = [
  {
    id: 'direct-cash-1',
    description: 'משיכת מזומן שבועית',
    amount: 600,
    chargeDate: '2026-11-12',
    chargeType: 'cash',
  },
  {
    id: 'direct-bit-1',
    description: 'העברה בנקאית – חוג שחייה',
    amount: 450,
    chargeDate: '2026-11-15',
    chargeType: 'transfer',
  },
];
