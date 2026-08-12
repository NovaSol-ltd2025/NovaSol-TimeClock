import React, { useState, useEffect } from 'react';
import { UserRight, SupabaseConfig, Branch } from '../types';
import { Clock, Shield, Building2, Database, UserCheck, LogOut, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  currentUser: UserRight;
  onChangeUser: (user: UserRight) => void;
  allUsers: UserRight[];
  supabaseConfig: SupabaseConfig;
  onOpenSupabaseModal: () => void;
  branches: Branch[];
  activeBranchFilter: string;
  onChangeBranchFilter: (branchId: string) => void;
  onQuickClockIn: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onChangeUser,
  allUsers,
  supabaseConfig,
  onOpenSupabaseModal,
  branches,
  activeBranchFilter,
  onChangeBranchFilter,
  onQuickClockIn,
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatThaiDateTime = (d: Date) => {
    const day = d.getDate();
    const monthNames = [
      'ม.ค.',
      'ก.พ.',
      'มี.ค.',
      'เม.ย.',
      'พ.ค.',
      'มิ.ย.',
      'ก.ค.',
      'ส.ค.',
      'ก.ย.',
      'ต.ค.',
      'พ.ย.',
      'ธ.ค.',
    ];
    const month = monthNames[d.getMonth()];
    const yearBE = d.getFullYear() + 543;
    const timeStr = d.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    return `${day} ${month} ${yearBE} | ${timeStr} น.`;
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top company info bar */}
      <div className="bg-[#1e293b] text-slate-300 px-4 py-1.5 text-xs flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 font-medium text-indigo-400">
            <Building2 className="w-3.5 h-3.5" />
            ห้างหุ้นส่วนจำกัด โนวาโซล (NOVASOL Ltd.)
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-slate-400 text-[11px]">
            ระบบบริหารจัดการเวลาเข้า-ออกงาน (GPS, Selfie & QR Code)
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Supabase status badge */}
          <button
            onClick={onOpenSupabaseModal}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold transition bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
            title="ตั้งค่าการ เชื่อมต่อ Supabase Database & Vercel Deployment"
          >
            <Database className="w-3 h-3 text-emerald-400" />
            <span>
              {supabaseConfig.isConnected ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Supabase Connected
                </span>
              ) : (
                <span className="text-amber-400 font-bold">Database Local Mode</span>
              )}
            </span>
          </button>

          {/* Clock Widget */}
          <div className="flex items-center gap-1.5 font-mono text-slate-200 bg-slate-800/90 px-2.5 py-0.5 rounded border border-slate-700 text-[11px]">
            <Clock className="w-3 h-3 text-indigo-400 animate-pulse" />
            <span>{formatThaiDateTime(time)}</span>
          </div>
        </div>
      </div>

      {/* Main Brand & Action Header */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-4">
        {/* Logo and Name */}
        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-lg shadow-xs border border-slate-200 flex items-center justify-center">
            <img
              src="https://i.postimg.cc/FHGkmGKB/NOVASOL-1/logo.png"
              alt="NOVASOL Logo"
              className="h-9 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                NOVASOL <span className="text-indigo-600 font-bold">TIME CLOCK</span>
              </h1>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                SYSTEM ONLINE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              ระบบลงเวลาเข้า-ออกงาน พนักงาน หจก.โนวาโซล
            </p>
          </div>
        </div>

        {/* Center/Right controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Branch Scoping Selector for Admin / Supervisor */}
          {currentUser.role !== 'staff' && (
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-md p-1">
              <Building2 className="w-4 h-4 text-slate-400 ml-2 mr-1" />
              <select
                value={activeBranchFilter}
                onChange={(e) => onChangeBranchFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-hidden pr-2 cursor-pointer"
              >
                <option value="all">🌐 แสดงทุกสาขา ({branches.length} สาขา)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.type === 'hq' ? '🏢' : '🏪'} {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Check In / Check Out Selfie & QR Button */}
          <button
            onClick={onQuickClockIn}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-md shadow-xs active:scale-98 transition-colors cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>ลงเวลาเข้า-ออกงาน (Selfie/GPS)</span>
          </button>

          {/* Role / User Switcher Simulator */}
          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-md border border-slate-200">
            <div className="flex items-center gap-1.5 pl-2 pr-1">
              <Shield className={`w-4 h-4 ${currentUser.role === 'admin' ? 'text-indigo-600' : 'text-amber-600'}`} />
              <div className="text-left">
                <div className="text-[11px] font-bold text-slate-800 leading-tight">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] text-slate-500 capitalize font-medium">
                  สิทธิ: {currentUser.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : currentUser.role === 'supervisor' ? 'หัวหน้าสาขา' : 'พนักงาน'}
                </div>
              </div>
            </div>

            <select
              value={currentUser.id}
              onChange={(e) => {
                const found = allUsers.find((u) => u.id === e.target.value);
                if (found) onChangeUser(found);
              }}
              className="text-xs bg-white border border-slate-200 rounded-md px-2 py-1 text-slate-700 font-bold focus:outline-hidden cursor-pointer"
              title="สลับบทบาทผู้ใช้เพื่อทดสอบสิทธิ์การใช้งาน"
            >
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  👤 {u.fullName} ({u.role.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
