import React, { useState, useEffect, useCallback } from 'react';
import {
  Branch,
  Employee,
  UserRight,
  AttendanceRecord,
  SupabaseConfig,
} from './types';
import {
  fetchBranches,
  saveBranch,
  deleteBranchFromStore,
  fetchEmployees,
  saveEmployee,
  deleteEmployeeFromStore,
  fetchUserRights,
  saveUserRight,
  deleteUserRightFromStore,
  fetchAttendanceRecords,
  saveAttendanceRecord,
  deleteAttendanceRecordFromStore,
  deleteMultipleAttendanceRecordsFromStore,
  clearAllAttendanceRecordsFromStore,
  getStoredSupabaseConfig,
  isSupabaseConfigured,
  subscribeToChanges,
  applyChange,
  errorMessage,
} from './lib/supabase';

// Components
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { EmployeeManagement } from './components/EmployeeManagement';
import { BranchManagement } from './components/BranchManagement';
import { UserPermissionSettings } from './components/UserPermissionSettings';
import { BranchMap } from './components/BranchMap';
import { AttendanceTable } from './components/AttendanceTable';
import { QrCodeManager } from './components/QrCodeManager';
import { ReportGenerator } from './components/ReportGenerator';
import { CheckInOutModal } from './components/CheckInOutModal';
import { SupabaseSettingsModal } from './components/SupabaseSettingsModal';
import { LoginScreen } from './components/LoginScreen';

// Icons
import {
  LayoutDashboard,
  Users,
  Building2,
  Shield,
  MapPin,
  Clock,
  QrCode,
  FileText,
  Database,
  Menu,
  X,
  UserCheck,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'employees'
    | 'branches'
    | 'permissions'
    | 'map'
    | 'attendance'
    | 'qrcode'
    | 'reports'
  >('dashboard');

  // URL Query Params Check (Requirement 5: QR Code scan brings employee directly to login/clockin)
  const [urlBranchId, setUrlBranchId] = useState<string | undefined>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('branchId') || undefined;
    }
    return undefined;
  });

  const [initialTabFromUrl, setInitialTabFromUrl] = useState<'login' | 'employee'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'employee' || params.get('branchId')) {
        return 'employee';
      }
    }
    return 'login';
  });

  // Application Data States
  const [branches, setBranches] = useState<Branch[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [userRights, setUserRights] = useState<UserRight[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getStoredSupabaseConfig());

  // Active Context & Authentication
  const [currentUser, setCurrentUser] = useState<UserRight | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const [realtimeStatus, setRealtimeStatus] = useState<string>('CONNECTING');
  const [activeBranchFilter, setActiveBranchFilter] = useState<string>('all');

  // Modal Controls
  const [isClockInModalOpen, setIsClockInModalOpen] = useState(false);
  const [clockInDefaultBranchId, setClockInDefaultBranchId] = useState<string | undefined>(urlBranchId);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // โหลดข้อมูลทั้งหมดจากฐานข้อมูล (Supabase คือแหล่งข้อมูลเดียว)
  const loadAll = useCallback(async () => {
    const [b, e, u, a] = await Promise.all([
      fetchBranches(),
      fetchEmployees(),
      fetchUserRights(),
      fetchAttendanceRecords(),
    ]);
    setBranches(b);
    setEmployees(e);
    setUserRights(u);
    setAttendanceRecords(a);
  }, []);

  // โหลดตอนเริ่มต้น และโหลดใหม่เมื่อเปลี่ยนค่าเชื่อมต่อ Supabase
  useEffect(() => {
    let cancelled = false;
    async function init() {
      setIsLoading(true);
      setDbError(null);
      try {
        if (!isSupabaseConfigured()) {
          throw new Error('ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase (URL / Anon Key)');
        }
        await loadAll();
        // เคลียร์ค่าล็อกอินเก่าที่เคยเก็บไว้ในเครื่อง
        localStorage.removeItem('novasol_logged_in_user_id');
      } catch (err) {
        if (!cancelled) setDbError(errorMessage(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [supabaseConfig.url, supabaseConfig.anonKey, retryTick, loadAll]);

  // Realtime: รับการเปลี่ยนแปลงจากทุกเครื่องทันที
  useEffect(() => {
    if (isLoading || dbError || !isSupabaseConfigured()) return;

    let firstSubscribe = true;
    const unsubscribe = subscribeToChanges({
      onBranches: (ev) => setBranches((prev) => applyChange(prev, ev, 'end')),
      onEmployees: (ev) => setEmployees((prev) => applyChange(prev, ev, 'start')),
      onUserRights: (ev) => setUserRights((prev) => applyChange(prev, ev, 'end')),
      onAttendance: (ev) => setAttendanceRecords((prev) => applyChange(prev, ev, 'start')),
      onStatus: (status) => {
        setRealtimeStatus(status);
        if (status === 'SUBSCRIBED') {
          // ต่อใหม่หลังหลุด (เช่น เน็ตหลุด/พับหน้าจอมือถือ) -> ดึงข้อมูลล่าสุดกันข้อมูลตกหล่น
          if (firstSubscribe) firstSubscribe = false;
          else loadAll().catch((e) => console.warn('Resync failed:', e));
        }
      },
    });

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        loadAll().catch((e) => console.warn('Resync failed:', e));
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      unsubscribe();
    };
  }, [isLoading, dbError, supabaseConfig.url, supabaseConfig.anonKey, loadAll]);

  // ถ้าสิทธิ์ของผู้ที่ล็อกอินอยู่ถูกแก้/ลบจากเครื่องอื่น ให้อัปเดตทันที
  useEffect(() => {
    if (!currentUser || currentUser.id.startsWith('usr-emp-') || userRights.length === 0) return;
    const fresh = userRights.find((u) => u.id === currentUser.id);
    if (!fresh) {
      handleLogout();
    } else if (JSON.stringify(fresh) !== JSON.stringify(currentUser)) {
      setCurrentUser(fresh);
    }
  }, [userRights]);

  // Sync Branch Scope when currentUser changes (Requirement 3)
  useEffect(() => {
    if (
      currentUser &&
      currentUser.role !== 'admin' &&
      currentUser.branchScope &&
      currentUser.branchScope !== 'all'
    ) {
      setActiveBranchFilter(currentUser.branchScope);
      setClockInDefaultBranchId(currentUser.branchScope);
    }
  }, [currentUser]);

  // Login Success Handler
  const handleLoginSuccess = (user: UserRight) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    if (user.role !== 'admin' && user.branchScope && user.branchScope !== 'all') {
      setActiveBranchFilter(user.branchScope);
      setClockInDefaultBranchId(user.branchScope);
    }
  };

  // Logout Handler - Completely clear any session/credential traces
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    sessionStorage.clear();
    setActiveBranchFilter('all');
  };

  // บันทึกลงฐานข้อมูล: ถ้าไม่สำเร็จให้แจ้งผู้ใช้และดึงข้อมูลจริงกลับมา (คืน true เมื่อสำเร็จ)
  const persist = async (action: () => Promise<void>, what: string): Promise<boolean> => {
    try {
      await action();
      return true;
    } catch (err) {
      console.error(`Save failed (${what}):`, err);
      alert(
        `ไม่สามารถ${what}ลงฐานข้อมูลได้: ${errorMessage(err)}\n` +
          'ระบบจะโหลดข้อมูลล่าสุดจากฐานข้อมูลกลับมาแทน กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่'
      );
      try {
        await loadAll();
      } catch (reloadErr) {
        console.warn('Reload after failed save also failed:', reloadErr);
      }
      return false;
    }
  };

  // Update Password Handler
  const handleUpdatePassword = async (username: string, newPass: string): Promise<boolean> => {
    const target = userRights.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (!target) return false;

    const updatedUser: UserRight = { ...target, password: newPass };
    const ok = await persist(() => saveUserRight(updatedUser), 'เปลี่ยนรหัสผ่าน');
    if (!ok) return false;

    setUserRights((prev) => applyChange(prev, { eventType: 'UPDATE', item: updatedUser }, 'end'));
    if (currentUser && currentUser.username.toLowerCase() === username.toLowerCase()) {
      setCurrentUser(updatedUser);
    }
    return true;
  };

  // Employee Quick Clock In from Login Gate (Requirement 1 & 5)
  const handleEmployeeQuickClockIn = (employee: Employee, branchId?: string) => {
    const targetBranch = branchId || employee.branchId || branches[0]?.id;

    let staffUser = userRights.find((u) => u.employeeId === employee.id);
    if (!staffUser) {
      staffUser = {
        id: `usr-emp-${employee.id}`,
        username: employee.empCode.toLowerCase(),
        fullName: employee.fullName,
        role: 'staff',
        employeeId: employee.id,
        branchScope: targetBranch,
        canManageUsers: false,
        canManageEmployees: false,
        canManageBranches: false,
        canGenerateQr: false,
        canExportReports: false,
      };
    }
    setCurrentUser(staffUser);
    setIsLoggedIn(true);
    setClockInDefaultBranchId(targetBranch);
    setIsClockInModalOpen(true);
  };

  // --- Handlers for Data Mutations (บันทึกทีละแถว + realtime แจ้งเครื่องอื่นให้อัตโนมัติ) ---
  const handleSaveEmployee = async (emp: Employee) => {
    setEmployees((prev) => applyChange(prev, { eventType: 'UPDATE', item: emp }, 'start'));
    await persist(() => saveEmployee(emp), 'บันทึกข้อมูลพนักงาน');
  };

  const handleDeleteEmployee = async (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    await persist(() => deleteEmployeeFromStore(id), 'ลบพนักงาน');
  };

  const handleSaveBranch = async (br: Branch) => {
    setBranches((prev) => applyChange(prev, { eventType: 'UPDATE', item: br }, 'end'));
    await persist(() => saveBranch(br), 'บันทึกข้อมูลสาขา');
  };

  const handleDeleteBranch = async (id: string) => {
    setBranches((prev) => prev.filter((b) => b.id !== id));
    await persist(() => deleteBranchFromStore(id), 'ลบสาขา');
  };

  const handleSaveUserRight = async (user: UserRight) => {
    setUserRights((prev) => applyChange(prev, { eventType: 'UPDATE', item: user }, 'end'));
    await persist(() => saveUserRight(user), 'บันทึกสิทธิ์ผู้ใช้งาน');
  };

  const handleDeleteUserRight = async (id: string) => {
    setUserRights((prev) => prev.filter((u) => u.id !== id));
    await persist(() => deleteUserRightFromStore(id), 'ลบผู้ใช้งาน');
  };

  const handleSaveAttendanceRecord = async (rec: AttendanceRecord): Promise<boolean> => {
    setAttendanceRecords((prev) => applyChange(prev, { eventType: 'UPDATE', item: rec }, 'start'));
    return persist(() => saveAttendanceRecord(rec), 'บันทึกเวลาเข้า-ออกงาน');
  };

  const handleDeleteAttendanceRecord = async (id: string) => {
    setAttendanceRecords((prev) => prev.filter((r) => r.id !== id));
    await persist(() => deleteAttendanceRecordFromStore(id), 'ลบรายการลงเวลา');
  };

  const handleDeleteMultipleAttendanceRecords = async (ids: string[]) => {
    const idSet = new Set(ids);
    setAttendanceRecords((prev) => prev.filter((r) => !idSet.has(r.id)));
    await persist(() => deleteMultipleAttendanceRecordsFromStore(ids), 'ลบรายการลงเวลา');
  };

  const handleClearAllAttendanceRecords = async (branchId?: string) => {
    setAttendanceRecords((prev) =>
      branchId && branchId !== 'all' ? prev.filter((r) => r.branchId !== branchId) : []
    );
    await persist(() => clearAllAttendanceRecordsFromStore(branchId), 'ล้างประวัติลงเวลา');
  };

  // Permission Checks according to Requirement #2, #3, #8 & Strict Role Scoping (Called unconditionally at top level)
  const isStaff = currentUser?.role === 'staff';
  const isBranchRestricted =
    Boolean(
      currentUser &&
        currentUser.role !== 'admin' &&
        currentUser.branchScope &&
        currentUser.branchScope !== 'all'
    );
  const userBranchId = isBranchRestricted ? currentUser?.branchScope || 'all' : 'all';

  const visibleEmployees = isBranchRestricted
    ? employees.filter((e) => e.branchId === userBranchId)
    : employees;
  const visibleBranches = isBranchRestricted
    ? branches.filter((b) => b.id === userBranchId)
    : branches;

  const canManageEmployees =
    currentUser?.role === 'admin' || (!isStaff && Boolean(currentUser?.canManageEmployees));
  const canManageBranches =
    currentUser?.role === 'admin' || (!isStaff && Boolean(currentUser?.canManageBranches));
  const canManageUsers = currentUser?.role === 'admin' || Boolean(currentUser?.canManageUsers);
  const canGenerateQr =
    currentUser?.role === 'admin' || (!isStaff && Boolean(currentUser?.canGenerateQr));
  const canExportReports =
    currentUser?.role === 'admin' || (!isStaff && Boolean(currentUser?.canExportReports));

  // Requirement: Staff only sees permitted menus, distinct from Admin
  const navItems = [
    {
      id: 'dashboard',
      label: isStaff ? 'หน้าหลัก (ลงเวลา)' : 'Dashboard สรุปภาพรวม',
      icon: LayoutDashboard,
    },
    ...(canManageEmployees
      ? [
          {
            id: 'employees',
            label: isBranchRestricted ? 'จัดการพนักงานในสาขา' : 'จัดการพนักงาน',
            icon: Users,
            badge: visibleEmployees.length,
          },
        ]
      : []),
    ...(canManageBranches
      ? [
          {
            id: 'branches',
            label: isBranchRestricted ? 'เวลาทำงานสาขาของฉัน' : 'ตั้งค่าสาขา & เวลาทำงาน',
            icon: Building2,
            badge: visibleBranches.length,
          },
        ]
      : []),
    ...(canManageUsers
      ? [{ id: 'permissions', label: 'ตั้งค่าผู้ใช้งาน & สิทธิ', icon: Shield }]
      : []),
    {
      id: 'map',
      label: isStaff ? 'แผนที่สาขาของฉัน' : 'แผนที่ปักหมุดสาขา',
      icon: MapPin,
    },
    {
      id: 'attendance',
      label: isStaff ? 'ประวัติลงเวลาของฉัน' : 'ประวัติลงเวลาเข้า-ออก',
      icon: Clock,
    },
    ...(canGenerateQr
      ? [{ id: 'qrcode', label: 'สร้าง QR Code สาขา', icon: QrCode }]
      : []),
    ...(canExportReports
      ? [{ id: 'reports', label: 'พิมพ์รายงาน PDF เงินเดือน', icon: FileText }]
      : []),
  ];

  // Auto fallback if user switches or current activeTab is not allowed for role
  useEffect(() => {
    if (!currentUser) return;
    const allowedIds = navItems.map((n) => n.id);
    if (!allowedIds.includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [currentUser?.role, currentUser?.branchScope, activeTab]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-600">กำลังโหลดระบบลงเวลาเข้า-ออกงาน โนวาโซล...</p>
        </div>
      </div>
    );
  }

  // เชื่อมต่อฐานข้อมูลไม่ได้: ไม่ใช้ข้อมูลในเครื่องแทน เพราะจะทำให้ข้อมูลแต่ละเครื่องไม่ตรงกัน
  if (dbError) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-rose-200 rounded-2xl shadow-sm p-6 space-y-4 text-center">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <h1 className="font-bold text-base">เชื่อมต่อฐานข้อมูลไม่สำเร็จ</h1>
          <p className="text-xs text-slate-600 break-words">{dbError}</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setRetryTick((n) => n + 1)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> ลองใหม่
            </button>
            <button
              onClick={() => setIsSupabaseModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
            >
              ตั้งค่าการเชื่อมต่อ
            </button>
          </div>
        </div>
        {isSupabaseModalOpen && (
          <SupabaseSettingsModal
            config={supabaseConfig}
            onUpdateConfig={(cfg) => setSupabaseConfig(cfg)}
            onClose={() => setIsSupabaseModalOpen(false)}
          />
        )}
      </div>
    );
  }

  // Mandatory Login Gate Before Entering Application
  if (!isLoggedIn || !currentUser) {
    return (
      <LoginScreen
        userRights={userRights}
        employees={employees}
        branches={branches}
        initialTab={initialTabFromUrl}
        initialBranchId={urlBranchId}
        onLoginSuccess={handleLoginSuccess}
        onUpdatePassword={handleUpdatePassword}
        onEmployeeQuickClockIn={handleEmployeeQuickClockIn}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        supabaseConfig={{ ...supabaseConfig, isConnected: realtimeStatus === 'SUBSCRIBED' }}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        branches={branches}
        activeBranchFilter={activeBranchFilter}
        onChangeBranchFilter={setActiveBranchFilter}
        onQuickClockIn={() => {
          setClockInDefaultBranchId(
            currentUser.branchScope && currentUser.branchScope !== 'all'
              ? currentUser.branchScope
              : undefined
          );
          setIsClockInModalOpen(true);
        }}
        onLogout={handleLogout}
        onOpenPasswordModal={() => {
          if (currentUser.role === 'admin') {
            setActiveTab('permissions');
          }
        }}
      />

      {/* Main Container */}
      <div className="max-w-7xl w-full mx-auto px-4 py-5 flex-1 flex flex-col md:flex-row gap-5">
        {/* Navigation Sidebar (Daylight Theme with Chakra Petch) */}
        <aside className="w-full md:w-64 shrink-0 space-y-3 no-print">
          <div className="bg-white text-slate-800 rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
            {/* Sidebar Branding header */}
            <div className="p-4 border-b border-slate-100 flex items-center space-x-3 bg-slate-50/70">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg shrink-0 shadow-xs">
                N
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-slate-900 font-bold text-sm leading-tight tracking-tight">
                  NOVASOL
                </span>
                <span className="text-[10px] uppercase tracking-widest text-indigo-600 font-bold">
                  Time Tracking
                </span>
              </div>
              <div className="md:hidden ml-auto">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-1.5 rounded-lg bg-slate-100 text-slate-700 cursor-pointer"
                >
                  {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <nav
              className={`p-3 space-y-1 text-xs font-medium ${
                isMobileMenuOpen ? 'block' : 'hidden md:block'
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-slate-400 px-2 pt-1 pb-2 tracking-wider">
                เมนูหลักของระบบ
              </div>

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-bold border-l-3 border-indigo-600'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isActive ? 'bg-indigo-600' : 'bg-slate-300'
                        }`}
                      ></div>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span className="truncate text-xs">{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isActive
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Sidebar Bottom User Profile */}
            <div className="p-3 border-t border-slate-100 bg-slate-50/50">
              <div className="flex items-center space-x-3 p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold uppercase">
                  {currentUser.fullName.slice(0, 2)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {currentUser.fullName}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate uppercase font-semibold">
                    {currentUser.role === 'admin'
                      ? 'ผู้ดูแลระบบ (Admin)'
                      : currentUser.role === 'supervisor'
                      ? 'หัวหน้าสาขา'
                      : 'พนักงาน'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Station Card */}
          <div className="bg-white text-slate-900 p-4 rounded-2xl shadow-2xs border border-slate-200/90 space-y-3 no-print">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs">จุดลงเวลาประจำวัน</div>
                <div className="text-[10px] text-slate-500">สแกน QR / GPS รัศมี / Selfie</div>
              </div>
            </div>

            <button
              onClick={() => {
                setClockInDefaultBranchId(
                  currentUser.branchScope && currentUser.branchScope !== 'all'
                    ? currentUser.branchScope
                    : undefined
                );
                setIsClockInModalOpen(true);
              }}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>กดลงเวลาเข้า-ออกงาน</span>
            </button>
          </div>
        </aside>

        {/* Main Workspace Content Panel */}
        <main className="flex-1 min-w-0">
          {activeTab === 'dashboard' && (
            <Dashboard
              branches={branches}
              employees={employees}
              attendanceRecords={attendanceRecords}
              activeBranchFilter={activeBranchFilter}
              onSelectTab={(tabId) => setActiveTab(tabId as any)}
              onOpenClockIn={() => {
                setClockInDefaultBranchId(
                  currentUser.branchScope && currentUser.branchScope !== 'all'
                    ? currentUser.branchScope
                    : undefined
                );
                setIsClockInModalOpen(true);
              }}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'employees' && (
            <EmployeeManagement
              employees={employees}
              branches={branches}
              onSaveEmployee={handleSaveEmployee}
              onDeleteEmployee={handleDeleteEmployee}
              canEdit={canManageEmployees}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'branches' && (
            <BranchManagement
              branches={branches}
              onSaveBranch={handleSaveBranch}
              onDeleteBranch={handleDeleteBranch}
              canEdit={canManageBranches}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'permissions' && (
            <UserPermissionSettings
              userRights={userRights}
              employees={employees}
              branches={branches}
              onSaveUserRight={handleSaveUserRight}
              onDeleteUserRight={handleDeleteUserRight}
              canEdit={canManageUsers}
            />
          )}

          {activeTab === 'map' && (
            <BranchMap
              branches={branches}
              employees={employees}
              attendanceRecords={attendanceRecords}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceTable
              records={attendanceRecords}
              branches={branches}
              employees={employees}
              currentUser={currentUser}
              onSaveRecord={handleSaveAttendanceRecord}
              onDeleteRecord={handleDeleteAttendanceRecord}
              onDeleteMultipleRecords={handleDeleteMultipleAttendanceRecords}
              onClearAllRecords={handleClearAllAttendanceRecords}
            />
          )}

          {activeTab === 'qrcode' && (
            <QrCodeManager
              branches={branches}
              currentUser={currentUser}
              onOpenCheckInForBranch={(branchId) => {
                setClockInDefaultBranchId(branchId);
                setIsClockInModalOpen(true);
              }}
            />
          )}

          {activeTab === 'reports' && (
            <ReportGenerator
              records={attendanceRecords}
              employees={employees}
              branches={branches}
              currentUser={currentUser}
            />
          )}
        </main>
      </div>

      {/* Clock In/Out Modal */}
      {isClockInModalOpen && (
        <CheckInOutModal
          branches={branches}
          employees={employees}
          attendanceRecords={attendanceRecords}
          onSaveRecord={handleSaveAttendanceRecord}
          onClose={() => setIsClockInModalOpen(false)}
          defaultBranchId={clockInDefaultBranchId}
          currentUser={currentUser}
        />
      )}

      {/* Supabase & Deployment Config Modal */}
      {isSupabaseModalOpen && (
        <SupabaseSettingsModal
          config={supabaseConfig}
          onUpdateConfig={(cfg) => setSupabaseConfig(cfg)}
          onDataMigrated={() => loadAll().catch((e) => console.warn(e))}
          onClose={() => setIsSupabaseModalOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-slate-500 text-xs text-center space-y-1 no-print">
        <div className="flex items-center justify-center gap-2 font-bold text-slate-700">
          <img
            src="https://i.postimg.cc/FHGkmGKB/NOVASOL-1/logo.png"
            alt="NOVASOL Logo"
            className="h-5 w-auto object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <span>ห้างหุ้นส่วนจำกัด โนวาโซล (NOVASOL Ltd.)</span>
        </div>
        <p className="text-[11px] text-slate-400">
          สงวนลิขสิทธิ์ © {new Date().getFullYear()} NOVASOL Ltd. — ระบบลงเวลาเข้า-ออกงาน
          (QR Code, Selfie & GPS Radius Geofence)
        </p>
      </footer>
    </div>
  );
}
