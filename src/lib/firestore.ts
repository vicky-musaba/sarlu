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
import {
  User,
  Category,
  Output,
  CashBalance,
  CashEntry,
  AuditLog,
  CompanySettings,
} from '@/types';

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

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Convertit une valeur Firestore/date en string ISO.
 */
const timestampToString = (timestamp: unknown): string => {
  if (!timestamp) {
    return new Date().toISOString();
  }

  if (typeof timestamp === 'string') {
    return timestamp;
  }

  if (typeof timestamp === 'number') {
    return new Date(timestamp).toISOString();
  }

  if (
    timestamp instanceof Timestamp ||
    (typeof timestamp === 'object' &&
      timestamp !== null &&
      'toDate' in timestamp &&
      typeof (timestamp as { toDate?: unknown }).toDate === 'function')
  ) {
    return (
      timestamp as {
        toDate: () => Date;
      }
    )
      .toDate()
      .toISOString();
  }

  return new Date(String(timestamp)).toISOString();
};

/**
 * Convertit une string ISO en Timestamp Firestore.
 */
const stringToTimestamp = (dateString: string): Timestamp => {
  return Timestamp.fromDate(new Date(dateString));
};

/**
 * Vérifie qu'un rôle est valide.
 */
const normalizeRole = (role: unknown): User['role'] => {
  if (role === 'admin' || role === 'supervisor' || role === 'auditor' || role === 'cashier') {
    return role;
  }

  throw new Error(`Rôle utilisateur invalide: ${String(role)}`);
};

// -----------------------------------------------------------------------------
// Users
// -----------------------------------------------------------------------------

export const createUser = async (
  userData: Omit<User, 'id'>
): Promise<User> => {
  const docRef = await addDoc(collection(db, COLLECTIONS.USERS), {
    ...userData,
    role: normalizeRole(userData.role),
    created_at: serverTimestamp(),
  });

  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Impossible de récupérer l’utilisateur créé.');
  }

  const data = docSnap.data();

  return {
    id: docRef.id,
    username: String(data.username ?? ''),
    role: normalizeRole(data.role),
    created_at: timestampToString(data.created_at),
  };
};

export const getUser = async (
  userId: string
): Promise<User | null> => {
  const docRef = doc(db, COLLECTIONS.USERS, userId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();

  return {
    id: docSnap.id,
    username: String(data.username ?? ''),
    role: normalizeRole(data.role),
    created_at: timestampToString(data.created_at),
  };
};

export const getAllUsers = async (): Promise<User[]> => {
  const q = query(
    collection(db, COLLECTIONS.USERS),
    orderBy('created_at', 'desc')
  );

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((document) => {
    const data = document.data();

    return {
      id: document.id,
      username: String(data.username ?? ''),
      role: normalizeRole(data.role),
      created_at: timestampToString(data.created_at),
    };
  });
};

export const updateUser = async (
  userId: string,
  userData: Partial<User>
): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.USERS, userId);

  const dataToUpdate: Record<string, unknown> = {
    ...userData,
  };

  delete dataToUpdate.id;

  if ('role' in dataToUpdate) {
    dataToUpdate.role = normalizeRole(dataToUpdate.role);
  }

  await updateDoc(docRef, dataToUpdate);
};

export const deleteUser = async (
  userId: string
): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.USERS, userId);
  await deleteDoc(docRef);
};

// -----------------------------------------------------------------------------
// Categories
// -----------------------------------------------------------------------------

export const createCategory = async (
  categoryData: Omit<Category, 'id'>
): Promise<Category> => {
  const docRef = await addDoc(
    collection(db, COLLECTIONS.CATEGORIES),
    {
      ...categoryData,
      created_at: serverTimestamp(),
    }
  );

  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Impossible de récupérer la catégorie créée.');
  }

  const data = docSnap.data();

  return {
    id: docRef.id,
    name: String(data.name ?? ''),
    is_default: Boolean(data.is_default),
    created_at: timestampToString(data.created_at),
  };
};

export const getAllCategories = async (): Promise<Category[]> => {
  const q = query(
    collection(db, COLLECTIONS.CATEGORIES),
    orderBy('created_at', 'desc')
  );

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((document) => {
    const data = document.data();

    return {
      id: document.id,
      name: String(data.name ?? ''),
      is_default: Boolean(data.is_default),
      created_at: timestampToString(data.created_at),
    };
  });
};

export const updateCategory = async (
  categoryId: string,
  categoryData: Partial<Category>
): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.CATEGORIES, categoryId);

  const dataToUpdate: Record<string, unknown> = {
    ...categoryData,
  };

  delete dataToUpdate.id;

  await updateDoc(docRef, dataToUpdate);
};

export const deleteCategory = async (
  categoryId: string
): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.CATEGORIES, categoryId);
  await deleteDoc(docRef);
};

// -----------------------------------------------------------------------------
// Outputs
// -----------------------------------------------------------------------------

export const createOutput = async (
  inputOutputData: Omit<Output, 'id' | 'number' | 'status' | 'approved_by' | 'approved_by_username' | 'approved_at' | 'rejection_reason'>
): Promise<Output> => {
  return await runTransaction(db, async (transaction) => {
    // Generate output number
    const outputsRef = collection(
      db,
      COLLECTIONS.OUTPUTS
    );

    const outputsQuery = query(
      outputsRef,
      orderBy('number', 'desc'),
      limit(1)
    );

    const outputsSnapshot = await getDocs(outputsQuery);

    let nextNumber = 1;

    if (!outputsSnapshot.empty) {
      const firstDocument = outputsSnapshot.docs[0];

      if (firstDocument) {
        const lastOutputData = firstDocument.data();
        const lastNumberString = String(
          lastOutputData.number ?? 'DEP-000000'
        );

        const lastNumber = parseInt(
          lastNumberString.replace('DEP-', ''),
          10
        );

        if (!Number.isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
    }

    const outputNumber = `DEP-${String(nextNumber).padStart(
      6,
      '0'
    )}`;

    // Create output with pending status
    const outputRef = doc(
      collection(db, COLLECTIONS.OUTPUTS)
    );

    transaction.set(outputRef, {
      ...inputOutputData,
      number: outputNumber,
      status: 'pending',
      created_at: serverTimestamp(),
    });

    return {
      id: outputRef.id,
      ...inputOutputData,
      number: outputNumber,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
  });
};

export const approveOutput = async (
  outputId: string,
  approverId: string,
  approverUsername: string
): Promise<void> => {
  return await runTransaction(db, async (transaction) => {
    const outputRef = doc(db, COLLECTIONS.OUTPUTS, outputId);
    const outputDoc = await transaction.get(outputRef);

    if (!outputDoc.exists()) {
      throw new Error('Output not found');
    }

    const outputData = outputDoc.data();
    if (outputData.status !== 'pending') {
      throw new Error('Output is not pending');
    }

    // Get current balance
    const balanceRef = doc(db, COLLECTIONS.CASH_BALANCE, 'current');
    const balanceDoc = await transaction.get(balanceRef);

    let currentBalance = 0;
    let totalOutputs = 0;

    if (balanceDoc.exists()) {
      const balanceData = balanceDoc.data();
      currentBalance = Number(balanceData.current_balance ?? 0);
      totalOutputs = Number(balanceData.total_outputs ?? 0);
    }

    // Update balance calculation
    const newBalance = currentBalance - Number(outputData.amount);
    const newTotalOutputs = totalOutputs + Number(outputData.amount);

    // Update output status
    transaction.update(outputRef, {
      status: 'approved',
      approved_by: approverId,
      approved_by_username: approverUsername,
      approved_at: serverTimestamp(),
    });

    // Update balance
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
  });
};

export const rejectOutput = async (
  outputId: string,
  approverId: string,
  approverUsername: string,
  rejectionReason: string
): Promise<void> => {
  const outputRef = doc(db, COLLECTIONS.OUTPUTS, outputId);
  await updateDoc(outputRef, {
    status: 'rejected',
    approved_by: approverId,
    approved_by_username: approverUsername,
    approved_at: serverTimestamp(),
    rejection_reason: rejectionReason,
  });
};

export const getPendingOutputs = async (): Promise<Output[]> => {
  const q = query(
    collection(db, COLLECTIONS.OUTPUTS),
    where('status', '==', 'pending')
  );

  const querySnapshot = await getDocs(q);
  const outputs = querySnapshot.docs.map((document) => {
    const data = document.data();
    return {
      id: document.id,
      number: String(data.number ?? ''),
      date: String(data.date ?? ''),
      category_id: String(data.category_id ?? ''),
      category_name: String(data.category_name ?? ''),
      description: String(data.description ?? ''),
      amount: Number(data.amount ?? 0),
      currency: String(data.currency ?? '$'),
      responsible: String(data.responsible ?? ''),
      payment_mode: String(data.payment_mode ?? ''),
      reference: String(data.reference ?? ''),
      observation: String(data.observation ?? ''),
      created_by: String(data.created_by ?? ''),
      created_by_username: String(data.created_by_username ?? ''),
      created_at: timestampToString(data.created_at),
      status: 'pending' as const,
      approved_by: data.approved_by ? String(data.approved_by) : undefined,
      approved_by_username: data.approved_by_username ? String(data.approved_by_username) : undefined,
      approved_at: data.approved_at ? timestampToString(data.approved_at) : undefined,
      rejection_reason: data.rejection_reason ? String(data.rejection_reason) : undefined,
    };
  });

  // Sort by created_at descending
  return outputs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const getAllOutputs = async (): Promise<Output[]> => {
  const q = query(
    collection(db, COLLECTIONS.OUTPUTS),
    orderBy('date', 'desc')
  );

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((document) => {
    const data = document.data();

    return {
      id: document.id,
      number: String(data.number ?? ''),
      date: String(data.date ?? ''),
      category_id: String(data.category_id ?? ''),
      category_name: String(data.category_name ?? ''),
      description: String(data.description ?? ''),
      amount: Number(data.amount ?? 0),
      currency: String(data.currency ?? '$'),
      responsible: String(data.responsible ?? ''),
      payment_mode: String(data.payment_mode ?? ''),
      reference: String(data.reference ?? ''),
      observation: String(data.observation ?? ''),
      created_by: String(data.created_by ?? ''),
      created_by_username: String(
        data.created_by_username ?? ''
      ),
      created_at: timestampToString(data.created_at),
      status: (data.status as 'pending' | 'approved' | 'rejected') || 'approved',
      approved_by: data.approved_by ? String(data.approved_by) : undefined,
      approved_by_username: data.approved_by_username ? String(data.approved_by_username) : undefined,
      approved_at: data.approved_at ? timestampToString(data.approved_at) : undefined,
      rejection_reason: data.rejection_reason ? String(data.rejection_reason) : undefined,
    };
  });
};

export const getOutputById = async (
  id: string
): Promise<Output | null> => {
  const docRef = doc(db, COLLECTIONS.OUTPUTS, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();

  return {
    id: docSnap.id,
    number: String(data.number ?? ''),
    date: String(data.date ?? ''),
    category_id: String(data.category_id ?? ''),
    category_name: String(data.category_name ?? ''),
    description: String(data.description ?? ''),
    amount: Number(data.amount ?? 0),
    currency: String(data.currency ?? '$'),
    responsible: String(data.responsible ?? ''),
    payment_mode: String(data.payment_mode ?? ''),
    reference: String(data.reference ?? ''),
    observation: String(data.observation ?? ''),
    created_by: String(data.created_by ?? ''),
    created_by_username: String(
      data.created_by_username ?? ''
    ),
    created_at: timestampToString(data.created_at),
    status: (data.status as 'pending' | 'approved' | 'rejected') || 'approved',
    approved_by: data.approved_by ? String(data.approved_by) : undefined,
    approved_by_username: data.approved_by_username ? String(data.approved_by_username) : undefined,
    approved_at: data.approved_at ? timestampToString(data.approved_at) : undefined,
    rejection_reason: data.rejection_reason ? String(data.rejection_reason) : undefined,
  };
};

export const getOutputsByDateRange = async (
  startDate: string,
  endDate: string
): Promise<Output[]> => {
  const q = query(
    collection(db, COLLECTIONS.OUTPUTS),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'desc')
  );

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((document) => {
    const data = document.data();

    return {
      id: document.id,
      number: String(data.number ?? ''),
      date: String(data.date ?? ''),
      category_id: String(data.category_id ?? ''),
      category_name: String(data.category_name ?? ''),
      description: String(data.description ?? ''),
      amount: Number(data.amount ?? 0),
      currency: String(data.currency ?? '$'),
      responsible: String(data.responsible ?? ''),
      payment_mode: String(data.payment_mode ?? ''),
      reference: String(data.reference ?? ''),
      observation: String(data.observation ?? ''),
      created_by: String(data.created_by ?? ''),
      created_by_username: String(
        data.created_by_username ?? ''
      ),
      created_at: timestampToString(data.created_at),
      status: (data.status as 'pending' | 'approved' | 'rejected') || 'approved',
      approved_by: data.approved_by ? String(data.approved_by) : undefined,
      approved_by_username: data.approved_by_username ? String(data.approved_by_username) : undefined,
      approved_at: data.approved_at ? timestampToString(data.approved_at) : undefined,
      rejection_reason: data.rejection_reason ? String(data.rejection_reason) : undefined,
    };
  });
};

export const updateOutput = async (
  outputId: string,
  outputData: Partial<Output>
): Promise<void> => {
  const docRef = doc(db, COLLECTIONS.OUTPUTS, outputId);

  const dataToUpdate: Record<string, unknown> = {
    ...outputData,
  };

  delete dataToUpdate.id;

  await updateDoc(docRef, dataToUpdate);
};

export const deleteOutput = async (
  outputId: string,
  amount: number
): Promise<void> => {
  return await runTransaction(db, async (transaction) => {
    // Get current balance
    const balanceRef = doc(
      db,
      COLLECTIONS.CASH_BALANCE,
      'current'
    );

    const balanceDoc = await transaction.get(balanceRef);

    if (balanceDoc.exists()) {
      const balanceData = balanceDoc.data();

      const currentBalance = Number(
        balanceData.current_balance ?? 0
      );

      const totalOutputs = Number(
        balanceData.total_outputs ?? 0
      );

      const newBalance =
        currentBalance + Number(amount);

      const newTotalOutputs =
        totalOutputs - Number(amount);

      transaction.update(balanceRef, {
        current_balance: newBalance,
        total_outputs: newTotalOutputs,
      });
    }

    // Delete output
    const outputRef = doc(
      db,
      COLLECTIONS.OUTPUTS,
      outputId
    );

    transaction.delete(outputRef);
  });
};

// -----------------------------------------------------------------------------
// Cash Balance
// -----------------------------------------------------------------------------

export const getCashBalance = async (): Promise<
  CashBalance | null
> => {
  const docRef = doc(
    db,
    COLLECTIONS.CASH_BALANCE,
    'current'
  );

  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();

  return {
    initial_balance: Number(data.initial_balance ?? 0),
    current_balance: Number(data.current_balance ?? 0),
    total_entries: Number(data.total_entries ?? 0),
    total_outputs: Number(data.total_outputs ?? 0),
    balances_by_currency: data.balances_by_currency || {
      '$': { initial_balance: 0, current_balance: 0, total_entries: 0, total_outputs: 0 },
      'CDF': { initial_balance: 0, current_balance: 0, total_entries: 0, total_outputs: 0 },
    },
  };
};

export const setInitialBalance = async (
  amount: number
): Promise<void> => {
  const docRef = doc(
    db,
    COLLECTIONS.CASH_BALANCE,
    'current'
  );

  await setDoc(docRef, {
    initial_balance: amount,
    current_balance: amount,
    total_entries: 0,
    total_outputs: 0,
  });
};

export const updateCashBalance = async (
  balanceData: Partial<CashBalance>
): Promise<void> => {
  const docRef = doc(
    db,
    COLLECTIONS.CASH_BALANCE,
    'current'
  );

  await updateDoc(docRef, balanceData);
};

// -----------------------------------------------------------------------------
// Cash Entries
// -----------------------------------------------------------------------------

export const createCashEntry = async (
  inputEntryData: Omit<CashEntry, 'id'>
): Promise<CashEntry> => {
  return await runTransaction(db, async (transaction) => {
    // Get current balance
    const balanceRef = doc(
      db,
      COLLECTIONS.CASH_BALANCE,
      'current'
    );

    const balanceDoc = await transaction.get(balanceRef);

    let currentBalance = 0;
    let totalEntries = 0;

    if (balanceDoc.exists()) {
      const balanceData = balanceDoc.data();

      currentBalance = Number(
        balanceData.current_balance ?? 0
      );

      totalEntries = Number(
        balanceData.total_entries ?? 0
      );
    }

    // Update balance calculation
    const newBalance =
      currentBalance + Number(inputEntryData.amount);

    const newTotalEntries =
      totalEntries + Number(inputEntryData.amount);

    // Create entry
    const entryRef = doc(
      collection(db, COLLECTIONS.CASH_ENTRIES)
    );

    transaction.set(entryRef, {
      ...inputEntryData,
      created_at: serverTimestamp(),
    });

    // Update balance
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

    return {
      id: entryRef.id,
      ...inputEntryData,
      created_at: new Date().toISOString(),
    };
  });
};

export const getAllCashEntries = async (): Promise<
  CashEntry[]
> => {
  const q = query(
    collection(db, COLLECTIONS.CASH_ENTRIES),
    orderBy('date', 'desc')
  );

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((document) => {
    const data = document.data();

    return {
      id: document.id,
      date: String(data.date ?? ''),
      amount: Number(data.amount ?? 0),
      currency: String(data.currency ?? '$'),
      description: String(data.description ?? ''),
      created_by: String(data.created_by ?? ''),
      created_at: timestampToString(data.created_at),
    };
  });
};

// -----------------------------------------------------------------------------
// Audit Logs
// -----------------------------------------------------------------------------

export const createAuditLog = async (
  logData: Omit<AuditLog, 'id'>
): Promise<AuditLog> => {
  const docRef = await addDoc(
    collection(db, COLLECTIONS.AUDIT_LOGS),
    {
      ...logData,
      created_at: serverTimestamp(),
    }
  );

  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error(
      'Impossible de récupérer le journal d’audit créé.'
    );
  }

  const data = docSnap.data();

  return {
    id: docRef.id,
    date: String(data.date ?? ''),
    time: String(data.time ?? ''),
    user_id: String(data.user_id ?? ''),
    username: String(data.username ?? ''),
    role: String(data.role ?? ''),
    action: String(data.action ?? ''),
    element: String(data.element ?? ''),
    output_number:
      data.output_number !== undefined &&
      data.output_number !== null
        ? String(data.output_number)
        : null,
    old_value:
      data.old_value !== undefined &&
      data.old_value !== null
        ? String(data.old_value)
        : null,
    new_value:
      data.new_value !== undefined &&
      data.new_value !== null
        ? String(data.new_value)
        : null,
  };
};

// Fonction utilitaire pour créer facilement des logs d'audit
export const logAuditAction = async (
  userId: string,
  username: string,
  role: string,
  action: string,
  element: string,
  outputNumber?: string,
  oldValue?: string,
  newValue?: string
): Promise<void> => {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().split(' ')[0];

  await createAuditLog({
    date,
    time,
    user_id: userId,
    username,
    role,
    action,
    element,
    output_number: outputNumber || null,
    old_value: oldValue || null,
    new_value: newValue || null,
  });
};

export const getAllAuditLogs = async (): Promise<
  AuditLog[]
> => {
  const q = query(
    collection(db, COLLECTIONS.AUDIT_LOGS),
    orderBy('created_at', 'desc')
  );

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((document) => {
    const data = document.data();

    return {
      id: document.id,
      date: String(data.date ?? ''),
      time: String(data.time ?? ''),
      user_id: String(data.user_id ?? ''),
      username: String(data.username ?? ''),
      role: String(data.role ?? ''),
      action: String(data.action ?? ''),
      element: String(data.element ?? ''),
      output_number:
        data.output_number !== undefined &&
        data.output_number !== null
          ? String(data.output_number)
          : null,
      old_value:
        data.old_value !== undefined &&
        data.old_value !== null
          ? String(data.old_value)
          : null,
      new_value:
        data.new_value !== undefined &&
        data.new_value !== null
          ? String(data.new_value)
          : null,
    };
  });
};

// -----------------------------------------------------------------------------
// Company Settings
// -----------------------------------------------------------------------------

export const getCompanySettings = async (): Promise<
  CompanySettings | null
> => {
  const docRef = doc(
    db,
    COLLECTIONS.COMPANY_SETTINGS,
    'current'
  );

  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();

  return {
    id: docSnap.id,
    name: String(data.name ?? ''),
    logo_path:
      data.logo_path !== undefined &&
      data.logo_path !== null
        ? String(data.logo_path)
        : null,
    address: String(data.address ?? ''),
    phone: String(data.phone ?? ''),
    email: String(data.email ?? ''),
    currency: String(data.currency ?? ''),
    updated_at: timestampToString(data.updated_at),
  };
};

export const updateCompanySettings = async (
  settingsData: Partial<CompanySettings>
): Promise<void> => {
  const docRef = doc(
    db,
    COLLECTIONS.COMPANY_SETTINGS,
    'current'
  );

  const dataToUpdate: Record<string, unknown> = {
    ...settingsData,
    updated_at: serverTimestamp(),
  };

  delete dataToUpdate.id;

  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    await updateDoc(docRef, dataToUpdate);
  } else {
    await setDoc(docRef, dataToUpdate);
  }
};

// Clear all operational data to save storage space
export const clearAllOperationalData = async (): Promise<void> => {
  // Delete all outputs
  const outputsSnapshot = await getDocs(collection(db, COLLECTIONS.OUTPUTS));
  for (const doc of outputsSnapshot.docs) {
    await deleteDoc(doc.ref);
  }

  // Delete all cash entries
  const entriesSnapshot = await getDocs(collection(db, COLLECTIONS.CASH_ENTRIES));
  for (const doc of entriesSnapshot.docs) {
    await deleteDoc(doc.ref);
  }

  // Delete all audit logs
  const auditSnapshot = await getDocs(collection(db, COLLECTIONS.AUDIT_LOGS));
  for (const doc of auditSnapshot.docs) {
    await deleteDoc(doc.ref);
  }

  // Reset cash balance
  const balanceRef = doc(db, COLLECTIONS.CASH_BALANCE, 'current');
  await setDoc(balanceRef, {
    initial_balance: 0,
    current_balance: 0,
    total_entries: 0,
    total_outputs: 0,
  });
};