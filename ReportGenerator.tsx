import React, { useState } from 'react';
import { AttendanceRecord, Branch, Employee } from '../types';
import { generatePrintableReportHTML, ReportFilterOptions } from '../lib/pdfUtils';
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
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  records,
  employees,
  branches,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const thisMonthStr = todayStr.substring(0, 7);

  const [filter, setFilter] = useState<ReportFilterOptions>({
    periodType: 'daily',
    selectedDate: todayStr,
    selectedMonth: thisMonthStr,
    selectedBranchId: 'all',
  });

  const branchMap = new Map(branches.map((b) => [b.id, b.name]));

  // Handle Printable PDF Generation Window
  const handleOpenPrintPdf = () => {
    const htmlContent = generatePrintableReportHTML(records, employees, branches, filter);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
    }
  };

  // Filtered dataset calculation for inline preview
  const scopedEmployees = employees.filter((emp) => {
    if (emp.status === 'terminated') return false;
    if (filter.selectedBranchId !== 'all' && emp.branchId !== filter.selectedBranchId) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-sky-600" />
            พิมพ์สรุปการเข้า-ออกงาน รายวัน/รายเดือน (Payroll Attendance Report)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            สรุปจำนวนวันและเวลาเข้า-ออกงานของพนักงานประจำสาขา สำหรับนำไปคำนวณจ่ายเงินเดือนและค่าจ้าง
          </p>
        </div>

        <button
          onClick={handleOpenPrintPdf}
          className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition"
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
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFilter({ ...filter, periodType: 'daily' })}
                className={`py-2 px-3 text-xs font-bold rounded-xl border cursor-pointer transition ${
                  filter.periodType === 'daily'
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                📅 รายวัน
              </button>

              <button
                type="button"
                onClick={() => setFilter({ ...filter, periodType: 'monthly' })}
                className={`py-2 px-3 text-xs font-bold rounded-xl border cursor-pointer transition ${
                  filter.periodType === 'monthly'
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                🗓️ รายเดือน
              </button>
            </div>
          </div>

          {/* Date / Month Picker */}
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
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold text-slate-800 bg-slate-50 focus:outline-hidden cursor-pointer"
            >
              <option value="all">🌐 แสดงทุกสาขา</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Generate PDF Trigger */}
          <div className="flex items-end">
            <button
              onClick={handleOpenPrintPdf}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <FileText className="w-4 h-4 text-sky-400" />
              <span>แสดงตัวอย่างก่อนพิมพ์ A4</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Table Preview */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-3">
            <img
              src="https://i.postimg.cc/FHGkmGKB/NOVASOL-1/logo.png"
              alt="NOVASOL Logo"
              className="h-9 w-auto object-contain"
            />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                ตัวอย่างตารางสรุปข้อมูลเวลางาน (หจก.โนวาโซล)
              </h3>
              <p className="text-xs text-slate-500">
                ขอบเขต: {filter.selectedBranchId === 'all' ? 'ทุกสาขา' : branchMap.get(filter.selectedBranchId)} |{' '}
                {filter.periodType === 'daily'
                  ? `วันที่ ${filter.selectedDate}`
                  : `เดือน ${filter.selectedMonth}`}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-y border-slate-200">
                <th className="p-3 w-12 text-center">ลำดับ</th>
                <th className="p-3 w-28">รหัสพนักงาน</th>
                <th className="p-3">ชื่อ-นามสกุล / ตำแหน่ง</th>
                <th className="p-3">สาขาปฏิบัติงาน</th>
                {filter.periodType === 'daily' ? (
                  <>
                    <th className="p-3 text-center">เวลาเข้า</th>
                    <th className="p-3 text-center">เวลาออก</th>
                    <th className="p-3 text-center">สถานะ</th>
                  </>
                ) : (
                  <>
                    <th className="p-3 text-center">วันเข้างาน</th>
                    <th className="p-3 text-center">จำนวนสาย</th>
                    <th className="p-3 text-center">ชม. งานรวม</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scopedEmployees.map((emp, index) => {
                const empRecords = records.filter((r) => {
                  if (r.employeeId !== emp.id) return false;
                  if (filter.periodType === 'daily') return r.date === filter.selectedDate;
                  return r.date.startsWith(filter.selectedMonth);
                });

                if (filter.periodType === 'daily') {
                  const rec = empRecords[0];
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50">
                      <td className="p-3 text-center font-bold text-slate-500">{index + 1}</td>
                      <td className="p-3 font-mono font-bold text-sky-800">{emp.empCode}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{emp.fullName}</div>
                        <div className="text-[11px] text-slate-400">{emp.position}</div>
                      </td>
                      <td className="p-3 text-slate-600">{branchMap.get(emp.branchId)}</td>
                      <td className="p-3 text-center font-mono font-bold text-emerald-700">
                        {rec?.timeIn || '-'}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-indigo-700">
                        {rec?.timeOut || '-'}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            rec
                              ? rec.status === 'late'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {rec
                            ? rec.status === 'late'
                              ? 'มาสาย'
                              : 'มาทำงาน'
                            : 'ยังไม่เข้างาน/ขาด'}
                        </span>
                      </td>
                    </tr>
                  );
                } else {
                  const daysPresent = empRecords.filter((r) => r.timeIn).length;
                  const daysLate = empRecords.filter((r) => r.status === 'late').length;
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50">
                      <td className="p-3 text-center font-bold text-slate-500">{index + 1}</td>
                      <td className="p-3 font-mono font-bold text-sky-800">{emp.empCode}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{emp.fullName}</div>
                        <div className="text-[11px] text-slate-400">{emp.position}</div>
                      </td>
                      <td className="p-3 text-slate-600">{branchMap.get(emp.branchId)}</td>
                      <td className="p-3 text-center font-bold text-emerald-700">
                        {daysPresent} วัน
                      </td>
                      <td className="p-3 text-center font-bold text-amber-700">
                        {daysLate} ครั้ง
                      </td>
                      <td className="p-3 text-center font-bold text-blue-700">
                        {daysPresent * 8} ชม.
                      </td>
                    </tr>
                  );
                }
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
