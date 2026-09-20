import React from 'react';
import { Branch, Employee, AttendanceRecord, UserRight } from './types';
import {
  Users,
  UserCheck,
  LogIn,
  LogOut,
  Building2,
  MapPin,
  AlertCircle,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  Calendar,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface DashboardProps {
  branches: Branch[];
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  activeBranchFilter: string;
  onSelectTab: (tabId: string) => void;
  onOpenClockIn: () => void;
  currentUser?: UserRight | null;
}

export const Dashboard: React.FC<DashboardProps> = ({
  branches,
  employees,
  attendanceRecords,
  activeBranchFilter,
  onSelectTab,
  onOpenClockIn,
  currentUser,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // If currentUser is regular staff, render personalized Staff Workstation
  if (currentUser?.role === 'staff') {
    const staffEmp = employees.find(
      (e) =>
        (currentUser.employeeId && e.id === currentUser.employeeId) ||
        e.empCode.toLowerCase() === currentUser.username.toLowerCase() ||
        e.fullName.toLowerCase() === currentUser.fullName.toLowerCase()
    );

    const staffBranch = branches.find(
      (b) => b.id === staffEmp?.branchId || b.id === currentUser.branchScope
    );

    const todayStaffRecord = attendanceRecords.find(
      (r) =>
        r.date === todayStr &&
        ((staffEmp && r.employeeId === staffEmp.id) ||
          r.employeeName.toLowerCase().trim() === currentUser.fullName.toLowerCase().trim())
    );

    const myRecentRecords = attendanceRecords
      .filter(
        (r) =>
          (staffEmp && r.employeeId === staffEmp.id) ||
          r.employeeName.toLowerCase().trim() === currentUser.fullName.toLowerCase().trim()
      )
      .slice(0, 5);

    return (
      <div className="space-y-6">
        {/* Staff Welcome Banner */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              {staffEmp?.avatarUrl ? (
                <img
                  src={staffEmp.avatarUrl}
                  alt={staffEmp.fullName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-sm">
                  {currentUser.fullName.charAt(0)}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-white" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-100 font-mono">
                  {staffEmp?.empCode || currentUser.username}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  พนักงานประจำสาขา
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                สวัสดีคุณ {currentUser.fullName}
              </h2>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                สาขา: <strong className="text-slate-700">{staffBranch?.name || 'สาขาที่สังกัด'}</strong>
                {staffBranch?.workStartTime && (
                  <span className="text-indigo-600 font-medium ml-1">
                    (กะเวลา: {staffBranch.workStartTime} - {staffBranch.workEndTime} น.)
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenClockIn}
            className="w-full md:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <UserCheck className="w-5 h-5" />
            <span>ลงเวลาเข้า-ออกงาน (Clock In / Out)</span>
          </button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Today Status Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>สถานะการเข้างานวันนี้</span>
              <Calendar className="w-4 h-4 text-indigo-500" />
            </span>
            <div className="flex items-center gap-3 pt-1">
              {todayStaffRecord?.timeIn ? (
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : (
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <Clock className="w-6 h-6" />
                </div>
              )}
              <div>
                <div className="text-sm font-bold text-slate-800">
                  {todayStaffRecord?.timeIn
                    ? `เข้างานแล้วเวลา ${todayStaffRecord.timeIn} น.`
                    : 'ยังไม่ได้ลงเวลาเข้างานวันนี้'}
                </div>
                <div className="text-xs text-slate-500">
                  {todayStaffRecord?.timeOut
                    ? `ออกงานแล้วเวลา ${todayStaffRecord.timeOut} น.`
                    : todayStaffRecord?.timeIn
                    ? 'รอลงเวลาออกงานเมื่อสิ้นสุดกะ'
                    : 'กดปุ่มเพื่อบันทึกเวลาพร้อมภาพถ่าย'}
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Branch Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>ข้อมูลสาขาปฏิบัติงาน</span>
              <Building2 className="w-4 h-4 text-sky-500" />
            </span>
            <div className="space-y-1 pt-1">
              <div className="text-sm font-bold text-slate-800">
                {staffBranch?.name || 'ไม่ระบุสาขา'}
              </div>
              <p className="text-xs text-slate-500 line-clamp-1">
                {staffBranch?.address || 'ไม่มีข้อมูลที่อยู่'}
              </p>
              <div className="text-[11px] text-sky-700 font-semibold flex items-center gap-1 pt-1">
                <MapPin className="w-3.5 h-3.5" />
                รัศมีตรวจสอบ GPS: {staffBranch?.radiusMeters || 100} เมตร
              </div>
            </div>
          </div>

          {/* Shift Time Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>เวลาทำงานของสาขา</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </span>
            <div className="space-y-1 pt-1">
              <div className="text-base font-extrabold text-slate-800 font-mono">
                {staffBranch?.workStartTime || '08:30'} - {staffBranch?.workEndTime || '17:30'} น.
              </div>
              <p className="text-xs text-slate-500">
                หากลงเวลาเกินเวลาเริ่มงาน จะถูกบันทึกเป็นเข้าสาย
              </p>
            </div>
          </div>
        </div>

        {/* My Recent Records */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              ประวัติการลงเวลาล่าสุดของฉัน (5 รายการล่าสุด)
            </h3>
            <button
              onClick={() => onSelectTab('attendance')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              ดูทั้งหมด →
            </button>
          </div>

          {myRecentRecords.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              ยังไม่มีประวัติการลงเวลาในระบบ
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {myRecentRecords.map((rec) => (
                <div key={rec.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">
                      {rec.date.split('-').slice(1).join('/')}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        เข้า: {rec.timeIn || '-'} น. | ออก: {rec.timeOut || '-'} น.
                      </div>
                      <div className="text-[11px] text-slate-400">
                        สาขา: {branches.find((b) => b.id === rec.branchId)?.name || rec.branchId}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      rec.status === 'present'
                        ? 'bg-emerald-100 text-emerald-800'
                        : rec.status === 'late'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {rec.status === 'present' ? '✓ ปกติ' : rec.status === 'late' ? '⚠️ สาย' : '✕ ขาด'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Filter employees according to active branch filter (Admin & Supervisor view)
  const scopedEmployees = employees.filter((emp) => {
    if (emp.status === 'terminated') return false; // active employees only
    if (activeBranchFilter !== 'all' && emp.branchId !== activeBranchFilter) return false;
    return true;
  });

  // Filter today's attendance records
  const todayRecords = attendanceRecords.filter((rec) => {
    if (rec.date !== todayStr) return false;
    if (activeBranchFilter !== 'all' && rec.branchId !== activeBranchFilter) return false;
    return true;
  });

  // Filter branches according to active branch filter & user branch scope
  // Requirement: Admin MUST always see all branches in "BRANCH ATTENDANCE STATUS"
  const scopedBranches = branches.filter((b) => {
    // If admin, admin must see all branches
    if (currentUser?.role === 'admin') {
      return true;
    }
    // If user has a specific branch scope (e.g. supervisor or branch-scoped user)
    if (currentUser && currentUser.branchScope && currentUser.branchScope !== 'all') {
      return b.id === currentUser.branchScope;
    }
    // If a non-admin has selected a specific branch filter
    if (activeBranchFilter !== 'all') {
      return b.id === activeBranchFilter;
    }
    return true;
  });

  // Calculate Key Metrics (Requirement #7)
  const totalActiveEmployeesCount = scopedEmployees.length;
  const clockedInTodayCount = todayRecords.filter((r) => r.timeIn).length;
  const clockedOutTodayCount = todayRecords.filter((r) => r.timeOut).length;
  const presentTodayCount = todayRecords.filter((r) => r.timeIn).length;
  const lateTodayCount = todayRecords.filter((r) => r.status === 'late').length;

  return (
    <div className="space-y-5">
      {/* Top Banner Alert / Command Center Welcome */}
      <div className="bg-[#1e293b] text-white rounded-xl p-5 border border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-indigo-500/30 uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5" />
            NOVASOL COMMAND CENTER
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            สรุปภาพรวมการลงเวลาปฏิบัติงานประจำวัน
          </h2>
          <p className="text-slate-300 text-xs">
            ตรวจสอบข้อมูลพนักงาน การเช็คอินด้วย QR Code, GPS พิกัดระยะทาง 100 เมตร และรูปถ่าย Selfie ป้องกันการแทนกัน
          </p>
        </div>

        <button
          onClick={onOpenClockIn}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-md shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <UserCheck className="w-4 h-4" />
          <span>สแกน QR Code / เช็คอินเข้างาน</span>
        </button>
      </div>

      {/* Requirement #7 & High Density Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Employees per Branch */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
            <span>TOTAL EMPLOYEES</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-end space-x-2 mt-1">
            <span className="text-2xl font-black text-slate-800">{totalActiveEmployeesCount}</span>
            <span className="text-indigo-500 text-xs font-bold pb-0.5">คน</span>
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">
            จำนวนพนักงานทั้งหมดในสาขาที่เลือก
          </div>
        </div>

        {/* Card 2: Employees Present Today */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
            <span>PRESENT TODAY</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-end space-x-2 mt-1">
            <span className="text-2xl font-black text-slate-800">{presentTodayCount}</span>
            <span className="text-slate-400 text-xs pb-0.5">/ {totalActiveEmployeesCount}</span>
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">
            พนักงานปฏิบัติงานวันนี้ ({((presentTodayCount / Math.max(totalActiveEmployeesCount, 1)) * 100).toFixed(0)}%)
          </div>
        </div>

        {/* Card 3: Clocked In Today */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
            <span>CLOCK-IN TODAY</span>
            <LogIn className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-end space-x-2 mt-1">
            <span className="text-2xl font-black text-slate-800">{clockedInTodayCount}</span>
            <span className="text-indigo-500 text-xs font-bold pb-0.5">
              {((clockedInTodayCount / Math.max(totalActiveEmployeesCount, 1)) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">
            {lateTodayCount > 0 ? (
              <span className="text-amber-600 font-bold flex items-center gap-0.5">
                <AlertCircle className="w-3 h-3" /> มาสาย {lateTodayCount} คน
              </span>
            ) : (
              <span className="text-emerald-600 font-bold">✓ ตรงเวลาทั้งหมด</span>
            )}
          </div>
        </div>

        {/* Card 4: Clocked Out Today */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
            <span>ACTIVE BRANCHES</span>
            <LogOut className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-end space-x-2 mt-1">
            <span className="text-2xl font-black text-slate-800">{scopedBranches.length}</span>
            <span className="text-slate-400 text-xs pb-0.5">Locations</span>
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">
            ออกงานแล้ว {clockedOutTodayCount} คน
          </div>
        </div>
      </div>

      {/* Grid Section: Per-Branch Summary & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column (2 cols): Branch Breakdown Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              BRANCH ATTENDANCE STATUS
            </h3>
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => onSelectTab('branches')}
                className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                จัดการสาขา <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {scopedBranches.map((b) => {
              const branchEmps = employees.filter(
                (e) => e.branchId === b.id && e.status === 'active'
              );
              const branchTodayRecords = attendanceRecords.filter(
                (r) => r.branchId === b.id && r.date === todayStr && r.timeIn
              );
              const branchClockedOut = attendanceRecords.filter(
                (r) => r.branchId === b.id && r.date === todayStr && r.timeOut
              );
              const pct = branchEmps.length > 0 ? Math.round((branchTodayRecords.length / branchEmps.length) * 100) : 0;

              return (
                <div
                  key={b.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{b.name}</span>
                        {b.type === 'hq' && (
                          <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-100">
                            HQ
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        รัศมี: {b.radiusMeters} เมตร
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-black text-slate-800">
                        {branchTodayRecords.length}/{branchEmps.length}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-bold">เข้างาน</span>
                    </div>
                  </div>

                  {/* High Density progress bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-50 p-1.5 rounded-md">
                      <div className="text-slate-400 text-[10px] font-bold">ทั้งหมด</div>
                      <div className="font-bold text-slate-800 text-xs">{branchEmps.length} คน</div>
                    </div>
                    <div className="bg-emerald-50 p-1.5 rounded-md">
                      <div className="text-emerald-700 text-[10px] font-bold">เข้างาน</div>
                      <div className="font-bold text-emerald-700 text-xs">{branchTodayRecords.length} คน</div>
                    </div>
                    <div className="bg-indigo-50 p-1.5 rounded-md">
                      <div className="text-indigo-700 text-[10px] font-bold">ออกงาน</div>
                      <div className="font-bold text-indigo-700 text-xs">{branchClockedOut.length} คน</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (1 col): Live Clock-In Stream Feed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                RECENT STAFF ACTIVITY
              </h3>
              <button
                onClick={() => onSelectTab('attendance')}
                className="text-[10px] text-indigo-600 hover:underline font-bold cursor-pointer"
              >
                ดูทั้งหมด
              </button>
            </div>

            {todayRecords.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs font-medium">
                ยังไม่มีรายการลงเวลาเข้างานวันนี้
              </div>
            ) : (
              <div className="space-y-2">
                {todayRecords.slice(0, 5).map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50/80 border border-slate-100"
                  >
                    <img
                      src={rec.selfieInUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={rec.employeeName}
                      className="w-8 h-8 rounded-full object-cover border border-white shadow-2xs shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {rec.employeeName}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate font-medium">{rec.branchName}</div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-indigo-600">{rec.timeIn}</div>
                      <span
                        className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                          rec.isWithinRadiusIn
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {rec.isWithinRadiusIn ? 'GPS VALID' : 'OUTSIDE'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50 rounded-lg p-2.5 text-[11px] text-slate-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="leading-tight">
              ระบบความปลอดภัย: บันทึกรูปถ่าย Selfie และพิกัด GPS ระยะทางทุกรายการ
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
