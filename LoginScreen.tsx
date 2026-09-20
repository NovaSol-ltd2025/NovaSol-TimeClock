import React, { useState, useEffect } from 'react';
import { UserRight, Employee, Branch } from './types';
import {
  Lock,
  User,
  KeyRound,
  ArrowRight,
  UserCheck,
  Building2,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  QrCode,
  Sparkles,
} from 'lucide-react';

interface LoginScreenProps {
  userRights: UserRight[];
  employees: Employee[];
  branches: Branch[];
  initialTab?: 'login' | 'employee';
  initialBranchId?: string;
  onLoginSuccess: (user: UserRight) => void;
  onUpdatePassword?: (username: string, newPass: string) => Promise<boolean>;
  onEmployeeQuickClockIn: (employee: Employee, branchId?: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  userRights,
  employees,
  branches,
  initialTab = 'login',
  initialBranchId,
  onLoginSuccess,
  onEmployeeQuickClockIn,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'employee'>(initialTab);

  // Login Form States (Admin / Supervisor)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccessMsg, setLoginSuccessMsg] = useState('');

  // Employee Code Input States (Requirement 1)
  const [empCodeInput, setEmpCodeInput] = useState('');
  const [matchedEmployee, setMatchedEmployee] = useState<Employee | null>(null);
  const [empPin, setEmpPin] = useState('');
  const [empError, setEmpError] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    initialBranchId || (branches[0]?.id ?? '')
  );

  // Clear all sensitive form inputs on mount to prevent any lingering state
  useEffect(() => {
    setUsername('');
    setPassword('');
    setEmpCodeInput('');
    setEmpPin('');
    setMatchedEmployee(null);
    setLoginError('');
    setEmpError('');
  }, []);

  // Set initial tab if passed
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // If initialBranchId passed from QR scan or query string
  useEffect(() => {
    if (initialBranchId) {
      setSelectedBranchId(initialBranchId);
      setActiveTab('employee');
    }
  }, [initialBranchId]);

  // Real-time lookup as employee types their Employee ID (e.g. NS02-006, NS-001)
  useEffect(() => {
    const raw = empCodeInput.trim().toUpperCase();
    if (!raw) {
      setMatchedEmployee(null);
      return;
    }

    // Clean comparison: handle with or without hyphens
    const cleanRaw = raw.replace(/[^A-Z0-9]/g, '');
    const found = employees.find((e) => {
      const eCode = e.empCode.toUpperCase();
      const cleanECode = eCode.replace(/[^A-Z0-9]/g, '');
      return eCode === raw || cleanECode === cleanRaw || e.id.toUpperCase() === raw;
    });

    if (found) {
      setMatchedEmployee(found);
      setEmpError('');
      // If branch not set by QR, adopt employee's branch
      if (!initialBranchId && found.branchId) {
        setSelectedBranchId(found.branchId);
      }
    } else {
      setMatchedEmployee(null);
    }
  }, [empCodeInput, employees, initialBranchId]);

  // Handle Admin / System User Login
  const handleSystemLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSuccessMsg('');

    if (!username.trim()) {
      setLoginError('กรุณากรอกชื่อผู้ใช้งาน (Username)');
      return;
    }

    if (!password) {
      setLoginError('กรุณากรอกรหัสผ่าน (Password)');
      return;
    }

    const foundUser = userRights.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (!foundUser) {
      setLoginError('ไม่พบชื่อผู้ใช้งานนี้ในระบบ');
      return;
    }

    const expectedPassword =
      foundUser.password || (foundUser.role === 'admin' ? 'admin123' : '123456');

    if (password !== expectedPassword) {
      setLoginError('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
      return;
    }

    setLoginSuccessMsg('เข้าสู่ระบบสำเร็จ กำลังนำคุณเข้าสู่ระบบ...');
    setTimeout(() => {
      onLoginSuccess(foundUser);
    }, 400);
  };

  // Handle Employee Quick Clock In Login by Employee Code & PIN
  const handleEmployeeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setEmpError('');

    const raw = empCodeInput.trim();
    if (!raw) {
      setEmpError('กรุณากรอกรหัสพนักงาน เช่น NS02-006 หรือ NS-001');
      return;
    }

    if (!matchedEmployee) {
      setEmpError(`ไม่พบรหัสพนักงาน "${raw}" ในระบบ กรุณาตรวจสอบรหัสอีกครั้ง`);
      return;
    }

    if (matchedEmployee.status !== 'active') {
      setEmpError('พนักงานท่านนี้ไม่ได้อยู่ในสถานะปฏิบัติงาน (Inactive/Terminated)');
      return;
    }

    if (!empPin || empPin.length !== 4) {
      setEmpError('กรุณากรอกรหัส PIN 4 หลักของพนักงาน');
      return;
    }

    if (matchedEmployee.pin !== empPin) {
      setEmpError('รหัส PIN 4 หลักไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
      return;
    }

    // Success -> proceed to clock in
    onEmployeeQuickClockIn(matchedEmployee, selectedBranchId);
  };

  const currentScannedBranch = branches.find((b) => b.id === selectedBranchId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-slate-50 to-indigo-50/40 text-slate-800 flex flex-col justify-between relative overflow-hidden">
      {/* Background Subtle Daylight Accents */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Navbar Header - Clean Daylight Theme */}
      <header className="relative z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="bg-white p-1.5 rounded-xl shadow-xs border border-slate-200 flex items-center justify-center">
            <img
              src="https://i.postimg.cc/FHGkmGKB/NOVASOL-1/logo.png"
              alt="NOVASOL Logo"
              className="h-8 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              ห้างหุ้นส่วนจำกัด โนวาโซล{' '}
              <span className="text-indigo-600 font-semibold">| NOVASOL Ltd.</span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              ระบบบันทึกเวลาปฏิบัติงานและบริหารพนักงาน (Time Clock System)
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100/90 px-3.5 py-1.5 rounded-xl border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>ระบบตรวจสอบ GPS & Selfie ป้องกันการลงเวลาแทนกัน</span>
        </div>
      </header>

      {/* Main Login Form Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden transition-all">
          {/* Header Banner inside Box */}
          <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-sky-600 p-6 text-white text-center relative shadow-sm">
            <div className="w-13 h-13 bg-white/15 border border-white/25 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
              {activeTab === 'login' ? (
                <Lock className="w-6 h-6 text-white" />
              ) : (
                <UserCheck className="w-6 h-6 text-white" />
              )}
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              {activeTab === 'login' ? 'เข้าสู่ระบบเจ้าหน้าที่' : 'ลงเวลาปฏิบัติงานพนักงาน'}
            </h2>
            <p className="text-xs text-indigo-100 mt-1">
              {activeTab === 'login'
                ? 'สำหรับผู้ดูแลระบบ (Admin) และหัวหน้าสาขา (Supervisor)'
                : 'กรอกรหัสพนักงานและรหัส PIN เพื่อเช็คอินเข้า-ออกงาน'}
            </p>

            {/* If accessed via branch QR code, show branch banner */}
            {currentScannedBranch && activeTab === 'employee' && (
              <div className="mt-3 inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-bold text-white border border-white/30">
                <Building2 className="w-3.5 h-3.5" />
                <span>สาขา: {currentScannedBranch.name}</span>
              </div>
            )}
          </div>

          {/* Navigation Tabs (Only Login & Employee, Password setup hidden as requested) */}
          <div className="grid grid-cols-2 bg-slate-100/80 p-1.5 border-b border-slate-200 text-xs font-bold text-slate-500">
            <button
              onClick={() => {
                setActiveTab('login');
                setLoginError('');
                setEmpCodeInput('');
                setEmpPin('');
                setMatchedEmployee(null);
                setEmpError('');
              }}
              className={`py-2.5 px-3 rounded-xl text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'login'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200 font-bold'
                  : 'hover:text-slate-800 hover:bg-slate-200/60'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>เข้าสู่ระบบเจ้าหน้าที่</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('employee');
                setEmpError('');
                setUsername('');
                setPassword('');
                setLoginError('');
                setLoginSuccessMsg('');
              }}
              className={`py-2.5 px-3 rounded-xl text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'employee'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200 font-bold'
                  : 'hover:text-slate-800 hover:bg-slate-200/60'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>สแกน/กรอกรหัสพนักงาน</span>
            </button>
          </div>

          <div className="p-6">
            {/* TAB 1: SYSTEM USER LOGIN (ADMIN / SUPERVISOR) */}
            {activeTab === 'login' && (
              <form onSubmit={handleSystemLogin} autoComplete="off" className="space-y-4">
                {loginError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span className="font-medium">{loginError}</span>
                  </div>
                )}

                {loginSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span className="font-medium">{loginSuccessMsg}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ชื่อผู้ใช้งาน (Username)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="กรอกชื่อผู้ใช้งานของคุณ"
                      autoComplete="off"
                      spellCheck={false}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-medium transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      รหัสผ่าน (Password)
                    </label>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="กรอกรหัสผ่านของคุณ"
                      autoComplete="new-password"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-medium transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  <span>เข้าสู่ระบบ (Sign In)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* TAB 2: EMPLOYEE TIME CLOCK (BY EMPLOYEE ID INPUT - REQ 1) */}
            {activeTab === 'employee' && (
              <form onSubmit={handleEmployeeLogin} autoComplete="off" className="space-y-4">
                {empError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span className="font-medium">{empError}</span>
                  </div>
                )}

                {/* Requirement 1: Change dropdown to "กรอกรหัสพนักงาน" เช่น NS02-006 */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-600" />
                      กรอกรหัสพนักงาน (Employee ID) <span className="text-rose-500">*</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      เช่น NS02-006 หรือ NS-001
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="empCode"
                      value={empCodeInput}
                      onChange={(e) => setEmpCodeInput(e.target.value)}
                      placeholder="กรอกรหัสพนักงาน เช่น NS02-006"
                      autoFocus
                      autoComplete="off"
                      spellCheck={false}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-mono font-bold uppercase placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
                    />
                    {matchedEmployee && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Matched Employee Profile Card Preview */}
                {matchedEmployee ? (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center gap-3 transition-all animate-fade-in">
                    {matchedEmployee.avatarUrl ? (
                      <img
                        src={matchedEmployee.avatarUrl}
                        alt={matchedEmployee.fullName}
                        className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-400 shadow-2xs shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-base shrink-0 border border-indigo-200">
                        {matchedEmployee.fullName.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                          {matchedEmployee.empCode}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                          พบพนักงานในระบบ
                        </span>
                      </div>
                      <div className="font-bold text-xs text-slate-800 truncate mt-0.5">
                        {matchedEmployee.fullName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {matchedEmployee.position} • {matchedEmployee.department || 'ปฏิบัติการ'}
                      </div>
                    </div>
                  </div>
                ) : empCodeInput.trim().length >= 3 ? (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>
                      ยังไม่พบรหัส "{empCodeInput.trim()}" ในระบบ (กรุณาตรวจเช็คตัวสะกด)
                    </span>
                  </div>
                ) : null}

                {/* Branch Selection: Displayed ONLY after employee identity is found/entered */}
                {matchedEmployee && (
                  <div className="transition-all animate-fade-in">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                        สาขาที่ต้องการลงเวลา
                      </span>
                      {currentScannedBranch?.workStartTime && (
                        <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          เข้างาน: {currentScannedBranch.workStartTime} - {currentScannedBranch.workEndTime} น.
                        </span>
                      )}
                    </label>
                    <select
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:bg-white focus:outline-hidden focus:border-indigo-600 cursor-pointer"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} (เวลา {b.workStartTime || '08:30'} - {b.workEndTime || '17:30'} น.)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* PIN Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                      รหัส PIN 4 หลักประจำตัว <span className="text-rose-500">*</span>
                    </span>
                  </label>
                  <input
                    type="password"
                    name="empPin"
                    maxLength={4}
                    value={empPin}
                    onChange={(e) => setEmpPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="•••• (ตัวเลข 4 หลัก)"
                    autoComplete="new-password"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-center font-mono font-bold text-lg tracking-widest text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>ยืนยันและเข้าสู่หน้าลงเวลาปฏิบัติงาน</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer - Daylight Theme */}
      <footer className="relative z-10 py-4 text-center text-xs text-slate-500 border-t border-slate-200/80 bg-white/70">
        <p className="font-medium">
          ห้างหุ้นส่วนจำกัด โนวาโซล (NOVASOL Ltd.) — ระบบลงเวลาปฏิบัติงานด้วย GPS, QR Code & Selfie
        </p>
      </footer>
    </div>
  );
};
