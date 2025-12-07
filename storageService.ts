
import { Promoter, SaleRecord, SaleStatus, Floor, ComplaintRecord, FeedbackRecord } from '../types';

// --- LOCAL STORAGE DATABASE ---
// This service now uses LocalStorage exclusively to ensure the app works 
// immediately without requiring external Firebase configuration.

const STORAGE_KEYS = {
  PROMOTERS: 'pp_promoters',
  SALES: 'pp_sales',
  FLOORS: 'pp_floors',
  COMPLAINTS: 'pp_complaints',
  FEEDBACKS: 'pp_feedbacks',
  SETTINGS: 'pp_settings',
};

// Initial Mock Data
const INITIAL_PROMOTERS: Promoter[] = [
  { id: 'p1', name: 'Alice Johnson', assignedFloors: ['Ground Floor - Main Entrance'] },
  { id: 'p2', name: 'Bob Smith', assignedFloors: ['1st Floor - Food Court'] },
];
const INITIAL_FLOORS: Floor[] = [
  { id: 'f1', name: 'Ground Floor - Main Entrance' },
  { id: 'f2', name: '1st Floor - Food Court' },
  { id: 'f3', name: '2nd Floor - Arcade Zone' },
];

// --- HELPER METHODS ---

const getLocal = <T>(key: string, defaultData: T[] = []): T[] => {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
        // Initialize with default data if empty
        if (defaultData.length > 0) {
            localStorage.setItem(key, JSON.stringify(defaultData));
            return defaultData;
        }
        return [];
    }
    return JSON.parse(item);
  } catch {
    return defaultData;
  }
};

const setLocal = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("LocalStorage Write Error:", e);
    alert("Storage full! Please clear some data.");
  }
};

// --- SERVICE METHODS ---

// Promoters
export const getPromoters = async (): Promise<Promoter[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(getLocal(STORAGE_KEYS.PROMOTERS, INITIAL_PROMOTERS)), 100);
  });
};

export const addPromoter = async (item: Promoter) => {
  const list = getLocal<Promoter>(STORAGE_KEYS.PROMOTERS, INITIAL_PROMOTERS);
  list.push(item);
  setLocal(STORAGE_KEYS.PROMOTERS, list);
};

export const updatePromoter = async (item: Promoter) => {
  const list = getLocal<Promoter>(STORAGE_KEYS.PROMOTERS, INITIAL_PROMOTERS);
  const idx = list.findIndex(p => p.id === item.id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...item };
    setLocal(STORAGE_KEYS.PROMOTERS, list);
  }
};

export const deletePromoter = async (id: string) => {
  let list = getLocal<Promoter>(STORAGE_KEYS.PROMOTERS, INITIAL_PROMOTERS);
  list = list.filter(p => p.id !== id);
  setLocal(STORAGE_KEYS.PROMOTERS, list);
};

// Floors
export const getFloors = async (): Promise<Floor[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(getLocal(STORAGE_KEYS.FLOORS, INITIAL_FLOORS)), 100);
  });
};

export const addFloor = async (item: Floor) => {
  const list = getLocal<Floor>(STORAGE_KEYS.FLOORS, INITIAL_FLOORS);
  list.push(item);
  setLocal(STORAGE_KEYS.FLOORS, list);
};

export const deleteFloor = async (id: string) => {
  let list = getLocal<Floor>(STORAGE_KEYS.FLOORS, INITIAL_FLOORS);
  list = list.filter(i => i.id !== id);
  setLocal(STORAGE_KEYS.FLOORS, list);
};

// Sales
export const getSales = async (): Promise<SaleRecord[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(getLocal(STORAGE_KEYS.SALES, [])), 100);
  });
};

export const addSale = async (item: SaleRecord) => {
  const list = getLocal<SaleRecord>(STORAGE_KEYS.SALES, []);
  list.push(item);
  setLocal(STORAGE_KEYS.SALES, list);
};

export const updateSaleStatus = async (id: string, status: SaleStatus) => {
  const list = getLocal<SaleRecord>(STORAGE_KEYS.SALES, []);
  const idx = list.findIndex(s => s.id === id);
  if (idx !== -1) {
    list[idx].status = status;
    setLocal(STORAGE_KEYS.SALES, list);
  }
};

// Complaints
export const getComplaints = async (): Promise<ComplaintRecord[]> => {
  return new Promise((resolve) => {
     setTimeout(() => resolve(getLocal(STORAGE_KEYS.COMPLAINTS, [])), 100);
  });
};

export const addComplaint = async (item: ComplaintRecord) => {
  const list = getLocal<ComplaintRecord>(STORAGE_KEYS.COMPLAINTS, []);
  list.push(item);
  setLocal(STORAGE_KEYS.COMPLAINTS, list);
};

export const updateComplaint = async (item: ComplaintRecord) => {
  const list = getLocal<ComplaintRecord>(STORAGE_KEYS.COMPLAINTS, []);
  const idx = list.findIndex(c => c.id === item.id);
  if (idx !== -1) {
    list[idx] = item;
    setLocal(STORAGE_KEYS.COMPLAINTS, list);
  }
};

// Feedbacks
export const getFeedbacks = async (): Promise<FeedbackRecord[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(getLocal(STORAGE_KEYS.FEEDBACKS, [])), 100);
  });
};

export const addFeedback = async (item: FeedbackRecord) => {
  const list = getLocal<FeedbackRecord>(STORAGE_KEYS.FEEDBACKS, []);
  list.push(item);
  setLocal(STORAGE_KEYS.FEEDBACKS, list);
};

// Settings (Logo)
export const getLogo = async (): Promise<string | null> => {
  const settings = getLocal<any>(STORAGE_KEYS.SETTINGS, [{}]);
  return settings[0]?.logoUrl || null;
};

export const saveLogo = async (url: string) => {
  setLocal(STORAGE_KEYS.SETTINGS, [{ logoUrl: url }]);
};

// --- DATA MANAGEMENT (BACKUP/RESTORE) ---

export const getAllData = () => {
  return {
    promoters: getLocal(STORAGE_KEYS.PROMOTERS, INITIAL_PROMOTERS),
    floors: getLocal(STORAGE_KEYS.FLOORS, INITIAL_FLOORS),
    sales: getLocal(STORAGE_KEYS.SALES, []),
    complaints: getLocal(STORAGE_KEYS.COMPLAINTS, []),
    feedbacks: getLocal(STORAGE_KEYS.FEEDBACKS, []),
    settings: getLocal(STORAGE_KEYS.SETTINGS, [{}])
  };
};

export const restoreData = (data: any) => {
  if (data.promoters) setLocal(STORAGE_KEYS.PROMOTERS, data.promoters);
  if (data.floors) setLocal(STORAGE_KEYS.FLOORS, data.floors);
  if (data.sales) setLocal(STORAGE_KEYS.SALES, data.sales);
  if (data.complaints) setLocal(STORAGE_KEYS.COMPLAINTS, data.complaints);
  if (data.feedbacks) setLocal(STORAGE_KEYS.FEEDBACKS, data.feedbacks);
  if (data.settings) setLocal(STORAGE_KEYS.SETTINGS, data.settings);
};

export const generateId = () => Math.random().toString(36).substr(2, 9);

// Always returns true now as we are using LocalStorage
export const getDbStatus = () => true;
