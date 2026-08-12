import React, { useState, useEffect } from 'react';
import {
  Branch,
  Employee,
  UserRight,
  AttendanceRecord,
  SupabaseConfig,
} from './types';
import {
  fetchBranches,
  saveBranches,
  fetchEmployees,
  saveEmployees,
  fetchUserRights,
  saveUserRights,
  fetchAttendanceRecords,
  saveAttendanceRecords,
  getStoredSupabaseConfig,
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

  // Application Data States
  const [branches, setBranches] = useState<Branch[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [userRights, setUserRights] = useState<UserRight[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getStoredSupabaseConfig());

  // Active Context & Filters
  const [currentUser, setCurrentUser] = useState<UserRight | null>(null);
  const [activeBranchFilter, setActiveBranchFilter] = useState<string>('all');

  // Modal Controls
  const [isClockInModalOpen, setIsClockInModalOpen] = useState(false);
  const [clockInDefaultBranchId, setClockInDefaultBranchId] = useState<string | undefined>(undefined);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load Data on startup
  useEffect(() => {
    async function loadAllData() {
      const b = await fetchBranches();
      const e = await fetchEmployees();
      const u = await fetchUserRights();
      const a = await fetchAttendanceRecords();

      setBranches(b);
      setEmployees(e);
      setUserRights(u);
      setAttendanceRecords(a);

      // Default active user is admin
      if (u.length > 0) {
        setCurrentUser(u[0]);
      }
    }
    loadAllData();
  }, []);

  // --- Handlers for Data Mutations ---
  const handleSaveEmployee = async (emp: Employee) => {
    const existingIndex = employees.findIndex((e) => e.id === emp.id);
    let updated: Employee[];
    if (existingIndex >= 0) {
      updated = [...employees];
      updated[existingIndex] = emp;
    } else {
      updated = [emp, ...employees];
    }
    setEmployees(updated);
    await saveEmployees(updated);
  };

  const handleDeleteEmployee = async (empId: string) => {
    const updated = employees.filter((e) => e.id !== empId);
    setEmployees(updated);
    await saveEmployees(updated);
  };

  const handleSaveBranch = async (branch: Branch) => {
    const existingIndex = branches.findIndex((b) => b.id === branch.id);
    let updated: Branch[];
    if (existingIndex >= 0) {
      updated = [...branches];
      updated[existingIndex] = branch;
    } else {
      updated = [...branches, branch];
    }
    setBranches(updated);
    await saveBranches(updated);
  };

  const handleDeleteBranch = async (branchId: string) => {
    const updated = branches.filter((b) => b.id !== branchId);
    setBranches(updated);
    await saveBranches(updated);
  };

  const handleSaveUserRight = async (user: UserRight) => {
    const existingIndex = userRights.findIndex((u) => u.id === user.id);
    let updated: UserRight[];
    if (existingIndex >= 0) {
      updated = [...userRights];
      updated[existingIndex] = user;
    } else {
      updated = [...userRights, user];
    }
    setUserRights(updated);
    await saveUserRights(updated);
  };

  const handleDeleteUserRight = async (userId: string) => {
    const updated = userRights.filter((u) => u.id !== userId);
    setUserRights(updated);
    await saveUserRights(updated);
  };

  const handleSaveAttendanceRecord = async (rec: AttendanceRecord) => {
    const existingIndex = attendanceRecords.findIndex((r) => r.id === rec.id);
    let updated: AttendanceRecord[];
    if (existingIndex >= 0) {
      updated = [...attendanceRecords];
      updated[existingIndex] = rec;
    } else {
      updated = [rec, ...attendanceRecords];
    }
    setAttendanceRecords(updated);
    await saveAttendanceRecords(updated);
  };

  const handleDeleteAttendanceRecord = async (recId: string) => {
    const updated = attendanceRecords.filter((r) => r.id !== recId);
    setAttendanceRecords(updated);
    await saveAttendanceRecords(updated);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-300">กำลังโหลดระบบลงเวลาเข้า-ออกงาน โนวาโซล...</p>
        </div>
      </div>
    );
  }

  // Permission Checks according to Requirement #2, #3, #8
  const canManageEmployees = currentUser.role === 'admin' || currentUser.canManageEmployees;
  const canManageBranches = currentUser.role === 'admin' || currentUser.canManageBranches;
  const canManageUsers = currentUser.role === 'admin' || currentUser.canManageUsers;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard สรุปภาพรวม', icon: LayoutDashboard },
    { id: 'employees', label: 'จัดการพนักงาน', icon: Users, badge: employees.length },
    { id: 'branches', label: 'ตั้งค่าสาขา & GPS', icon: Building2, badge: branches.length },
    { id: 'permissions', label: 'ตั้งค่าผู้ใช้งาน & สิทธิ', icon: Shield },
    { id: 'map', label: 'แผนที่ปักหมุดสาขา', icon: MapPin },
    { id: 'attendance', label: 'ประวัติลงเวลาเข้า-ออก', icon: Clock },
    { id: 'qrcode', label: 'สร้าง QR Code สาขา', icon: QrCode },
    { id: 'reports', label: 'พิมพ์รายงาน PDF เงินเดือน', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        onChangeUser={setCurrentUser}
        allUsers={userRights}
        supabaseConfig={supabaseConfig}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        branches={branches}
        activeBranchFilter={activeBranchFilter}
        onChangeBranchFilter={setActiveBranchFilter}
        onQuickClockIn={() => {
          setClockInDefaultBranchId(undefined);
          setIsClockInModalOpen(true);
        }}
      />

      {/* Main Container */}
      <div className="max-w-7xl w-full mx-auto px-4 py-5 flex-1 flex flex-col md:flex-row gap-5">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 shrink-0 space-y-3 no-print">
          <div className="bg-[#1e293b] text-slate-300 rounded-xl border border-slate-800/90 shadow-sm overflow-hidden flex flex-col">
            {/* Sidebar Branding header */}
            <div className="p-4 border-b border-slate-800/80 flex items-center space-x-3 bg-slate-900/40">
              <div className="w-9 h-9 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-black text-lg shrink-0 shadow-xs">
                N
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-white font-bold text-sm leading-tight tracking-tight">
                  NOVASOL
                </span>
                <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-semibold">
                  Time Tracking
                </span>
              </div>
              <div className="md:hidden ml-auto">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-1.5 rounded-md bg-slate-800 text-slate-300 cursor-pointer"
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
              <div className="text-[10px] uppercase font-bold text-slate-500 px-2 pt-1 pb-2 tracking-wider">
                CORE OPERATIONS
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
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600/20 text-white font-bold border-l-2 border-indigo-400'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isActive ? 'bg-indigo-400' : 'bg-slate-600'
                        }`}
                      ></div>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                      <span className="truncate text-xs">{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isActive
                            ? 'bg-indigo-500/30 text-indigo-200'
                            : 'bg-slate-800 text-slate-400'
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
            <div className="p-3 border-t border-slate-800/80 bg-slate-900/50">
              <div className="flex items-center space-x-3 p-2 bg-slate-800/60 rounded-lg">
                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                  {currentUser.fullName.slice(0, 2)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white truncate">
                    {currentUser.fullName}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate uppercase">
                    {currentUser.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Station Card */}
          <div className="bg-[#1e293b] text-white p-4 rounded-xl shadow-sm border border-slate-800 space-y-3 no-print">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-400" />
              <div>
                <div className="font-bold text-xs">จุดลงเวลาประจำวัน</div>
                <div className="text-[10px] text-slate-400">สแกน QR / GPS 100m / Selfie</div>
              </div>
            </div>

            <button
              onClick={() => {
                setClockInDefaultBranchId(undefined);
                setIsClockInModalOpen(true);
              }}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-md shadow-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5"
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
                setClockInDefaultBranchId(undefined);
                setIsClockInModalOpen(true);
              }}
            />
          )}

          {activeTab === 'employees' && (
            <EmployeeManagement
              employees={employees}
              branches={branches}
              onSaveEmployee={handleSaveEmployee}
              onDeleteEmployee={handleDeleteEmployee}
              canEdit={canManageEmployees}
            />
          )}

          {activeTab === 'branches' && (
            <BranchManagement
              branches={branches}
              onSaveBranch={handleSaveBranch}
              onDeleteBranch={handleDeleteBranch}
              canEdit={canManageBranches}
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
              currentUser={currentUser}
              onDeleteRecord={handleDeleteAttendanceRecord}
            />
          )}

          {activeTab === 'qrcode' && (
            <QrCodeManager
              branches={branches}
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
        />
      )}

      {/* Supabase & Deployment Config Modal */}
      {isSupabaseModalOpen && (
        <SupabaseSettingsModal
          config={supabaseConfig}
          onUpdateConfig={(cfg) => setSupabaseConfig(cfg)}
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
