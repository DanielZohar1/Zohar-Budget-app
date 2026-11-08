import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateFirstOfMonthForecast,
  calculateFiveDayStatus,
  isUserWhitelisted,
  DEFAULT_FIXED_ITEMS,
  DEFAULT_CREDIT_CARDS,
  DEFAULT_DIRECT_CHARGES,
  BLOCKED_OWL_MESSAGE,
} from './budgetMath';

test('Forecasting Hero Card formula matches exact specification before the 20th of the month', () => {
  // עו"ש נוכחי (18,500)
  // - אשראי מצטבר (4,250 + 3,800 + 2,150 + 1,900 = 12,100)
  // - הוצאות קבועות שנותרו החודש (יום 8 בחודש -> הלוואה ב-20 לחודש על סך 1,000 ₪ עדיין לא ירדה)
  // - חיובים ישירים נוספים (600 + 450 = 1,050)
  // + שכר (34,000)
  // - קבועות 1 לחודש (גן 3,700 + משכנתא 7,300 = 11,000)
  // צפוי: 18,500 - 12,100 - 1,000 - 1,050 + 34,000 - 11,000 = 27,350 ₪
  const result = calculateFirstOfMonthForecast({
    bankBalance: 18500,
    monthlySalary: 34000,
    creditCards: DEFAULT_CREDIT_CARDS,
    fixedItems: DEFAULT_FIXED_ITEMS,
    directCharges: DEFAULT_DIRECT_CHARGES,
    currentDayOfMonth: 8,
  });

  assert.equal(result.totalCreditCards, 12100);
  assert.equal(result.remainingFixedThisMonth, 1000);
  assert.equal(result.totalDirectCharges, 1050);
  assert.equal(result.firstOfNextMonthFixedExpenses, 11000);
  assert.equal(result.balanceBeforeFirstOfMonth, 4350);
  assert.equal(result.projectedFirstOfMonthBalance, 27350);
  assert.equal(result.status, 'safe');
});

test('Forecasting Hero Card excludes 20th-of-month loan after day 20 and flags warning/danger accurately', () => {
  // ביום 22 לחודש, ההלוואה של ה-20 לחודש כבר ירדה מהעו"ש ולכן remainingFixedThisMonth == 0
  const warningResult = calculateFirstOfMonthForecast({
    bankBalance: 2000,
    monthlySalary: 34000,
    creditCards: [{ amount: 22000 }],
    fixedItems: DEFAULT_FIXED_ITEMS,
    directCharges: [{ amount: 500 }],
    currentDayOfMonth: 22,
  });

  // 2,000 - 22,000 - 0 - 500 + 34,000 - 11,000 = 2,500 ₪ (גבולי -> warning)
  assert.equal(warningResult.remainingFixedThisMonth, 0);
  assert.equal(warningResult.projectedFirstOfMonthBalance, 2500);
  assert.equal(warningResult.status, 'warning');

  // מצב חריגה / מינוס צפוי -> danger
  const dangerResult = calculateFirstOfMonthForecast({
    bankBalance: 1000,
    monthlySalary: 34000,
    creditCards: [{ amount: 26000 }],
    fixedItems: DEFAULT_FIXED_ITEMS,
    directCharges: [{ amount: 500 }],
    currentDayOfMonth: 22,
  });
  // 1,000 - 26,000 - 0 - 500 + 34,000 - 11,000 = -2,500 ₪
  assert.equal(dangerResult.projectedFirstOfMonthBalance, -2500);
  assert.equal(dangerResult.status, 'danger');
});

test('5-day reminder logic accurately detects on-time vs overdue (>5 days)', () => {
  const now = new Date('2026-11-08T10:00:00Z');
  const todayIso = '2026-11-08T08:00:00Z';
  const freshStatus = calculateFiveDayStatus(todayIso, now);
  assert.equal(freshStatus.daysSinceLastUpdate, 0);
  assert.equal(freshStatus.isOverdue, false);
  assert.equal(freshStatus.daysUntilNextUpdate, 5);
  assert.equal(freshStatus.relativeBadgeText, 'עודכן היום');

  const sixDaysAgoIso = '2026-11-02T08:00:00Z';
  const overdueStatus = calculateFiveDayStatus(sixDaysAgoIso, now);
  assert.equal(overdueStatus.daysSinceLastUpdate, 6);
  assert.equal(overdueStatus.isOverdue, true);
  assert.equal(overdueStatus.daysUntilNextUpdate, 0);
  assert.equal(overdueStatus.relativeBadgeText, 'עודכן לפני 6 ימים');
});

test('Whitelist access control permits only Daniel and Eden and rejects strangers with owl message', () => {
  assert.equal(isUserWhitelisted('danielXzohar@gmail.com'), true);
  assert.equal(isUserWhitelisted('eden@family.co.il'), true);
  assert.equal(isUserWhitelisted('intruder@example.com'), false);
  assert.equal(isUserWhitelisted(''), false);
  assert.equal(
    BLOCKED_OWL_MESSAGE,
    'האפליקציה הזו היא של המשפחה של דניאל ועדן בלבד 🦉'
  );
});
