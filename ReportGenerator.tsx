import React, { useState, useEffect } from 'react';
import { AttendanceRecord, Branch, Employee, UserRight } from './types';
import { generatePrintableReportHTML, ReportFilterOptions } from './pdfUtils';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface ReportGeneratorProps {
  records: AttendanceRecord[];
  employees: Employee[];
  branches: Branch[];
  currentUser?: UserRight;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  records,
  employees,
  branches,
  currentUser,
}) => {
  const isBranchRestricted =
    currentUser &&
    currentUser.role !== 'admin' &&
    currentUser.branchScope &&
    currentUser.branchScope !== 'all';

  const defaultBranch = isBranchRestricted ? currentUser.branchScope! : 'all';

  const todayStr = new Date().toISOString().split('T')[0];
  const thisMonthStr = todayStr.substring(0, 7);

  const [filter, setFilter] = useState<ReportFilterOptions>({
    periodType: 'daily',
    selectedDate: todayStr,
    selectedMonth: thisMonthStr,
    selectedBranchId: defaultBranch,
  });

  useEffect(() => {
    if (isBranchRestricted) {
      setFilter((prev) => ({ ...prev, selectedBranchId: currentUser.branchScope! }));
    }
  }, [isBranchRestricted, currentUser?.branchScope]);

  const branchMap = new Map(branches.map((b) => [b.id, b.name]));

  // Handle Printable PDF Generation Window
  const handleOpenPrintPdf = () => {
    const htmlContent = generatePrintableReportHTML(records, employees, branches, filter);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  };

  // Filtered dataset calculation for inline preview
  const scopedEmployees = employees.filter((emp) => {
    if (emp.status === 'terminated') return false;
    if (isBranchRestricted && emp.branchId !== defaultBranch) return false;
    if (filter.selectedBranchId !== 'all' && emp.branchId !== filter.selectedBranchId) return false;
    return true;
  });

  const visibleBranches = isBranchRestricted
    ? branches.filter((b) => b.id === defaultBranch)
    : branches;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            พิมพ์สรุปการเข้า-ออกงาน รายวัน/รายเดือน (Payroll Attendance Report)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isBranchRestricted
              ? `รายงานสรุปเวลาทำงานเฉพาะสาขา: ${branchMap.get(defaultBranch) || defaultBranch}`
              : 'สรุปจำนวนวันและเวลาเข้า-ออกงานของพนักงาน สำหรับนำไปคำนวณจ่ายเงินเดือนและค่าจ้าง'}
          </p>
        </div>

        <button
          onClick={handleOpenPrintPdf}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition"
        >
          <Printer className="w-4 h-4" />
          <span>พิมพ์รายงาน PDF (เปิดหน้าพิมพ์ A4)</span>
        </button>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          ตัวกรองรายงาน (Report Filters)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Period Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              ประเภทการสรุป
            </label>
            <select
              value={filter.periodType}
              onChange={(e) =>
                setFilter({ ...filter, periodType: e.target.value as 'daily' | 'monthly' })
              }
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-semibold text-slate-800 bg-slate-50 focus:outline-hidden"
            >
              <option value="daily">📅 สรุปรายวัน (Daily Report)</option>
              <option value="monthly">🗓️ สรุปรายเดือน (Monthly Payroll)</option>
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {filter.periodType === 'daily' ? 'เลือกวันที่' : 'เลือกเดือน'}
            </label>
            {filter.periodType === 'daily' ? (
              <input
                type="date"
                value={filter.selectedDate}
                onChange={(e) => setFilter({ ...filter, selectedDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-semibold text-slate-800 bg-slate-50 focus:outline-hidden"
              />
            ) : (
              <input
                type="month"
                value={filter.selectedMonth}
                onChange={(e) => setFilter({ ...filter, selectedMonth: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-semibold text-slate-800 bg-slate-50 focus:outline-hidden"
              />
            )}
          </div>

          {/* Branch Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">สาขาปฏิบัติงาน</label>
            <select
              value={filter.selectedBranchId}
              onChange={(e) => setFilter({ ...filter, selectedBranchId: e.target.value })}
              disabled={Boolean(isBranchRestricted)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-semibold text-slate-800 bg-slate-50 focus:outline-hidden disabled:bg-slate-100"
            >
              {!isBranchRestricted && <option value="all">🌐 ทุกสาขา (สำนักงานใหญ่ + สาขาย่อย)</option>}
              {visibleBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.type === 'hq' ? '🏢' : '🏪'} {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Report Preview Summary */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-sm font-bold text-slate-900">
            พรีวิวตัวอย่างรายงาน: {filter.periodType === 'daily' ? filter.selectedDate : filter.selectedMonth}
          </h3>
          <span className="text-xs text-indigo-700 font-bold bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            จำนวนพนักงานในรายงาน: {scopedEmployees.length} ท่าน
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] text-slate-600 uppercase font-bold border-b border-slate-200">
                <th className="py-2.5 px-3">รหัส</th>
                <th className="py-2.5 px-3">ชื่อ-นามสกุล</th>
                <th className="py-2.5 px-3">สาขา</th>
                <th className="py-2.5 px-3">ตำแหน่ง</th>
                <th className="py-2.5 px-3 text-center">เวลาเข้างาน</th>
                <th className="py-2.5 px-3 text-center">เวลาออกงาน</th>
                <th className="py-2.5 px-3 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scopedEmployees.map((emp) => {
                const rec = records.find(
                  (r) => r.employeeId === emp.id && r.date === (filter.selectedDate || todayStr)
                );
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">{emp.empCode}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{emp.fullName}</td>
                    <td className="py-2.5 px-3 text-slate-600">{branchMap.get(emp.branchId) || '-'}</td>
                    <td className="py-2.5 px-3 text-slate-500">{emp.position}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                      {rec?.timeIn || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                      {rec?.timeOut || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rec?.status === 'present'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec?.status === 'late'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {rec?.status === 'present'
                          ? 'ปกติ'
                          : rec?.status === 'late'
                          ? 'สาย'
                          : 'ขาด/ยังไม่ลงเวลา'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
