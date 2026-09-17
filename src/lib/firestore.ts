import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { User, Category, Output, CashBalance, CashEntry, AuditLog, CompanySettings } from '@/types';

// Collection names
const COLLECTIONS = {
  USERS: 'users',
  CATEGORIES: 'categories',
  OUTPUTS: 'outputs',
  CASH_BALANCE: 'cash_balance',
  CASH_ENTRIES: 'cash_entries',
  AUDIT_LOGS: 'audit_logs',
  COMPANY_SETTINGS: 'company_settings',
} as const;

// Helper to convert Firestore timestamp to string
const timestampToString = (timestamp: any): string => {
  if (!timestamp) return new Date().toISOString();
  
  // If it's already a string, return it
  if (typeof timestamp === 'string') return timestamp;
  
  // If it's a number, convert to date
  if (typeof timestamp === 'number') return new Date(timestamp).toISOString();
  
  // If it's a Firebase Timestamp object
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }
  
  // Fallback
  return new Date(timestamp).toISOString();
};

// Helper to convert string to Firestore timestamp
const stringToTimestamp = (dateString: string): Timestamp => {
  return Timestamp.fromDate(new Date(dateString));
};

// Users
export const createUser = async (userData: Omit<User, 'id'>): Promise<User> => {
  const docRef = await addDoc(collection(db, COLLECTIONS.USERS), {
    ...userData,
    created_at: serverTimestamp(),
  });
  const docSnap = await getDoc(docRef);
  return {
    id: docRef.id,
    ...docSnap.data(),
    created_at: timestampToString(docSnap.data().created_at),
  } as User;
};

export const getUser = async (userId: string): Promise<User | null> => {
  const docRef = doc(db, COLLECTIONS.USERS, userId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return {
    id: docSnap.id,
    ...docSnap.data(),
    created_at: timestampToString(docSnap.data().created_at),
  } as User;
};

export const getAllUsers = async (): Promise<User[]> => {
  const q = query(collection(db, COLLECTIONS.USERS), orderBy('created_at', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    created_at: timestampToString(doc.data().created_at),
  })) as User[];
};

export const updateUser = async (userId: string, userData: Partial<User>): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.USERS, userId);
  await updateDoc(docRef, userData);
};

export const deleteUser = async (userId: string): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.USERS, userId);
  await deleteDoc(docRef);
};

// Categories
export const createCategory = async (categoryData: Omit<Category, 'id'>): Promise<Category> => {
  const docRef = await addDoc(collection(db, COLLECTIONS.CATEGORIES), {
    ...categoryData,
    created_at: serverTimestamp(),
  });
  const docSnap = await getDoc(docRef);
  return {
    id: docRef.id,
    ...docSnap.data(),
    created_at: timestampToString(docSnap.data().created_at),
  } as Category;
};

export const getAllCategories = async (): Promise<Category[]> => {
  const q = query(collection(db, COLLECTIONS.CATEGORIES), orderBy('created_at', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    created_at: timestampToString(doc.data().created_at),
  })) as Category[];
};

export const updateCategory = async (categoryId: string, categoryData: Partial<Category>): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.CATEGORIES, categoryId);
  await updateDoc(docRef, categoryData);
};

export const deleteCategory = async (categoryId: string): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.CATEGORIES, categoryId);
  await deleteDoc(docRef);
};

// Outputs
export const createOutput = async (outputData: Omit<Output, 'id' | 'number'>): Promise<Output> => {
  return await runTransaction(db, async (transaction) => {
    // Get current balance
    const balanceRef = doc(db, COLLECTIONS.CASH_BALANCE, 'current');
    const balanceDoc = await transaction.get(balanceRef);

    let currentBalance = 0;
    let totalOutputs = 0;

    if (balanceDoc.exists()) {
      const balanceData = balanceDoc.data() as CashBalance;
      currentBalance = balanceData.current_balance;
      totalOutputs = balanceData.total_outputs;
    }

    // Generate output number
    const outputsRef = collection(db, COLLECTIONS.OUTPUTS);
    const outputsQuery = query(outputsRef, orderBy('number', 'desc'), limit(1));
    const outputsSnapshot = await getDocs(outputsQuery);
    let nextNumber = 1;
    if (!outputsSnapshot.empty) {
      const lastOutput = outputsSnapshot.docs[0].data() as Output;
      const lastNumber = parseInt(lastOutput.number.replace('DEP-', ''));
      nextNumber = lastNumber + 1;
    }
    const outputNumber = `DEP-${String(nextNumber).padStart(6, '0')}`;

    // Create output
    const outputRef = await addDoc(collection(db, COLLECTIONS.OUTPUTS), {
      ...outputData,
      number: outputNumber,
      created_at: serverTimestamp(),
    });

    // Update balance
    const newBalance = currentBalance - outputData.amount;
    const newTotalOutputs = totalOutputs + outputData.amount;

    if (balanceDoc.exists()) {
      transaction.update(balanceRef, {
        current_balance: newBalance,
        total_outputs: newTotalOutputs,
      });
    } else {
      transaction.set(balanceRef, {
        initial_balance: 0,
        current_balance: newBalance,
        total_entries: 0,
        total_outputs: newTotalOutputs,
      });
    }

    // Get the created output
    const outputDoc = await getDoc(outputRef);
    return {
      id: outputRef.id,
      ...outputDoc.data(),
      number: outputNumber,
      created_at: timestampToString(outputDoc.data().created_at),
    } as Output;
  });
};

export const getAllOutputs = async (): Promise<Output[]> => {
  const q = query(collection(db, COLLECTIONS.OUTPUTS), orderBy('date', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    created_at: timestampToString(doc.data().created_at),
  })) as Output[];
};

export const getOutputsByDateRange = async (startDate: string, endDate: string): Promise<Output[]> => {
  const q = query(
    collection(db, COLLECTIONS.OUTPUTS),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    created_at: timestampToString(doc.data().created_at),
  })) as Output[];
};

export const updateOutput = async (outputId: string, outputData: Partial<Output>): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.OUTPUTS, outputId);
  await updateDoc(docRef, outputData);
};

export const deleteOutput = async (outputId: string, amount: number): Promise<void> => {
  return await runTransaction(db, async (transaction) => {
    // Get current balance
    const balanceRef = doc(db, COLLECTIONS.CASH_BALANCE, 'current');
    const balanceDoc = await transaction.get(balanceRef);

    if (balanceDoc.exists()) {
      const balanceData = balanceDoc.data() as CashBalance;
      const newBalance = balanceData.current_balance + amount;
      const newTotalOutputs = balanceData.total_outputs - amount;

      transaction.update(balanceRef, {
        current_balance: newBalance,
        total_outputs: newTotalOutputs,
      });
    }

    // Delete output
    const outputRef = doc(db, COLLECTIONS.OUTPUTS, outputId);
    transaction.delete(outputRef);
  });
};

// Cash Balance
export const getCashBalance = async (): Promise<CashBalance | null> => {
  const docRef = doc(db, COLLECTIONS.CASH_BALANCE, 'current');
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return docSnap.data() as CashBalance;
};

export const setInitialBalance = async (amount: number): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.CASH_BALANCE, 'current');
  await setDoc(docRef, {
    initial_balance: amount,
    current_balance: amount,
    total_entries: 0,
    total_outputs: 0,
  });
};

export const updateCashBalance = async (balanceData: Partial<CashBalance>): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.CASH_BALANCE, 'current');
  await updateDoc(docRef, balanceData);
};

// Cash Entries
export const createCashEntry = async (entryData: Omit<CashEntry, 'id'>): Promise<CashEntry> => {
  return await runTransaction(db, async (transaction) => {
    // Get current balance
    const balanceRef = doc(db, COLLECTIONS.CASH_BALANCE, 'current');
    const balanceDoc = await transaction.get(balanceRef);

    let currentBalance = 0;
    let totalEntries = 0;

    if (balanceDoc.exists()) {
      const balanceData = balanceDoc.data() as CashBalance;
      currentBalance = balanceData.current_balance;
      totalEntries = balanceData.total_entries;
    }

    // Create entry
    const entryRef = await addDoc(collection(db, COLLECTIONS.CASH_ENTRIES), {
      ...entryData,
      created_at: serverTimestamp(),
    });

    // Update balance
    const newBalance = currentBalance + entryData.amount;
    const newTotalEntries = totalEntries + entryData.amount;

    if (balanceDoc.exists()) {
      transaction.update(balanceRef, {
        current_balance: newBalance,
        total_entries: newTotalEntries,
      });
    } else {
      transaction.set(balanceRef, {
        initial_balance: 0,
        current_balance: newBalance,
        total_entries: newTotalEntries,
        total_outputs: 0,
      });
    }

    // Get the created entry
    const entryDoc = await getDoc(entryRef);
    return {
      id: entryRef.id,
      ...entryDoc.data(),
      created_at: timestampToString(entryDoc.data().created_at),
    } as CashEntry;
  });
};

export const getAllCashEntries = async (): Promise<CashEntry[]> => {
  const q = query(collection(db, COLLECTIONS.CASH_ENTRIES), orderBy('date', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    created_at: timestampToString(doc.data().created_at),
  })) as CashEntry[];
};

// Audit Logs
export const createAuditLog = async (logData: Omit<AuditLog, 'id'>): Promise<AuditLog> => {
  const docRef = await addDoc(collection(db, COLLECTIONS.AUDIT_LOGS), {
    ...logData,
    created_at: serverTimestamp(),
  });
  const docSnap = await getDoc(docRef);
  return {
    id: docRef.id,
    ...docSnap.data(),
    created_at: timestampToString(docSnap.data().created_at),
  } as AuditLog;
};

export const getAllAuditLogs = async (): Promise<AuditLog[]> => {
  const q = query(collection(db, COLLECTIONS.AUDIT_LOGS), orderBy('created_at', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    created_at: timestampToString(doc.data().created_at),
  })) as AuditLog[];
};

// Company Settings
export const getCompanySettings = async (): Promise<CompanySettings | null> => {
  const docRef = doc(db, COLLECTIONS.COMPANY_SETTINGS, 'current');
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return {
    id: docSnap.id,
    ...docSnap.data(),
    updated_at: timestampToString(docSnap.data().updated_at),
  } as CompanySettings;
};

export const updateCompanySettings = async (settingsData: Partial<CompanySettings>): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.COMPANY_SETTINGS, 'current');
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    await updateDoc(docRef, {
      ...settingsData,
      updated_at: serverTimestamp(),
    });
  } else {
    await setDoc(docRef, {
      ...settingsData,
      updated_at: serverTimestamp(),
    });
  }
};
