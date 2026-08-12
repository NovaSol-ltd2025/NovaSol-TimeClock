import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Branch, Employee, UserRight, AttendanceRecord, SupabaseConfig } from '../types';
import {
  INITIAL_BRANCHES,
  INITIAL_EMPLOYEES,
  INITIAL_USER_RIGHTS,
  INITIAL_ATTENDANCE_RECORDS,
} from '../data/initialData';

const CONFIG_KEY = 'novasol_supabase_config';
const BRANCHES_KEY = 'novasol_branches';
const EMPLOYEES_KEY = 'novasol_employees';
const USER_RIGHTS_KEY = 'novasol_user_rights';
const ATTENDANCE_KEY = 'novasol_attendance_records';

// Built-in default connection to the NOVASOL Supabase project, so the app works
// out of the box with zero configuration. This is the public anon/publishable
// key, which is safe to ship in client code — access is enforced by Row Level
// Security policies on the database, not by keeping this key secret.
// Set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY at build time (e.g. Vercel
// project env vars) to point a deployment at a different Supabase project, or
// use the in-app Supabase settings modal to override at runtime.
const DEFAULT_SUPABASE_URL = 'https://bhglkhlzvctqmdjnrgum.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_52Zx_iCT0VPyoy9YOiUQFA_yDX7fpF8';

const ENV_SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const ENV_SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

let supabaseClient: SupabaseClient | null = null;

export function getStoredSupabaseConfig(): SupabaseConfig {
  const stored = localStorage.getItem(CONFIG_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    } catch {
      // fallback
    }
  }
  if (ENV_SUPABASE_URL && ENV_SUPABASE_ANON_KEY) {
    return {
      url: ENV_SUPABASE_URL,
      anonKey: ENV_SUPABASE_ANON_KEY,
      isConnected: true,
    };
  }
  return {
    url: '',
    anonKey: '',
    isConnected: false,
  };
}

export function saveSupabaseConfig(config: SupabaseConfig) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  if (config.url && config.anonKey) {
    try {
      supabaseClient = createClient(config.url, config.anonKey);
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
    }
  } else {
    supabaseClient = null;
  }
}

// Initial setup on load
const currentConfig = getStoredSupabaseConfig();
if (currentConfig.url && currentConfig.anonKey) {
  try {
    supabaseClient = createClient(currentConfig.url, currentConfig.anonKey);
  } catch (e) {
    console.warn('Supabase init error:', e);
  }
}

// Helper: Seed local storage if empty
export function initLocalStorageStore() {
  if (!localStorage.getItem(BRANCHES_KEY)) {
    localStorage.setItem(BRANCHES_KEY, JSON.stringify(INITIAL_BRANCHES));
  }
  if (!localStorage.getItem(EMPLOYEES_KEY)) {
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(INITIAL_EMPLOYEES));
  }
  if (!localStorage.getItem(USER_RIGHTS_KEY)) {
    localStorage.setItem(USER_RIGHTS_KEY, JSON.stringify(INITIAL_USER_RIGHTS));
  }
  if (!localStorage.getItem(ATTENDANCE_KEY)) {
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(INITIAL_ATTENDANCE_RECORDS));
  }
}

// --- BRANCHES API ---
export async function fetchBranches(): Promise<Branch[]> {
  initLocalStorageStore();
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('branches').select('*');
      if (!error && data) {
        return data as Branch[];
      }
    } catch (err) {
      console.warn('Supabase fetchBranches error, using fallback:', err);
    }
  }
  const raw = localStorage.getItem(BRANCHES_KEY);
  return raw ? JSON.parse(raw) : INITIAL_BRANCHES;
}

export async function saveBranches(branches: Branch[]): Promise<void> {
  localStorage.setItem(BRANCHES_KEY, JSON.stringify(branches));
  if (supabaseClient) {
    try {
      await supabaseClient.from('branches').upsert(branches);
    } catch (e) {
      console.warn('Supabase saveBranches error:', e);
    }
  }
}

// --- EMPLOYEES API ---
export async function fetchEmployees(): Promise<Employee[]> {
  initLocalStorageStore();
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('employees').select('*');
      if (!error && data) {
        return data as Employee[];
      }
    } catch (err) {
      console.warn('Supabase fetchEmployees error, using fallback:', err);
    }
  }
  const raw = localStorage.getItem(EMPLOYEES_KEY);
  return raw ? JSON.parse(raw) : INITIAL_EMPLOYEES;
}

export async function saveEmployees(employees: Employee[]): Promise<void> {
  localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
  if (supabaseClient) {
    try {
      await supabaseClient.from('employees').upsert(employees);
    } catch (e) {
      console.warn('Supabase saveEmployees error:', e);
    }
  }
}

// --- USER RIGHTS API ---
export async function fetchUserRights(): Promise<UserRight[]> {
  initLocalStorageStore();
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('user_rights').select('*');
      if (!error && data) {
        return data as UserRight[];
      }
    } catch (err) {
      console.warn('Supabase fetchUserRights error, using fallback:', err);
    }
  }
  const raw = localStorage.getItem(USER_RIGHTS_KEY);
  return raw ? JSON.parse(raw) : INITIAL_USER_RIGHTS;
}

export async function saveUserRights(rights: UserRight[]): Promise<void> {
  localStorage.setItem(USER_RIGHTS_KEY, JSON.stringify(rights));
  if (supabaseClient) {
    try {
      await supabaseClient.from('user_rights').upsert(rights);
    } catch (e) {
      console.warn('Supabase saveUserRights error:', e);
    }
  }
}

// --- ATTENDANCE RECORDS API ---
export async function fetchAttendanceRecords(): Promise<AttendanceRecord[]> {
  initLocalStorageStore();
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('attendance_records').select('*');
      if (!error && data) {
        return data as AttendanceRecord[];
      }
    } catch (err) {
      console.warn('Supabase fetchAttendanceRecords error, using fallback:', err);
    }
  }
  const raw = localStorage.getItem(ATTENDANCE_KEY);
  return raw ? JSON.parse(raw) : INITIAL_ATTENDANCE_RECORDS;
}

export async function saveAttendanceRecords(records: AttendanceRecord[]): Promise<void> {
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
  if (supabaseClient) {
    try {
      await supabaseClient.from('attendance_records').upsert(records);
    } catch (e) {
      console.warn('Supabase saveAttendanceRecords error:', e);
    }
  }
}

/**
 * Generates SQL query string for Supabase table initialization.
 */
export const SUPABASE_SQL_SCHEMA = `-- Script สร้างตารางสำหรับระบบลงเวลาเข้า-ออกงาน หจก.โนวาโซล (NOVASOL Ltd.)
-- หมายเหตุ: ชื่อคอลัมน์แบบ camelCase ต้องครอบด้วยเครื่องหมายคำพูดคู่ (double quotes)
-- มิฉะนั้น PostgreSQL จะแปลงเป็นตัวพิมพ์เล็กทั้งหมดโดยอัตโนมัติ ทำให้แอปอ่านข้อมูลไม่ตรงกับคอลัมน์

-- 1. ตารางสาขา (branches)
CREATE TABLE IF NOT EXISTS public.branches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'hq' หรือ 'sub'
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  "radiusMeters" INTEGER NOT NULL DEFAULT 100,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ตารางพนักงาน (employees)
CREATE TABLE IF NOT EXISTS public.employees (
  id TEXT PRIMARY KEY,
  "empCode" TEXT UNIQUE NOT NULL,
  "fullName" TEXT NOT NULL,
  "branchId" TEXT REFERENCES public.branches(id) ON DELETE SET NULL,
  pin VARCHAR(4) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active' หรือ 'terminated'
  position TEXT,
  department TEXT,
  phone TEXT,
  email TEXT,
  "avatarUrl" TEXT,
  "joinedDate" DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ตารางสิทธิการใช้งาน (user_rights)
CREATE TABLE IF NOT EXISTS public.user_rights (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  "fullName" TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff', -- 'admin', 'supervisor', 'staff'
  "employeeId" TEXT REFERENCES public.employees(id) ON DELETE SET NULL,
  "branchScope" TEXT DEFAULT 'all',
  "canManageUsers" BOOLEAN DEFAULT false,
  "canManageEmployees" BOOLEAN DEFAULT false,
  "canManageBranches" BOOLEAN DEFAULT false,
  "canGenerateQr" BOOLEAN DEFAULT false,
  "canExportReports" BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ตารางประวัติการลงเวลาเข้า-ออกงาน (attendance_records)
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id TEXT PRIMARY KEY,
  "employeeId" TEXT REFERENCES public.employees(id) ON DELETE CASCADE,
  "employeeName" TEXT NOT NULL,
  "branchId" TEXT REFERENCES public.branches(id) ON DELETE CASCADE,
  "branchName" TEXT NOT NULL,
  date DATE NOT NULL,
  "timeIn" TIME,
  "timeOut" TIME,
  "selfieInUrl" TEXT,
  "selfieOutUrl" TEXT,
  "latitudeIn" DOUBLE PRECISION,
  "longitudeIn" DOUBLE PRECISION,
  "latitudeOut" DOUBLE PRECISION,
  "longitudeOut" DOUBLE PRECISION,
  "distanceInMeters" INTEGER,
  "distanceOutMeters" INTEGER,
  "isWithinRadiusIn" BOOLEAN,
  "isWithinRadiusOut" BOOLEAN,
  status TEXT NOT NULL DEFAULT 'present',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- เปิดใช้งาน RLS และนโยบายสาธารณะสำหรับแอปพลิเคชัน
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public full access branches" ON public.branches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access employees" ON public.employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access user_rights" ON public.user_rights FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access attendance_records" ON public.attendance_records FOR ALL USING (true) WITH CHECK (true);
`;
