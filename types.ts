
export enum TicketType {
  KIDDO = 'Kiddo',
  EXTREME = 'Extreme',
  INDIVIDUAL = 'Individual',
  ENTRY_ONLY = 'Entry Only',
}

export enum SaleStatus {
  PENDING = 'Pending',
  VERIFIED = 'Verified',
  REJECTED = 'Rejected',
}

export interface CustomerData {
  name: string;
  mobile: string;
  email: string;
  location: string;
  age: number;
}

export interface SaleRecord {
  id: string;
  promoterId: string;
  promoterName: string;
  uniqueCode?: string; // Unique identifier for easy verification (Name + Mobile)
  customer: CustomerData;
  items: {
    [key in TicketType]?: number;
  };
  totalAmount: number; // calculated locally for display
  status: SaleStatus;
  timestamp: number;
  saleLocation?: string; // The floor/location where the sale occurred
}

export interface FeedbackRecord {
  id: string;
  promoterId: string;
  promoterName: string;
  customer: CustomerData;
  rating: number;
  comment: string;
  timestamp: number;
}

export interface Promoter {
  id: string;
  name: string;
  assignedFloors: string[];
  password?: string; // Password for BP login
}

export interface Floor {
  id: string;
  name: string;
}

export type UserRole = 'LEAD' | 'PROMOTER' | 'VERIFIER' | 'CUSTOMER_SERVICE';

// KPI Aggregation Type
export interface KPIStats {
  promoterId: string;
  totalKiddo: number;
  totalExtreme: number;
  totalIndividual: number;
  totalEntry: number;
  totalSalesLeads: number; // Count of records
  totalMailCollect: number; // Count of records with email
  revenue: number;
}

// Complaint Related Types
export enum ComplaintPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
}

export enum ComplaintStatus {
  OPEN = 'Open',
  IN_PROGRESS = 'In Progress',
  RESOLVED = 'Resolved',
}

export interface ComplaintRecord {
  id: string;
  timestamp: number;
  customerName: string;
  customerMobile: string;
  description: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  submittedBy: string; // 'Customer Service' or 'Team Lead'
  resolutionNotes?: string;
  resolvedAt?: number;
  attachmentUrl?: string; // Data URL for uploaded file
  isArchived?: boolean; // If true, hidden from main view but available in export
}
