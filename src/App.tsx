import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  doc,
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  auth,
  db,
  signInWithGoogle,
  signOutUser,
  handleFirestoreError,
  OperationType,
} from './lib/firebase';
import {
  CreditCardItem,
  FixedBudgetItem,
  DirectChargeItem,
  HouseholdState,
  FamilyMember,
  CardColor,
  FixedCategory,
  DirectChargeType,
  DEFAULT_HOUSEHOLD_ID,
  DEFAULT_HOUSEHOLD_STATE,
  DEFAULT_FIXED_ITEMS,
  DEFAULT_CREDIT_CARDS,
  DEFAULT_DIRECT_CHARGES,
  calculateFirstOfMonthForecast,
  calculateFiveDayStatus,
  isUserWhitelisted,
  getFamilyMemberName,
  formatILS,
} from './utils/budgetMath';
import { ForecastingHeroCard } from './components/ForecastingHeroCard';
import { ReminderBannerAndModal } from './components/ReminderBannerAndModal';
import { CreditCardsSection } from './components/CreditCardsSection';
import { DirectChargesSection } from './components/DirectChargesSection';
import { FixedExpensesSection } from './components/FixedExpensesSection';
import {
  WhitelistGateModal,
  BlockedOwlScreen,
} from './components/WhitelistGateModal';
import { TechSpecView } from './components/TechSpecView';
import { PWAInstallButton } from './components/PWAInstallButton';

const STORAGE_KEYS = {
  household: 'duo_budget_household_v1',
  cards: 'duo_budget_cards_v1',
  fixed: 'duo_budget_fixed_v1',
  direct: 'duo_budget_direct_v1',
};

function triggerCelebrationConfetti() {
  try {
    confetti({
      particleCount: 55,
      spread: 65,
      origin: { y: 0.7 },
      colors: ['#58CC02', '#1CB0F6', '#FF9600', '#FF4B4B'],
    });
  } catch {
    // Ignore confetti errors in headless environments without canvas support
  }
}

export default function App() {
  const [activeView, setActiveView] = useState<'dashboard' | 'spec'>(
    'dashboard'
  );
  const [currentMember, setCurrentMember] = useState<'דניאל' | 'עדן'>('דניאל');
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isWhitelistModalOpen, setIsWhitelistModalOpen] = useState(false);
  const [isSimulatedIntruder, setIsSimulatedIntruder] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Current day of month used for remaining current-month fixed expenses calculation (default: 8th of month, before the 20th loan)
  const [currentDayOfMonth, setCurrentDayOfMonth] = useState<number>(8);

  const [household, setHousehold] = useState<HouseholdState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.household);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_HOUSEHOLD_STATE;
  });

  const [creditCards, setCreditCards] = useState<CreditCardItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.cards);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    const nowIso = new Date().toISOString();
    return DEFAULT_CREDIT_CARDS.map((c) => ({
      ...c,
      householdId: DEFAULT_HOUSEHOLD_ID,
      ownerId: 'local-family',
      lastUpdatedIso: nowIso,
    }));
  });

  const [fixedItems, setFixedItems] = useState<FixedBudgetItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.fixed);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_FIXED_ITEMS.map((item) => ({
      ...item,
      householdId: DEFAULT_HOUSEHOLD_ID,
      ownerId: 'local-family',
    }));
  });

  const [directCharges, setDirectCharges] = useState<DirectChargeItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.direct);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_DIRECT_CHARGES.map((item) => ({
      ...item,
      householdId: DEFAULT_HOUSEHOLD_ID,
      ownerId: 'local-family',
    }));
  });

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  // Save to localStorage for instant resilience
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.household, JSON.stringify(household));
    } catch {
      // ignore
    }
  }, [household]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.cards, JSON.stringify(creditCards));
    } catch {
      // ignore
    }
  }, [creditCards]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.fixed, JSON.stringify(fixedItems));
    } catch {
      // ignore
    }
  }, [fixedItems]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.direct, JSON.stringify(directCharges));
    } catch {
      // ignore
    }
  }, [directCharges]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setIsAuthReady(true);
      if (user?.email && isUserWhitelisted(user.email)) {
        setCurrentMember(getFamilyMemberName(user.email));
      }
    });
    return () => unsubscribe();
  }, []);

  const isAuthorizedFirebaseUser =
    !!firebaseUser &&
    firebaseUser.emailVerified &&
    isUserWhitelisted(firebaseUser.email);

  // Real-time Firestore synchronization when authenticated as Daniel or Eden
  useEffect(() => {
    if (!isAuthReady || !isAuthorizedFirebaseUser || !firebaseUser) return;

    const householdPath = `households/${DEFAULT_HOUSEHOLD_ID}`;
    const householdRef = doc(db, 'households', DEFAULT_HOUSEHOLD_ID);

    const unsubHousehold = onSnapshot(
      householdRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setHousehold({
            bankBalance: Number(data.bankBalance ?? 18500),
            monthlySalary: Number(data.monthlySalary ?? 34000),
            streakCount: Number(data.streakCount ?? 4),
            lastCreditUpdateIso: String(
              data.lastCreditUpdateIso ?? new Date().toISOString()
            ),
            lastBankUpdateIso: String(
              data.lastBankUpdateIso ?? new Date().toISOString()
            ),
          });
        } else {
          // Bootstrap initial household document in Firestore
          try {
            await setDoc(householdRef, {
              ownerId: firebaseUser.uid,
              bankBalance: household.bankBalance,
              monthlySalary: household.monthlySalary,
              streakCount: household.streakCount,
              lastCreditUpdateIso: household.lastCreditUpdateIso.slice(0, 40),
              lastBankUpdateIso: household.lastBankUpdateIso.slice(0, 40),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, householdPath);
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, householdPath);
      }
    );

    const cardsPath = `households/${DEFAULT_HOUSEHOLD_ID}/creditCards`;
    const cardsQuery = query(
      collection(db, cardsPath),
      where('householdId', '==', DEFAULT_HOUSEHOLD_ID)
    );
    const unsubCards = onSnapshot(
      cardsQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const items: CreditCardItem[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              householdId: String(data.householdId),
              ownerId: String(data.ownerId),
              name: String(data.name),
              holder: (data.holder as FamilyMember) || 'דניאל',
              amount: Number(data.amount || 0),
              color: (data.color as CardColor) || 'blue',
              lastUpdatedIso: String(
                data.lastUpdatedIso || new Date().toISOString()
              ),
            };
          });
          setCreditCards(items);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, cardsPath);
      }
    );

    const fixedPath = `households/${DEFAULT_HOUSEHOLD_ID}/fixedItems`;
    const fixedQuery = query(
      collection(db, fixedPath),
      where('householdId', '==', DEFAULT_HOUSEHOLD_ID)
    );
    const unsubFixed = onSnapshot(
      fixedQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const items: FixedBudgetItem[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              householdId: String(data.householdId),
              ownerId: String(data.ownerId),
              title: String(data.title),
              amount: Number(data.amount || 0),
              dayOfMonth: Number(data.dayOfMonth || 1),
              category: (data.category as FixedCategory) || 'expense',
            };
          });
          setFixedItems(items);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, fixedPath);
      }
    );

    const directPath = `households/${DEFAULT_HOUSEHOLD_ID}/directCharges`;
    const directQuery = query(
      collection(db, directPath),
      where('householdId', '==', DEFAULT_HOUSEHOLD_ID)
    );
    const unsubDirect = onSnapshot(
      directQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const items: DirectChargeItem[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              householdId: String(data.householdId),
              ownerId: String(data.ownerId),
              description: String(data.description),
              amount: Number(data.amount || 0),
              chargeDate: String(data.chargeDate),
              chargeType: (data.chargeType as DirectChargeType) || 'transfer',
            };
          });
          setDirectCharges(items);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, directPath);
      }
    );

    return () => {
      unsubHousehold();
      unsubCards();
      unsubFixed();
      unsubDirect();
    };
  }, [isAuthReady, isAuthorizedFirebaseUser, firebaseUser]);

  // Helper to sync household document to Firestore if authenticated
  const syncHouseholdToFirestore = async (nextState: HouseholdState) => {
    if (!isAuthorizedFirebaseUser || !firebaseUser) return;
    const path = `households/${DEFAULT_HOUSEHOLD_ID}`;
    try {
      await setDoc(
        doc(db, 'households', DEFAULT_HOUSEHOLD_ID),
        {
          ownerId: firebaseUser.uid,
          bankBalance: nextState.bankBalance,
          monthlySalary: nextState.monthlySalary,
          streakCount: nextState.streakCount,
          lastCreditUpdateIso: nextState.lastCreditUpdateIso.slice(0, 40),
          lastBankUpdateIso: nextState.lastBankUpdateIso.slice(0, 40),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  // Handlers
  const handleUpdateBankBalance = (newBalance: number) => {
    const nowIso = new Date().toISOString();
    const nextState: HouseholdState = {
      ...household,
      bankBalance: newBalance,
      lastBankUpdateIso: nowIso,
    };
    setHousehold(nextState);
    triggerCelebrationConfetti();
    showToast(`יתרת העו״ש עודכנה ל-${formatILS(newBalance)}! 🎉`);
    syncHouseholdToFirestore(nextState);
  };

  const handleUpdateMonthlySalary = (newSalary: number) => {
    const nextState: HouseholdState = {
      ...household,
      monthlySalary: newSalary,
    };
    setHousehold(nextState);
    showToast(`השכר החודשי עודכן ל-${formatILS(newSalary)}!`);
    syncHouseholdToFirestore(nextState);
  };

  const handleUpdateCardAmount = async (cardId: string, newAmount: number) => {
    const nowIso = new Date().toISOString();
    const updatedCards = creditCards.map((c) =>
      c.id === cardId ? { ...c, amount: newAmount, lastUpdatedIso: nowIso } : c
    );
    setCreditCards(updatedCards);

    const nextHousehold: HouseholdState = {
      ...household,
      streakCount: household.streakCount + 1,
      lastCreditUpdateIso: nowIso,
    };
    setHousehold(nextHousehold);
    triggerCelebrationConfetti();
    showToast('כרטיס האשראי עודכן והרצף המשפחתי עלה ב-+1! 🔥');

    if (isAuthorizedFirebaseUser && firebaseUser) {
      const targetCard = updatedCards.find((c) => c.id === cardId);
      if (targetCard) {
        const path = `households/${DEFAULT_HOUSEHOLD_ID}/creditCards/${cardId}`;
        try {
          await setDoc(
            doc(
              db,
              'households',
              DEFAULT_HOUSEHOLD_ID,
              'creditCards',
              cardId
            ),
            {
              householdId: DEFAULT_HOUSEHOLD_ID,
              ownerId: firebaseUser.uid,
              name: targetCard.name.slice(0, 80),
              holder: targetCard.holder,
              amount: targetCard.amount,
              color: targetCard.color,
              lastUpdatedIso: nowIso.slice(0, 40),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            }
          );
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, path);
        }
      }
      await syncHouseholdToFirestore(nextHousehold);
    }
  };

  const handleAddCard = async (cardInput: {
    name: string;
    holder: FamilyMember;
    amount: number;
    color: CardColor;
  }) => {
    const nowIso = new Date().toISOString();
    const newId = `card-${Date.now()}`;
    const newCard: CreditCardItem = {
      id: newId,
      householdId: DEFAULT_HOUSEHOLD_ID,
      ownerId: firebaseUser?.uid || 'local-family',
      name: cardInput.name.slice(0, 80),
      holder: cardInput.holder,
      amount: cardInput.amount,
      color: cardInput.color,
      lastUpdatedIso: nowIso,
    };

    setCreditCards((prev) => [...prev, newCard]);
    triggerCelebrationConfetti();
    showToast(`הכרטיס "${newCard.name} – ${newCard.holder}" נוסף בהצלחה!`);

    if (isAuthorizedFirebaseUser && firebaseUser) {
      const path = `households/${DEFAULT_HOUSEHOLD_ID}/creditCards/${newId}`;
      try {
        await setDoc(
          doc(db, 'households', DEFAULT_HOUSEHOLD_ID, 'creditCards', newId),
          {
            householdId: DEFAULT_HOUSEHOLD_ID,
            ownerId: firebaseUser.uid,
            name: newCard.name,
            holder: newCard.holder,
            amount: newCard.amount,
            color: newCard.color,
            lastUpdatedIso: nowIso.slice(0, 40),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    setCreditCards((prev) => prev.filter((c) => c.id !== cardId));
    showToast('כרטיס האשראי הוסר מהרשימה.');

    if (isAuthorizedFirebaseUser && firebaseUser) {
      const path = `households/${DEFAULT_HOUSEHOLD_ID}/creditCards/${cardId}`;
      try {
        await deleteDoc(
          doc(db, 'households', DEFAULT_HOUSEHOLD_ID, 'creditCards', cardId)
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  };

  const handleMarkAllCardsUpdatedToday = () => {
    const nowIso = new Date().toISOString();
    setCreditCards((prev) =>
      prev.map((c) => ({ ...c, lastUpdatedIso: nowIso }))
    );
    const nextHousehold: HouseholdState = {
      ...household,
      streakCount: household.streakCount + 1,
      lastCreditUpdateIso: nowIso,
    };
    setHousehold(nextHousehold);
    triggerCelebrationConfetti();
    showToast('כל הכרטיסים סומנו כמעודכנים להיום! +1 לרצף המשפחתי 🔥');
    syncHouseholdToFirestore(nextHousehold);
  };

  const handleSimulateOverdueSixDays = () => {
    const sixDaysAgo = new Date(
      Date.now() - 6 * 24 * 60 * 60 * 1000
    ).toISOString();
    setCreditCards((prev) =>
      prev.map((c) => ({ ...c, lastUpdatedIso: sixDaysAgo }))
    );
    setHousehold((prev) => ({
      ...prev,
      lastCreditUpdateIso: sixDaysAgo,
    }));
    showToast('הופעלה הדמיית איחור של 6 ימים – שימו לב לבאנר האדום!');
  };

  const handleAddDirectCharge = async (chargeInput: {
    description: string;
    amount: number;
    chargeDate: string;
    chargeType: DirectChargeType;
  }) => {
    const newId = `direct-${Date.now()}`;
    const newCharge: DirectChargeItem = {
      id: newId,
      householdId: DEFAULT_HOUSEHOLD_ID,
      ownerId: firebaseUser?.uid || 'local-family',
      description: chargeInput.description.slice(0, 100),
      amount: chargeInput.amount,
      chargeDate: chargeInput.chargeDate.slice(0, 20),
      chargeType: chargeInput.chargeType,
    };
    setDirectCharges((prev) => [newCharge, ...prev]);
    showToast(`חיוב ישיר "${newCharge.description}" נוסף לתחזית!`);

    if (isAuthorizedFirebaseUser && firebaseUser) {
      const path = `households/${DEFAULT_HOUSEHOLD_ID}/directCharges/${newId}`;
      try {
        await setDoc(
          doc(db, 'households', DEFAULT_HOUSEHOLD_ID, 'directCharges', newId),
          {
            householdId: DEFAULT_HOUSEHOLD_ID,
            ownerId: firebaseUser.uid,
            description: newCharge.description,
            amount: newCharge.amount,
            chargeDate: newCharge.chargeDate,
            chargeType: newCharge.chargeType,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    }
  };

  const handleDeleteDirectCharge = async (chargeId: string) => {
    setDirectCharges((prev) => prev.filter((c) => c.id !== chargeId));
    showToast('החיוב הישיר נמחק.');

    if (isAuthorizedFirebaseUser && firebaseUser) {
      const path = `households/${DEFAULT_HOUSEHOLD_ID}/directCharges/${chargeId}`;
      try {
        await deleteDoc(
          doc(
            db,
            'households',
            DEFAULT_HOUSEHOLD_ID,
            'directCharges',
            chargeId
          )
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  };

  const handleAddFixedItem = async (itemInput: {
    title: string;
    amount: number;
    dayOfMonth: number;
    category: FixedCategory;
  }) => {
    const newId = `fixed-${Date.now()}`;
    const newItem: FixedBudgetItem = {
      id: newId,
      householdId: DEFAULT_HOUSEHOLD_ID,
      ownerId: firebaseUser?.uid || 'local-family',
      title: itemInput.title.slice(0, 80),
      amount: itemInput.amount,
      dayOfMonth: itemInput.dayOfMonth,
      category: itemInput.category,
    };
    setFixedItems((prev) => [...prev, newItem]);
    showToast(`שורה קבועה "${newItem.title}" נוספה בהצלחה!`);

    if (isAuthorizedFirebaseUser && firebaseUser) {
      const path = `households/${DEFAULT_HOUSEHOLD_ID}/fixedItems/${newId}`;
      try {
        await setDoc(
          doc(db, 'households', DEFAULT_HOUSEHOLD_ID, 'fixedItems', newId),
          {
            householdId: DEFAULT_HOUSEHOLD_ID,
            ownerId: firebaseUser.uid,
            title: newItem.title,
            amount: newItem.amount,
            dayOfMonth: newItem.dayOfMonth,
            category: newItem.category,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    }
  };

  const handleUpdateFixedItem = async (
    id: string,
    updates: {
      title: string;
      amount: number;
      dayOfMonth: number;
      category: FixedCategory;
    }
  ) => {
    setFixedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
    showToast(`השורה הקבועה "${updates.title}" עודכנה!`);

    if (isAuthorizedFirebaseUser && firebaseUser) {
      const path = `households/${DEFAULT_HOUSEHOLD_ID}/fixedItems/${id}`;
      try {
        await setDoc(
          doc(db, 'households', DEFAULT_HOUSEHOLD_ID, 'fixedItems', id),
          {
            householdId: DEFAULT_HOUSEHOLD_ID,
            ownerId: firebaseUser.uid,
            title: updates.title.slice(0, 80),
            amount: updates.amount,
            dayOfMonth: updates.dayOfMonth,
            category: updates.category,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    }
  };

  const handleDeleteFixedItem = async (id: string) => {
    setFixedItems((prev) => prev.filter((item) => item.id !== id));
    showToast('השורה הקבועה הוסרה.');

    if (isAuthorizedFirebaseUser && firebaseUser) {
      const path = `households/${DEFAULT_HOUSEHOLD_ID}/fixedItems/${id}`;
      try {
        await deleteDoc(
          doc(db, 'households', DEFAULT_HOUSEHOLD_ID, 'fixedItems', id)
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const cred = await signInWithGoogle();
      if (cred.user.email && isUserWhitelisted(cred.user.email)) {
        setIsSimulatedIntruder(false);
        setCurrentMember(getFamilyMemberName(cred.user.email));
        showToast(`ברוכים הבאים, ${getFamilyMemberName(cred.user.email)}! 🦉`);
      } else {
        setIsSimulatedIntruder(true);
      }
    } catch {
      showToast('ההתחברות עם Google בוטלה או נסגרה.');
    }
  };

  const handleLogout = async () => {
    await signOutUser();
    setIsSimulatedIntruder(false);
    showToast('התנתקתם מחשבון Google.');
  };

  // Calculate Forecast & 5-Day Reminder status
  const forecast = calculateFirstOfMonthForecast({
    bankBalance: household.bankBalance,
    monthlySalary: household.monthlySalary,
    creditCards,
    fixedItems,
    directCharges,
    currentDayOfMonth,
  });

  const reminderStatus = calculateFiveDayStatus(household.lastCreditUpdateIso);
  const bankUpdateStatus = calculateFiveDayStatus(household.lastBankUpdateIso);

  // Check if current signed-in user is unauthorized OR if intruder simulation is active
  const isBlockedByWhitelist =
    isSimulatedIntruder ||
    (!!firebaseUser && !isUserWhitelisted(firebaseUser.email));

  return (
    <div className="min-h-screen bg-[#F7F7F7] text-slate-900 flex flex-col">
      {/* Strictly Compliant 3-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b-2 border-slate-200 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Brand Title (single text element, one line) */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('dashboard');
              setIsSimulatedIntruder(false);
            }}
            className="text-lg sm:text-xl font-extrabold tracking-tight text-[#58CC02] whitespace-nowrap shrink-0"
          >
            התקציב של דניאל ועדן
          </a>

          {/* Zone 2: 4 concise single-line text navigation links */}
          <nav
            aria-label="ניווט ראשי"
            className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-600"
          >
            <a
              href="#forecast"
              onClick={() => {
                setActiveView('dashboard');
                setIsSimulatedIntruder(false);
              }}
              className="hover:text-slate-900 hover:underline underline-offset-8 transition-colors whitespace-nowrap shrink-0"
            >
              תחזית ועו״ש
            </a>
            <a
              href="#credit-cards"
              onClick={() => {
                setActiveView('dashboard');
                setIsSimulatedIntruder(false);
              }}
              className="hover:text-slate-900 hover:underline underline-offset-8 transition-colors whitespace-nowrap shrink-0"
            >
              כרטיסי אשראי
            </a>
            <a
              href="#fixed-and-direct"
              onClick={() => {
                setActiveView('dashboard');
                setIsSimulatedIntruder(false);
              }}
              className="hover:text-slate-900 hover:underline underline-offset-8 transition-colors whitespace-nowrap shrink-0"
            >
              קבועות וישירים
            </a>
            <a
              href="#tech-spec"
              onClick={(e) => {
                e.preventDefault();
                setActiveView(
                  activeView === 'spec' ? 'dashboard' : 'spec'
                );
              }}
              className="hover:text-slate-900 hover:underline underline-offset-8 transition-colors whitespace-nowrap shrink-0"
            >
              {activeView === 'spec' ? 'חזרה לדשבורד' : 'מפרט טכני'}
            </a>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsWhitelistModalOpen(true)}
              className="rounded-2xl bg-[#58CC02] border-2 border-[#46A302] border-b-4 px-4 py-2 text-xs sm:text-sm font-extrabold text-white hover:bg-[#4eb800] active:translate-y-1 active:border-b-0 transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              פרופיל וגישה ({currentMember})
            </button>
          </div>
        </div>
      </header>

      {/* Toast Feedback Banner */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-5 z-50 rounded-2xl bg-slate-900 text-white border-b-4 border-slate-950 px-5 py-3 text-xs sm:text-sm font-extrabold shadow-xl"
        >
          {toastMessage}
        </div>
      )}

      {/* Main Content Container */}
      <main id="top" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-7">
        {/* Sub-header Utility Strip (Family Member Switcher, View Switcher, PWA Install) */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200 px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 font-medium">
            <span className="font-extrabold text-slate-900">
              שלום {currentMember}! 👋
            </span>
            <span aria-hidden="true">·</span>
            <span>החלפה מהירה:</span>
            <button
              type="button"
              onClick={() => setCurrentMember('דניאל')}
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                currentMember === 'דניאל'
                  ? 'bg-[#1CB0F6] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              דניאל
            </button>
            <button
              type="button"
              onClick={() => setCurrentMember('עדן')}
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                currentMember === 'עדן'
                  ? 'bg-[#58CC02] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              עדן
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <PWAInstallButton />
            <button
              type="button"
              onClick={() =>
                setActiveView((v) => (v === 'dashboard' ? 'spec' : 'dashboard'))
              }
              className="rounded-xl bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-extrabold text-slate-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              {activeView === 'spec'
                ? 'תצוגת דשבורד תקציב'
                : 'צפייה במפרט הטכני המלא'}
            </button>
          </div>
        </div>

        {isBlockedByWhitelist ? (
          <BlockedOwlScreen
            attemptedEmail={firebaseUser?.email || 'intruder@stranger.com'}
            onReturnToFamily={() => setIsSimulatedIntruder(false)}
            onGoogleLogin={handleGoogleLogin}
          />
        ) : activeView === 'spec' ? (
          <TechSpecView />
        ) : (
          <>
            {/* 1. 5-Day Reminder & Streak Banner */}
            <ReminderBannerAndModal
              reminderStatus={reminderStatus}
              streakCount={household.streakCount}
              projectedBalanceFormatted={formatILS(
                forecast.projectedFirstOfMonthBalance
              )}
              onMarkAllCardsUpdatedToday={handleMarkAllCardsUpdatedToday}
              onSimulateOverdueSixDays={handleSimulateOverdueSixDays}
            />

            {/* 2. The Forecasting Hero Card + Current Bank Balance Status Card */}
            <div id="forecast">
              <ForecastingHeroCard
                forecast={forecast}
                bankBalance={household.bankBalance}
                lastBankUpdateFormatted={bankUpdateStatus.relativeBadgeText}
                currentDayOfMonth={currentDayOfMonth}
                onUpdateBankBalance={handleUpdateBankBalance}
                onChangeDayOfMonth={setCurrentDayOfMonth}
              />
            </div>

            {/* 3. Variable Expenses (Credit Cards) */}
            <div id="credit-cards">
              <CreditCardsSection
                cards={creditCards}
                onUpdateCardAmount={handleUpdateCardAmount}
                onMarkAllUpdated={handleMarkAllCardsUpdatedToday}
                onAddCard={handleAddCard}
                onDeleteCard={handleDeleteCard}
              />
            </div>

            {/* 4. Fixed Expenses & Income + Additional Direct Charges */}
            <div
              id="fixed-and-direct"
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch"
            >
              <FixedExpensesSection
                monthlySalary={household.monthlySalary}
                fixedItems={fixedItems}
                onUpdateMonthlySalary={handleUpdateMonthlySalary}
                onAddFixedItem={handleAddFixedItem}
                onUpdateFixedItem={handleUpdateFixedItem}
                onDeleteFixedItem={handleDeleteFixedItem}
              />

              <DirectChargesSection
                charges={directCharges}
                onAddCharge={handleAddDirectCharge}
                onDeleteCharge={handleDeleteDirectCharge}
              />
            </div>
          </>
        )}
      </main>

      {/* Clean Quiet Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white py-5 px-4 sm:px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            התקציב של דניאל ועדן · ניהול תזרים ותקציב משפחתי בזמן אמת
          </span>
          <span>
            מוגן באמצעות Whitelist לדניאל ועדן בלבד · תזכורת אוטומטית כל 5 ימים
          </span>
        </div>
      </footer>

      {/* Whitelist & Auth Modal */}
      <WhitelistGateModal
        isOpen={isWhitelistModalOpen}
        onClose={() => setIsWhitelistModalOpen(false)}
        currentMember={currentMember}
        onSwitchMember={setCurrentMember}
        firebaseEmail={firebaseUser?.email || null}
        isAuthorizedUser={isAuthorizedFirebaseUser}
        onGoogleLogin={handleGoogleLogin}
        onLogout={handleLogout}
        isSimulatedIntruder={isSimulatedIntruder}
        onToggleSimulatedIntruder={setIsSimulatedIntruder}
      />
    </div>
  );
}
