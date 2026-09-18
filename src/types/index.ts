export interface User {
  id: string;
  username: string;
  role: 'admin' | 'supervisor' | 'auditor' | 'cashier';
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  is_default: boolean;
  created_at: string;
}

export interface Output {
  id: string;
  number: string;
  date: string;
  category_id: string;
  category_name: string;
  description: string;
  amount: number;
  currency: string;
  responsible: string;
  payment_mode: string;
  reference: string;
  observation: string;
  created_by: string;
  created_by_username: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_by_username?: string;
  approved_at?: string;
  rejection_reason?: string;
}

export interface CashBalance {
  initial_balance: number;
  current_balance: number;
  total_entries: number;
  total_outputs: number;
}

export interface CashEntry {
  id: string;
  date: string;
  amount: number;
  description: string;
  created_by: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  date: string;
  time: string;
  user_id: string;
  username: string;
  role: string;
  action: string;
  element: string;
  output_number: string | null;
  old_value: string | null;
  new_value: string | null;
}

export interface CompanySettings {
  id: string;
  name: string;
  logo_path: string | null;
  address: string;
  phone: string;
  email: string;
  currency: string;
  updated_at: string;
}

export interface DashboardStats {
  today_total: number;
  week_total: number;
  month_total: number;
  year_total: number;
  general_total: number;
  current_balance: number;
  output_count: number;
  categories: Array<{
    name: string;
    count: number;
    total: number;
  }>;
}

export interface ReportData {
  outputs: Output[];
  total: number;
  count: number;
}
