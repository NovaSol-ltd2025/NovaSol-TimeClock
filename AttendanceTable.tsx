import React, { useState } from 'react';
import { AttendanceRecord, Branch, UserRight } from '../types';
import {
  Calendar,
  Building2,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Trash2,
  X,
  Camera,
  MapPin,
  ShieldAlert,
} from 'lucide-react';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  branches: Branch[];
  currentUser: UserRight;
  onDeleteRecord: (recordId: string) => void;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  records,
  branches,
  currentUser,
  onDeleteRecord,
}) => {
  const [selectedBranch, setSelectedBranch] = useState<string>(
    currentUser.role === 'staff' && currentUser.branchScope && currentUser.branchScope !== 'all'
      ? currentUser.branchScope
      : 'all'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(''); // empty = all dates
  const [previewSelfieUrl, setPreviewSelfieUrl] = useState<string | null>(null);

  const branchMap = new Map(branches.map((b) => [b.id, b.name]));

  // Filter logic respecting rights scoping
  const filteredRecords = records.filter((rec) => {
    // Branch scoping constraint for staff/supervisor
    if (currentUser.role === 'staff' && currentUser.branchScope && currentUser.branchScope !== 'all') {
      if (rec.branchId !== currentUser.branchScope) return false;
    } else if (selectedBranch !== 'all' && rec.branchId !== selectedBranch) {
      return false;
    }

    if (selectedDate && rec.date !== selectedDate) {
      return false;
    }

    if (
      searchTerm &&
      !rec.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !rec.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            ตารางบันทึกการลงเวลาเข้า-ออกงาน (Attendance Logs)
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {currentUser.role === 'staff'
              ? `จำกัดสิทธิ์แสดงเฉพาะข้อมูลสาขาที่ท่านสังกัด (${
                  branchMap.get(currentUser.branchScope || '') || 'สาขาของท่าน'
                })`
              : 'แสดงรายการลงเวลา ภาพถ่าย Selfie และการตรวจสอบพิกัด GPS ระยะห่าง'}
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="ค้นหาชื่อพนักงาน หรือหมายเหตุ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        {/* Branch Filter (Disabled or Scoped if Staff) */}
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            disabled={
              currentUser.role === 'staff' &&
              currentUser.branchScope !== undefined &&
              currentUser.branchScope !== 'all'
            }
            className="text-xs bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-700 font-bold focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-500 cursor-pointer"
          >
            <option value="all">ทุกสาขา</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-700 font-bold focus:outline-hidden cursor-pointer"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="text-xs text-rose-600 hover:underline font-bold cursor-pointer"
            >
              ล้างวันที่
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-4">วันที่ / เวลา</th>
                <th className="py-2.5 px-4">พนักงาน</th>
                <th className="py-2.5 px-4">สาขาที่ลงเวลา</th>
                <th className="py-2.5 px-4 text-center">รูปถ่าย Selfie</th>
                <th className="py-2.5 px-4 text-center">ระยะ GPS</th>
                <th className="py-2.5 px-4 text-center">สถานะ</th>
                <th className="py-2.5 px-4">หมายเหตุ</th>
                {currentUser.role === 'admin' && (
                  <th className="py-2.5 px-4 text-right">จัดการ</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={currentUser.role === 'admin' ? 8 : 7}
                    className="py-12 text-center text-slate-400 text-xs font-medium"
                  >
                    ไม่พบข้อมูลประวัติการลงเวลาตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-mono">
                      <div className="font-bold text-slate-900">{rec.date}</div>
                      <div className="text-[10px] text-indigo-600 font-bold mt-0.5">
                        เข้า: {rec.timeIn || '-'} | ออก: {rec.timeOut || '-'}
                      </div>
                    </td>

                    <td className="py-2.5 px-4 font-bold text-slate-800">{rec.employeeName}</td>

                    <td className="py-2.5 px-4 text-slate-600 font-medium">{rec.branchName}</td>

                    {/* Selfie Lightbox trigger */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {rec.selfieInUrl ? (
                          <button
                            onClick={() => setPreviewSelfieUrl(rec.selfieInUrl || null)}
                            className="group relative cursor-pointer"
                            title="คลิกเพื่อดูรูปใหญ่ภาพเช็คอิน"
                          >
                            <img
                              src={rec.selfieInUrl}
                              alt="Selfie Check-In"
                              className="w-9 h-9 rounded-lg object-cover border border-slate-200 group-hover:opacity-80 transition"
                            />
                            <span className="absolute -top-1 -right-1 bg-sky-600 text-white text-[9px] px-1 rounded-full font-bold">
                              In
                            </span>
                          </button>
                        ) : (
                          <span className="text-slate-300 text-[10px]">-</span>
                        )}

                        {rec.selfieOutUrl && (
                          <button
                            onClick={() => setPreviewSelfieUrl(rec.selfieOutUrl || null)}
                            className="group relative cursor-pointer"
                            title="คลิกเพื่อดูรูปใหญ่ภาพเช็คเอาท์"
                          >
                            <img
                              src={rec.selfieOutUrl}
                              alt="Selfie Check-Out"
                              className="w-9 h-9 rounded-lg object-cover border border-slate-200 group-hover:opacity-80 transition"
                            />
                            <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[9px] px-1 rounded-full font-bold">
                              Out
                            </span>
                          </button>
                        )}
                      </div>
                    </td>

                    {/* GPS Distance Badge */}
                    <td className="py-3.5 px-4 text-center">
                      {rec.distanceInMeters !== undefined ? (
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              rec.isWithinRadiusIn
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {rec.distanceInMeters} เมตร{' '}
                            {rec.isWithinRadiusIn ? '✓ ในรัศมี' : '⚠️ เกิน 100m'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          rec.status === 'late'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {rec.status === 'late' ? '⚠️ มาสาย' : '✓ ปกติ/ตรงเวลา'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {rec.notes || '-'}
                    </td>

                    {currentUser.role === 'admin' && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            if (confirm('คุณต้องการลบบันทึกรายการนี้ใช่หรือไม่?')) {
                              onDeleteRecord(rec.id);
                            }
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="ลบรายการบันทึก"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selfie Lightbox Modal */}
      {previewSelfieUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 max-w-sm w-full overflow-hidden shadow-2xl space-y-3 relative">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-sky-600" />
                รูปถ่ายยืนยันตัวตน Selfie
              </h3>
              <button
                onClick={() => setPreviewSelfieUrl(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <img
              src={previewSelfieUrl}
              alt="Full Selfie Preview"
              className="w-full h-80 object-cover rounded-xl border border-slate-200 shadow-inner"
            />

            <div className="text-[11px] text-slate-500 text-center bg-slate-50 p-2 rounded-lg">
              🔒 รูปถ่ายนี้ถูกบันทึกเพื่อป้องกันการทุจริตและการเข้า-ออกงานแทนกัน
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
