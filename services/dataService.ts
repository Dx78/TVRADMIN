
import { db } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { Sale, Expense, User, DayState, AppSettings, SalesType, PaymentMethod } from '../types';

// --- DEFAULTS FOR INITIALIZATION ---
const DEFAULT_SETTINGS: AppSettings = {
  salesTypes: Object.values(SalesType),
  paymentMethods: Object.values(PaymentMethod)
};

const DEFAULT_ADMIN: User = { 
  id: 'u_master_admin', 
  name: 'Diego (Admin)', 
  pin: '2211', 
  role: 'admin', 
  receptionistName: 'Diego', 
  isAdminDiego: true 
};

// --- SETTINGS SERVICE ---
export const getSettings = async (): Promise<AppSettings> => {
  try {
    const docRef = doc(db, 'settings', 'global');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as AppSettings;
    } else {
      // Initialize defaults if first run
      await setDoc(docRef, DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
  } catch (error) {
    console.error("Error fetching settings:", error);
    return DEFAULT_SETTINGS;
  }
};

export const updateSettings = async (newSettings: AppSettings): Promise<AppSettings> => {
  try {
    await setDoc(doc(db, 'settings', 'global'), newSettings);
    return newSettings;
  } catch (error) {
    console.error("Error updating settings:", error);
    throw error;
  }
};

// --- USERS SERVICE ---
export const getUsers = async (): Promise<User[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const users = querySnapshot.docs.map(doc => doc.data() as User);

    // If no users exist, create the default Super Admin so you aren't locked out
    if (users.length === 0) {
      await setDoc(doc(db, 'users', DEFAULT_ADMIN.id), DEFAULT_ADMIN);
      return [DEFAULT_ADMIN];
    }

    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

export const saveUser = async (user: User): Promise<User> => {
  try {
    await setDoc(doc(db, 'users', user.id), user);
    return user;
  } catch (error) {
    console.error("Error saving user:", error);
    throw error;
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

// --- SALES SERVICE ---
export const getSales = async (): Promise<Sale[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'sales'));
    return querySnapshot.docs.map(doc => doc.data() as Sale);
  } catch (error) {
    console.error("Error fetching sales:", error);
    return [];
  }
};

export const saveSale = async (sale: Sale): Promise<Sale> => {
  try {
    await setDoc(doc(db, 'sales', sale.id), sale);
    return sale;
  } catch (error) {
    console.error("Error saving sale:", error);
    throw error;
  }
};

export const deleteSale = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'sales', id));
  } catch (error) {
    console.error("Error deleting sale:", error);
    throw error;
  }
};

// --- EXPENSES SERVICE ---
export const getExpenses = async (): Promise<Expense[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'expenses'));
    return querySnapshot.docs.map(doc => doc.data() as Expense);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return [];
  }
};

export const saveExpense = async (expense: Expense): Promise<Expense> => {
  try {
    await setDoc(doc(db, 'expenses', expense.id), expense);
    return expense;
  } catch (error) {
    console.error("Error saving expense:", error);
    throw error;
  }
};

export const deleteExpense = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'expenses', id));
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw error;
  }
};

// --- DAILY STATE SERVICE ---
export const getDailyStates = async (): Promise<Record<string, DayState>> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'days'));
    const days: Record<string, DayState> = {};
    querySnapshot.forEach((doc) => {
      days[doc.id] = doc.data() as DayState;
    });
    return days;
  } catch (error) {
    console.error("Error fetching daily states:", error);
    return {};
  }
};

export const saveDayState = async (date: string, state: DayState): Promise<void> => {
  try {
    await setDoc(doc(db, 'days', date), state);
  } catch (error) {
    console.error("Error saving day state:", error);
    throw error;
  }
};
