import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Branch, Employee, UserRight, AttendanceRecord, SupabaseConfig } from './types';
import schemaSql from './schema.sql?raw';
import seedSql from './seed.sql?raw';

/**
 * ชั้นข้อมูลของแอป: Supabase เป็นแหล่งข้อมูลเดียว (single source of truth)
 * - อ่าน/เขียนทีละแถว (ไม่ upsert ทั้งอาร์เรย์) เพื่อไม่ให้หลายเครื่องเขียนทับกัน
 * - ทุกฟังก์ชันจะ throw เมื่อฐานข้อมูลตอบ error เพื่อให้ UI แจ้งผู้ใช้ได้
 * - Realtime: subscribeToChanges() ส่งการเปลี่ยนแปลงจากทุกเครื่องมาให้แอป
 * localStorage ยังใช้เก็บเฉพาะ "ค่าเชื่อมต่อ Supabase" (URL/key) เท่านั้น ไม่ใช่ข้อมูลของระบบ
 */

const CONFIG_KEY = 'novasol_supabase_config';

// คีย์ localStorage เดิม (ใช้เฉพาะตอนย้ายข้อมูลเก่าขึ้นฐานข้อมูล)
const LEGACY_KEYS = {
  branches: 'novasol_branches',
  employees: 'novasol_employees',
  userRights: 'novasol_user_rights',
  attendance: 'novasol_attendance_records',
} as const;

const T = {
  branches: 'ns_branches',
  employees: 'ns_employees',
  userRights: 'ns_user_rights',
  attendance: 'ns_attendance_records',
} as const;

const DEFAULT_SUPABASE_URL = 'https://fcqkppjtsgnbrimtwzrs.supabase.co';

let supabaseClient: SupabaseClient | null = null;

// ---------------------------------------------------------------------------
// Config & client
// ---------------------------------------------------------------------------
export function sanitizeSupabaseUrl(url: string): string {
  if (!url) return '';
  let cleanUrl = url.trim();
  cleanUrl = cleanUrl.replace(/\/rest\/v1\/?$/, '');
  cleanUrl = cleanUrl.replace(/\/+$/, '');
  return cleanUrl;
}

export function getStoredSupabaseConfig(): SupabaseConfig {
  const envUrl = sanitizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL || '');
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.url) {
        const anonKey = parsed.anonKey || envKey;
        return {
          url: sanitizeSupabaseUrl(parsed.url),
          anonKey,
          isConnected: Boolean(anonKey),
        };
      }
    }
  } catch {
    // ใช้ค่าจาก env ต่อ
  }

  const url = envUrl || DEFAULT_SUPABASE_URL;
  return { url, anonKey: envKey, isConnected: Boolean(url && envKey) };
}

function buildClient(url: string, anonKey: string): SupabaseClient | null {
  if (!url || !anonKey) return null;
  try {
    return createClient(sanitizeSupabaseUrl(url), anonKey, {
      // แอปไม่ใช้ Supabase Auth จึงไม่ต้องเก็บ session ไว้ใน localStorage
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      realtime: { params: { eventsPerSecond: 10 } },
    });
  } catch (e) {
    console.warn('Failed to initialize Supabase client:', e);
    return null;
  }
}

export function saveSupabaseConfig(config: SupabaseConfig) {
  const cleanUrl = sanitizeSupabaseUrl(config.url);
  localStorage.setItem(CONFIG_KEY, JSON.stringify({ ...config, url: cleanUrl }));
  if (supabaseClient) {
    supabaseClient.removeAllChannels();
  }
  supabaseClient = buildClient(cleanUrl, config.anonKey);
}

// สร้าง client ตอนโหลดโมดูล
const initialConfig = getStoredSupabaseConfig();
supabaseClient = buildClient(initialConfig.url, initialConfig.anonKey);

export function isSupabaseConfigured(): boolean {
  return supabaseClient !== null;
}

function db(): SupabaseClient {
  if (!supabaseClient) {
    throw new Error('ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase (URL / Anon Key)');
  }
  return supabaseClient;
}

export function errorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
}

export async function checkSupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  if (!supabaseClient) {
    return { ok: false, message: 'ยังไม่ได้กรอก URL หรือ Anon Key' };
  }
  const { error } = await supabaseClient.from(T.branches).select('id', { head: true, count: 'exact' });
  if (!error) return { ok: true, message: 'เชื่อมต่อฐานข้อมูลสำเร็จ พบตาราง ns_* ครบ' };
  if (error.code === '42P01' || error.code === 'PGRST205') {
    return { ok: false, message: 'เชื่อมต่อได้ แต่ยังไม่ได้สร้างตาราง ns_* — ให้รัน SQL Script ด้านล่างใน Supabase SQL Editor ก่อน' };
  }
  return { ok: false, message: `เชื่อมต่อไม่สำเร็จ: ${error.message}` };
}

// ---------------------------------------------------------------------------
// Mappers  (camelCase ในแอป  <->  snake_case ในฐานข้อมูล)
// ---------------------------------------------------------------------------
type Row = Record<string, any>;

/** '' / undefined -> null สำหรับเขียนลงฐานข้อมูล */
const toDb = <V,>(v: V | undefined | null): V | null => (v === undefined || (v as unknown) === '' ? null : (v as V));
/** null -> undefined สำหรับอ่านเข้าแอป */
const fromDb = <V,>(v: V | null | undefined): V | undefined => (v === null ? undefined : v);

const branchToRow = (b: Branch): Row => ({
  id: b.id,
  name: b.name,
  type: b.type,
  latitude: b.latitude,
  longitude: b.longitude,
  radius_meters: b.radiusMeters,
  address: toDb(b.address),
  phone: toDb(b.phone),
  work_start_time: toDb(b.workStartTime),
  work_end_time: toDb(b.workEndTime),
  late_threshold_minutes: toDb(b.lateThresholdMinutes),
});
const rowToBranch = (r: Row): Branch => ({
  id: r.id,
  name: r.name,
  type: r.type,
  latitude: r.latitude,
  longitude: r.longitude,
  radiusMeters: r.radius_meters,
  address: fromDb(r.address),
  phone: fromDb(r.phone),
  workStartTime: fromDb(r.work_start_time),
  workEndTime: fromDb(r.work_end_time),
  lateThresholdMinutes: fromDb(r.late_threshold_minutes),
});

const employeeToRow = (e: Employee): Row => ({
  id: e.id,
  emp_code: e.empCode,
  full_name: e.fullName,
  branch_id: toDb(e.branchId),
  pin: e.pin,
  status: e.status,
  position: toDb(e.position),
  department: toDb(e.department),
  phone: toDb(e.phone),
  email: toDb(e.email),
  avatar_url: toDb(e.avatarUrl),
  joined_date: toDb(e.joinedDate),
});
const rowToEmployee = (r: Row): Employee => ({
  id: r.id,
  empCode: r.emp_code,
  fullName: r.full_name,
  branchId: r.branch_id ?? '',
  pin: r.pin,
  status: r.status,
  position: r.position ?? '',
  department: fromDb(r.department),
  phone: fromDb(r.phone),
  email: fromDb(r.email),
  avatarUrl: fromDb(r.avatar_url),
  joinedDate: r.joined_date ?? '',
});

const userRightToRow = (u: UserRight): Row => ({
  id: u.id,
  username: u.username,
  full_name: u.fullName,
  role: u.role,
  password: toDb(u.password),
  employee_id: toDb(u.employeeId),
  branch_scope: toDb(u.branchScope) ?? 'all',
  can_manage_users: Boolean(u.canManageUsers),
  can_manage_employees: Boolean(u.canManageEmployees),
  can_manage_branches: Boolean(u.canManageBranches),
  can_generate_qr: Boolean(u.canGenerateQr),
  can_export_reports: Boolean(u.canExportReports),
});
const rowToUserRight = (r: Row): UserRight => ({
  id: r.id,
  username: r.username,
  fullName: r.full_name,
  role: r.role,
  password: fromDb(r.password),
  employeeId: fromDb(r.employee_id),
  branchScope: fromDb(r.branch_scope),
  canManageUsers: Boolean(r.can_manage_users),
  canManageEmployees: Boolean(r.can_manage_employees),
  canManageBranches: Boolean(r.can_manage_branches),
  canGenerateQr: Boolean(r.can_generate_qr),
  canExportReports: Boolean(r.can_export_reports),
});

const recordToRow = (a: AttendanceRecord): Row => ({
  id: a.id,
  employee_id: a.employeeId,
  employee_name: a.employeeName,
  branch_id: a.branchId,
  branch_name: a.branchName,
  date: a.date,
  time_in: toDb(a.timeIn),
  time_out: toDb(a.timeOut),
  selfie_in_url: toDb(a.selfieInUrl),
  selfie_out_url: toDb(a.selfieOutUrl),
  latitude_in: toDb(a.latitudeIn),
  longitude_in: toDb(a.longitudeIn),
  latitude_out: toDb(a.latitudeOut),
  longitude_out: toDb(a.longitudeOut),
  distance_in_meters: a.distanceInMeters == null ? null : Math.round(a.distanceInMeters),
  distance_out_meters: a.distanceOutMeters == null ? null : Math.round(a.distanceOutMeters),
  is_within_radius_in: toDb(a.isWithinRadiusIn),
  is_within_radius_out: toDb(a.isWithinRadiusOut),
  status: a.status,
  notes: toDb(a.notes),
  is_adjusted_by_admin: toDb(a.isAdjustedByAdmin),
  admin_adjust_reason: toDb(a.adminAdjustReason),
  adjusted_by_admin_name: toDb(a.adjustedByAdminName),
  adjusted_at: toDb(a.adjustedAt),
});
const rowToRecord = (r: Row): AttendanceRecord => ({
  id: r.id,
  employeeId: r.employee_id,
  employeeName: r.employee_name,
  branchId: r.branch_id,
  branchName: r.branch_name,
  date: r.date,
  timeIn: fromDb(r.time_in),
  timeOut: fromDb(r.time_out),
  selfieInUrl: fromDb(r.selfie_in_url),
  selfieOutUrl: fromDb(r.selfie_out_url),
  latitudeIn: fromDb(r.latitude_in),
  longitudeIn: fromDb(r.longitude_in),
  latitudeOut: fromDb(r.latitude_out),
  longitudeOut: fromDb(r.longitude_out),
  distanceInMeters: fromDb(r.distance_in_meters),
  distanceOutMeters: fromDb(r.distance_out_meters),
  isWithinRadiusIn: fromDb(r.is_within_radius_in),
  isWithinRadiusOut: fromDb(r.is_within_radius_out),
  status: r.status,
  notes: fromDb(r.notes),
  isAdjustedByAdmin: fromDb(r.is_adjusted_by_admin),
  adminAdjustReason: fromDb(r.admin_adjust_reason),
  adjustedByAdminName: fromDb(r.adjusted_by_admin_name),
  adjustedAt: fromDb(r.adjusted_at),
});

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------
/** อ่านทุกแถวแบบแบ่งหน้า (PostgREST จำกัด 1,000 แถว/ครั้ง) */
async function fetchAllRows(
  table: string,
  orderBy: { column: string; ascending: boolean },
  pageSize = 500
): Promise<Row[]> {
  const all: Row[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await db()
      .from(table)
      .select('*')
      .order(orderBy.column, { ascending: orderBy.ascending })
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    all.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return all;
}

async function upsertRow(table: string, row: Row): Promise<void> {
  const { error } = await db().from(table).upsert(row, { onConflict: 'id' });
  if (error) throw error;
}

async function upsertRows(table: string, rows: Row[], chunkSize: number): Promise<void> {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const { error } = await db().from(table).upsert(rows.slice(i, i + chunkSize), { onConflict: 'id' });
    if (error) throw error;
  }
}

async function deleteById(table: string, id: string): Promise<void> {
  const { error } = await db().from(table).delete().eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export const fetchBranches = async (): Promise<Branch[]> =>
  (await fetchAllRows(T.branches, { column: 'created_at', ascending: true })).map(rowToBranch);
export const saveBranch = (b: Branch) => upsertRow(T.branches, branchToRow(b));
export const deleteBranchFromStore = (id: string) => deleteById(T.branches, id);

export const fetchEmployees = async (): Promise<Employee[]> =>
  (await fetchAllRows(T.employees, { column: 'created_at', ascending: false })).map(rowToEmployee);
export const saveEmployee = (e: Employee) => upsertRow(T.employees, employeeToRow(e));
export const deleteEmployeeFromStore = (id: string) => deleteById(T.employees, id);

export const fetchUserRights = async (): Promise<UserRight[]> =>
  (await fetchAllRows(T.userRights, { column: 'created_at', ascending: true })).map(rowToUserRight);
export const saveUserRight = (u: UserRight) => upsertRow(T.userRights, userRightToRow(u));
export const deleteUserRightFromStore = (id: string) => deleteById(T.userRights, id);

export const fetchAttendanceRecords = async (): Promise<AttendanceRecord[]> =>
  (await fetchAllRows(T.attendance, { column: 'created_at', ascending: false }, 200)).map(rowToRecord);
export const saveAttendanceRecord = (a: AttendanceRecord) => upsertRow(T.attendance, recordToRow(a));
export const deleteAttendanceRecordFromStore = (id: string) => deleteById(T.attendance, id);

export async function deleteMultipleAttendanceRecordsFromStore(ids: string[]): Promise<void> {
  if (!ids || ids.length === 0) return;
  for (let i = 0; i < ids.length; i += 200) {
    const { error } = await db().from(T.attendance).delete().in('id', ids.slice(i, i + 200));
    if (error) throw error;
  }
}

export async function clearAllAttendanceRecordsFromStore(branchId?: string): Promise<void> {
  let q = db().from(T.attendance).delete();
  q = branchId && branchId !== 'all' ? q.eq('branch_id', branchId) : q.not('id', 'is', null);
  const { error } = await q;
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Realtime
// ---------------------------------------------------------------------------
export interface ChangeEvent<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  item?: T; // INSERT / UPDATE
  id?: string; // DELETE
}

export interface RealtimeHandlers {
  onBranches: (e: ChangeEvent<Branch>) => void;
  onEmployees: (e: ChangeEvent<Employee>) => void;
  onUserRights: (e: ChangeEvent<UserRight>) => void;
  onAttendance: (e: ChangeEvent<AttendanceRecord>) => void;
  /** 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED' */
  onStatus?: (status: string) => void;
}

function toEvent<T>(payload: any, map: (r: Row) => T): ChangeEvent<T> {
  if (payload.eventType === 'DELETE') {
    return { eventType: 'DELETE', id: payload.old?.id };
  }
  return { eventType: payload.eventType, item: map(payload.new) };
}

/** เริ่มรับการเปลี่ยนแปลงแบบสดของทุกตาราง คืนฟังก์ชันสำหรับยกเลิก */
export function subscribeToChanges(h: RealtimeHandlers): () => void {
  const client = supabaseClient;
  if (!client) return () => {};

  const channel = client
    .channel(`novasol-live-${Math.random().toString(36).slice(2, 8)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: T.branches }, (p) =>
      h.onBranches(toEvent(p, rowToBranch))
    )
    .on('postgres_changes', { event: '*', schema: 'public', table: T.employees }, (p) =>
      h.onEmployees(toEvent(p, rowToEmployee))
    )
    .on('postgres_changes', { event: '*', schema: 'public', table: T.userRights }, (p) =>
      h.onUserRights(toEvent(p, rowToUserRight))
    )
    .on('postgres_changes', { event: '*', schema: 'public', table: T.attendance }, (p) =>
      h.onAttendance(toEvent(p, rowToRecord))
    )
    .subscribe((status) => h.onStatus?.(status));

  return () => {
    client.removeChannel(channel);
  };
}

/** นำเหตุการณ์ realtime ไปใช้กับ state (ทำซ้ำได้ ไม่เกิดรายการซ้ำ) */
export function applyChange<T extends { id: string }>(
  list: T[],
  e: ChangeEvent<T>,
  newItemPosition: 'start' | 'end'
): T[] {
  if (e.eventType === 'DELETE') {
    return e.id ? list.filter((x) => x.id !== e.id) : list;
  }
  const item = e.item;
  if (!item) return list;
  const i = list.findIndex((x) => x.id === item.id);
  if (i >= 0) {
    const next = [...list];
    next[i] = item;
    return next;
  }
  return newItemPosition === 'start' ? [item, ...list] : [...list, item];
}

// ---------------------------------------------------------------------------
// ย้ายข้อมูลเก่าใน localStorage ขึ้นฐานข้อมูล (ทำครั้งเดียว)
// ---------------------------------------------------------------------------
export interface LegacyLocalData {
  branches: Branch[];
  employees: Employee[];
  userRights: UserRight[];
  attendance: AttendanceRecord[];
}

const DEMO_ATTENDANCE_ID = /^att-today-\d+$/;

function readLegacyList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function readLegacyLocalData(): LegacyLocalData {
  return {
    branches: readLegacyList<Branch>(LEGACY_KEYS.branches),
    employees: readLegacyList<Employee>(LEGACY_KEYS.employees),
    userRights: readLegacyList<UserRight>(LEGACY_KEYS.userRights),
    // ข้ามรายการลงเวลาตัวอย่างที่แอปเวอร์ชันเก่าสร้างให้อัตโนมัติ
    attendance: readLegacyList<AttendanceRecord>(LEGACY_KEYS.attendance).filter(
      (r) => !DEMO_ATTENDANCE_ID.test(r.id)
    ),
  };
}

export function countLegacyLocalData(): LegacyLocalData & { total: number } {
  const d = readLegacyLocalData();
  return { ...d, total: d.branches.length + d.employees.length + d.userRights.length + d.attendance.length };
}

export async function migrateLegacyLocalData(): Promise<{
  branches: number;
  employees: number;
  userRights: number;
  attendance: number;
}> {
  const d = readLegacyLocalData();
  // ลำดับ: สาขา -> พนักงาน -> ผู้ใช้ -> ลงเวลา
  await upsertRows(T.branches, d.branches.map(branchToRow), 100);
  await upsertRows(T.employees, d.employees.map(employeeToRow), 100);
  await upsertRows(T.userRights, d.userRights.map(userRightToRow), 100);
  await upsertRows(T.attendance, d.attendance.map(recordToRow), 25);
  return {
    branches: d.branches.length,
    employees: d.employees.length,
    userRights: d.userRights.length,
    attendance: d.attendance.length,
  };
}

export function clearLegacyLocalData(): void {
  Object.values(LEGACY_KEYS).forEach((k) => localStorage.removeItem(k));
  localStorage.removeItem('novasol_logged_in_user_id');
}

/** SQL สำหรับสร้างตาราง + Realtime + ข้อมูลตั้งต้น (ไฟล์เดียวกับใน supabase/) */
export const SUPABASE_SQL_SCHEMA = `${schemaSql.trim()}\n\n${seedSql.trim()}\n`;
