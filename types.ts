export type Role = 'admin' | 'supervisor' | 'staff';

export type EmployeeStatus = 'active' | 'terminated';

export type BranchType = 'hq' | 'sub';

export type AttendanceType = 'in' | 'out';

export interface Branch {
  id: string;
  name: string;
  type: BranchType; // 'hq' = สำนักงานใหญ่, 'sub' = สาขาย่อย
  latitude: number;
  longitude: number;
  radiusMeters: number; // e.g., 100 meters
  address?: string;
  phone?: string;
}

export interface Employee {
  id: string;
  empCode: string; // e.g. NS-001
  fullName: string;
  branchId: string;
  pin: string; // 4 digits e.g. "1234"
  status: EmployeeStatus; // 'active' = ทำงานอยู่, 'terminated' = เลิกจ้างแล้ว
  position: string;
  department?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  joinedDate: string;
}

export interface UserRight {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  employeeId?: string; // linked employee if applicable
  branchScope?: string; // 'all' or branchId
  canManageUsers: boolean;
  canManageEmployees: boolean;
  canManageBranches: boolean;
  canGenerateQr: boolean;
  canExportReports: boolean;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  branchId: string;
  branchName: string;
  date: string; // YYYY-MM-DD
  timeIn?: string; // HH:mm:ss
  timeOut?: string; // HH:mm:ss
  selfieInUrl?: string; // Base64 or image URL
  selfieOutUrl?: string; // Base64 or image URL
  latitudeIn?: number;
  longitudeIn?: number;
  latitudeOut?: number;
  longitudeOut?: number;
  distanceInMeters?: number;
  distanceOutMeters?: number;
  isWithinRadiusIn?: boolean;
  isWithinRadiusOut?: boolean;
  status: 'present' | 'late' | 'early_leave' | 'absent';
  notes?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}

export interface DailyReportSummary {
  date: string;
  totalEmployees: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  clockInCount: number;
  clockOutCount: number;
}
