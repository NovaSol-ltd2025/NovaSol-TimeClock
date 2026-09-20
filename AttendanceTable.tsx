import React, { useState } from 'react';
import { AttendanceRecord, Branch, Employee, UserRight } from './types';
import { MovableModal } from './MovableModal';
import {
  Calendar,
  Building2,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  X,
  Camera,
  ShieldAlert,
  Edit3,
  Plus,
  Wrench,
  User,
  Sparkles,
  Info,
} from 'lucide-react';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  branches: Branch[];
  employees?: Employee[];
  currentUser: UserRight;
  onSaveRecord?: (record: AttendanceRecord) => void;
  onDeleteRecord: (recordId: string) => void;
  onDeleteMultipleRecords?: (recordIds: string[]) => void;
  onClearAllRecords?: (branchId?: string) => void;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  records,
  branches,
  employees = [],
  currentUser,
  onSaveRecord,
  onDeleteRecord,
  onDeleteMultipleRecords,
  onClearAllRecords,
}) => {
  // Requirement 3 & User Request: Staff only sees their own records; Supervisor sees their branch; Admin sees all
  const isStaff = currentUser.role === 'staff';
  const isBranchRestricted =
    currentUser.role !== 'admin' &&
    currentUser.branchScope &&
    currentUser.branchScope !== 'all';

  const userBranchId = isBranchRestricted ? currentUser.branchScope! : 'all';

  const [selectedBranch, setSelectedBranch] = useState<string>(userBranchId);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(''); // empty = all dates
  const [previewSelfieUrl, setPreviewSelfieUrl] = useState<string | null>(null);

  // Batch Selection & Test Data Cleanup State
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [clearScope, setClearScope] = useState<'all' | 'branch' | 'filtered'>('all');

  // Custom In-App Deletion Modals (replacing window.confirm which is blocked in sandboxed iframes)
  const [recordToDelete, setRecordToDelete] = useState<AttendanceRecord | null>(null);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleOpenBatchDeleteModal = () => {
    if (selectedRecordIds.length === 0) return;
    setIsBatchDeleteModalOpen(true);
  };

  const handleConfirmBatchDelete = () => {
    if (selectedRecordIds.length === 0) return;
    const count = selectedRecordIds.length;
    if (onDeleteMultipleRecords) {
      onDeleteMultipleRecords(selectedRecordIds);
    } else {
      selectedRecordIds.forEach((id) => onDeleteRecord(id));
    }
    setSelectedRecordIds([]);
    setIsBatchDeleteModalOpen(false);
    showToast(`ลบข้อมูลประวัติการลงเวลาทดสอบที่เลือก ${count} รายการ เรียบร้อยแล้ว`);
  };

  const handleConfirmSingleDelete = () => {
    if (!recordToDelete) return;
    const targetName = recordToDelete.employeeName;
    const targetDate = recordToDelete.date;
    onDeleteRecord(recordToDelete.id);
    setSelectedRecordIds((prev) => prev.filter((id) => id !== recordToDelete.id));
    setRecordToDelete(null);
    showToast(`ลบรายการลงเวลาของ "${targetName}" (${targetDate}) เรียบร้อยแล้ว`);
  };

  const handleConfirmClearAll = () => {
    let count = 0;
    if (clearScope === 'all') {
      count = records.length;
      if (onClearAllRecords) {
        onClearAllRecords('all');
      } else if (onDeleteMultipleRecords) {
        onDeleteMultipleRecords(records.map((r) => r.id));
      }
    } else if (clearScope === 'branch') {
      const branchRecs = records.filter((r) => r.branchId === selectedBranch);
      count = branchRecs.length;
      if (onClearAllRecords) {
        onClearAllRecords(selectedBranch);
      } else if (onDeleteMultipleRecords) {
        onDeleteMultipleRecords(branchRecs.map((r) => r.id));
      }
    } else if (clearScope === 'filtered') {
      count = filteredRecords.length;
      const ids = filteredRecords.map((r) => r.id);
      if (onDeleteMultipleRecords) {
        onDeleteMultipleRecords(ids);
      } else {
        ids.forEach((id) => onDeleteRecord(id));
      }
    }
    setSelectedRecordIds([]);
    setIsClearAllModalOpen(false);
    showToast(`ล้างข้อมูลประวัติการลงเวลาทดสอบเรียบร้อยแล้ว (${count} รายการ)`);
  };

  // Admin Adjustment & Manual Entry Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);

  // Modal Form State
  const [formData, setFormData] = useState<{
    id: string;
    employeeId: string;
    employeeName: string;
    branchId: string;
    branchName: string;
    date: string;
    timeIn: string;
    timeOut: string;
    status: 'present' | 'late' | 'early_leave' | 'absent';
    notes: string;
    adminAdjustReason: string;
    approveGps: boolean;
  }>({
    id: '',
    employeeId: '',
    employeeName: '',
    branchId: '',
    branchName: '',
    date: new Date().toISOString().split('T')[0],
    timeIn: '08:30:00',
    timeOut: '17:30:00',
    status: 'present',
    notes: '',
    adminAdjustReason: 'แอปล่ม / อินเทอร์เน็ตที่สาขาขัดข้อง (Admin ปรับเวลาให้)',
    approveGps: true,
  });

  const branchMap = new Map(branches.map((b) => [b.id, b.name]));

  const canEditAttendance = currentUser.role === 'admin' || (!isStaff && Boolean(currentUser.canManageEmployees));

  // Quick preset reasons for admin adjustment
  const quickReasons = [
    'แอปล่ม / ระบบขัดข้องชั่วคราว',
    'อินเทอร์เน็ตที่สาขาขัดข้อง',
    'พนักงานลืมสแกนเข้างาน (หัวหน้างานรับรอง)',
    'พนักงานลืมสแกนออกงาน (ทำงานจริงเต็มเวลา)',
    'โทรศัพท์พนักงานแบตหมด / เครื่องค้าง',
  ];

  // Open modal for editing an existing record
  const handleOpenEdit = (rec: AttendanceRecord) => {
    setEditingRecord(rec);
    setFormData({
      id: rec.id,
      employeeId: rec.employeeId,
      employeeName: rec.employeeName,
      branchId: rec.branchId,
      branchName: rec.branchName,
      date: rec.date,
      timeIn: rec.timeIn || '',
      timeOut: rec.timeOut || '',
      status: rec.status,
      notes: rec.notes || '',
      adminAdjustReason: rec.adminAdjustReason || 'ปรับเวลาทำงานเนื่องจากปัญหาเครือข่าย/แอปพลิเคชัน',
      approveGps: rec.isWithinRadiusIn ?? true,
    });
    setIsAdjustModalOpen(true);
  };

  // Open modal for creating a new manual record (e.g. app crashed / no internet)
  const handleOpenCreateManual = () => {
    const defaultEmp = employees[0];
    const defaultBranch = branches.find((b) => b.id === (userBranchId !== 'all' ? userBranchId : defaultEmp?.branchId)) || branches[0];
    const nowTime = new Date().toTimeString().split(' ')[0];

    setEditingRecord(null);
    setFormData({
      id: `att-manual-${Date.now()}`,
      employeeId: defaultEmp?.id || '',
      employeeName: defaultEmp?.fullName || '',
      branchId: defaultBranch?.id || '',
      branchName: defaultBranch?.name || '',
      date: new Date().toISOString().split('T')[0],
      timeIn: defaultBranch?.startWorkTime ? `${defaultBranch.startWorkTime}:00` : '08:30:00',
      timeOut: defaultBranch?.endWorkTime ? `${defaultBranch.endWorkTime}:00` : '17:30:00',
      status: 'present',
      notes: 'ลงเวลาย้อนหลังโดยผู้ดูแลระบบ (กรณีแอปล่ม/เน็ตหลุด)',
      adminAdjustReason: 'อินเทอร์เน็ตที่สาขาขัดข้อง / แอปล่ม ลงเวลาแทนพนักงาน',
      approveGps: true,
    });
    setIsAdjustModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveRecord) return;

    const targetBranch = branches.find((b) => b.id === formData.branchId);
    const targetEmp = employees.find((emp) => emp.id === formData.employeeId);

    const updatedRecord: AttendanceRecord = {
      ...(editingRecord || {}),
      id: formData.id || `att-manual-${Date.now()}`,
      employeeId: formData.employeeId,
      employeeName: targetEmp?.fullName || formData.employeeName,
      branchId: formData.branchId,
      branchName: targetBranch?.name || formData.branchName,
      date: formData.date,
      timeIn: formData.timeIn ? formData.timeIn : undefined,
      timeOut: formData.timeOut ? formData.timeOut : undefined,
      status: formData.status,
      notes: formData.notes,
      isAdjustedByAdmin: true,
      adminAdjustReason: formData.adminAdjustReason,
      adjustedByAdminName: currentUser.fullName,
      adjustedAt: new Date().toISOString(),
      distanceInMeters: formData.approveGps ? 0 : (editingRecord?.distanceInMeters ?? 0),
      isWithinRadiusIn: formData.approveGps ? true : editingRecord?.isWithinRadiusIn,
    };

    onSaveRecord(updatedRecord);
    setIsAdjustModalOpen(false);
  };

  // Filter logic respecting rights scoping (Requirement 3 & Staff Privacy)
  const filteredRecords = records.filter((rec) => {
    // If staff, strictly only show their own records
    if (isStaff) {
      const matchEmpId = currentUser.employeeId && rec.employeeId === currentUser.employeeId;
      const matchName =
        rec.employeeName.toLowerCase().trim() === currentUser.fullName.toLowerCase().trim() ||
        rec.employeeName.toLowerCase().trim() === currentUser.username.toLowerCase().trim();
      if (!matchEmpId && !matchName) {
        return false;
      }
    } else if (isBranchRestricted && rec.branchId !== userBranchId) {
      // Supervisor: strictly restricted to their assigned branch
      return false;
    } else if (selectedBranch !== 'all' && rec.branchId !== selectedBranch) {
      return false;
    }

    if (selectedDate && rec.date !== selectedDate) {
      return false;
    }

    if (
      searchTerm &&
      !rec.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !rec.notes?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !rec.adminAdjustReason?.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-600" />
            {isStaff ? 'ประวัติการลงเวลาของฉัน (My Attendance Logs)' : 'ตารางบันทึกการลงเวลาเข้า-ออกงาน (Attendance Logs)'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isStaff
              ? `พนักงาน: ${currentUser.fullName} (${branchMap.get(userBranchId) || 'สาขาของท่าน'}) - แสดงเฉพาะข้อมูลของท่าน`
              : isBranchRestricted
              ? `จำกัดสิทธิ์แสดงเฉพาะข้อมูลสาขาที่ท่านสังกัด: ${
                  branchMap.get(userBranchId) || userBranchId
                }`
              : 'แสดงรายการลงเวลา ภาพถ่าย Selfie ยืนยันตัวตน และการตรวจสอบพิกัด GPS รัศมีสาขา'}
          </p>
        </div>

        {/* Admin Quick Action Button: Add manual record for app crash / internet down & Clear Test Data */}
        <div className="flex flex-wrap items-center gap-2">
          {currentUser.role === 'admin' && (
            <button
              type="button"
              onClick={() => setIsClearAllModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs"
              title="ล้างข้อมูลทดสอบระบบเพื่อเตรียมพร้อมใช้งานจริง"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>ล้างข้อมูลทดสอบ (Clear Test Data)</span>
            </button>
          )}

          {canEditAttendance && onSaveRecord && (
            <button
              type="button"
              onClick={handleOpenCreateManual}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ บันทึกเวลาย้อนหลัง (กรณีเน็ตหลุด/แอปล่ม)</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating / Inline Batch Selection Action Bar */}
      {selectedRecordIds.length > 0 && (
        <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-3 border border-slate-700 animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <span className="bg-indigo-600 text-white px-2.5 py-1 rounded-lg">
              เลือก {selectedRecordIds.length} รายการ
            </span>
            <span className="text-slate-300">
              จากทั้งหมด {filteredRecords.length} รายการที่กำลังแสดง
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenBatchDeleteModal}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ลบรายการทดสอบที่เลือก ({selectedRecordIds.length} รายการ)</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedRecordIds([])}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition cursor-pointer"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาชื่อพนักงาน หมายเหตุ หรือเหตุผลปรับแก้..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Branch Filter (Hidden/Locked if Restricted to Branch) */}
          {!isBranchRestricted && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Building2 className="w-4 h-4 text-slate-400" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-700 font-bold focus:outline-hidden cursor-pointer"
              >
                <option value="all">ทุกสาขา</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Filter */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-700 font-bold focus:outline-hidden cursor-pointer"
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
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
                {canEditAttendance && (
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredRecords.length > 0 &&
                        filteredRecords.every((r) => selectedRecordIds.includes(r.id))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          const allIds = Array.from(
                            new Set([...selectedRecordIds, ...filteredRecords.map((r) => r.id)])
                          );
                          setSelectedRecordIds(allIds);
                        } else {
                          const currentVisibleIds = new Set(filteredRecords.map((r) => r.id));
                          setSelectedRecordIds(
                            selectedRecordIds.filter((id) => !currentVisibleIds.has(id))
                          );
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      title="เลือกทั้งหมด / ยกเลิกทั้งหมด"
                    />
                  </th>
                )}
                <th className="py-3 px-4">วันที่ / เวลา</th>
                <th className="py-3 px-4">พนักงาน</th>
                <th className="py-3 px-4">สาขาที่ลงเวลา</th>
                <th className="py-3 px-4 text-center">รูปถ่าย Selfie</th>
                <th className="py-3 px-4 text-center">ระยะ GPS</th>
                <th className="py-3 px-4 text-center">สถานะ</th>
                <th className="py-3 px-4">หมายเหตุ & ประวัติปรับแก้</th>
                {canEditAttendance && (
                  <th className="py-3 px-4 text-right">จัดการ</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={canEditAttendance ? 9 : 7}
                    className="py-12 text-center text-slate-400 text-xs font-medium"
                  >
                    ไม่พบข้อมูลประวัติการลงเวลาตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr
                    key={rec.id}
                    className={`transition-colors ${
                      selectedRecordIds.includes(rec.id)
                        ? 'bg-indigo-50/70 hover:bg-indigo-50'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {canEditAttendance && (
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedRecordIds.includes(rec.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRecordIds([...selectedRecordIds, rec.id]);
                            } else {
                              setSelectedRecordIds(
                                selectedRecordIds.filter((id) => id !== rec.id)
                              );
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{rec.date}</span>
                        {rec.isAdjustedByAdmin && (
                          <span
                            className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold"
                            title={`ปรับแก้โดย: ${rec.adjustedByAdminName || 'Admin'} (${rec.adminAdjustReason || 'ระบุเวลาโดยผู้ดูแลระบบ'})`}
                          >
                            🛠️ ปรับแก้
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-indigo-600 font-bold mt-0.5">
                        เข้า: {rec.timeIn || '-'} | ออก: {rec.timeOut || '-'}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-800">{rec.employeeName}</td>

                    <td className="py-3 px-4 text-slate-600 font-medium">{rec.branchName}</td>

                    {/* Selfie Lightbox trigger */}
                    <td className="py-3 px-4 text-center">
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
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 group-hover:opacity-80 transition"
                              referrerPolicy="no-referrer"
                            />
                            <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[9px] px-1 rounded-full font-bold">
                              In
                            </span>
                          </button>
                        ) : rec.isAdjustedByAdmin ? (
                          <span className="text-[10px] px-2 py-1 rounded bg-slate-100 text-slate-500 font-semibold border border-slate-200" title="ลงเวลาย้อนหลังโดย Admin">
                            Admin
                          </span>
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
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 group-hover:opacity-80 transition"
                              referrerPolicy="no-referrer"
                            />
                            <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[9px] px-1 rounded-full font-bold">
                              Out
                            </span>
                          </button>
                        )}
                      </div>
                    </td>

                    {/* GPS Validity */}
                    <td className="py-3 px-4 text-center font-mono">
                      {rec.isAdjustedByAdmin && rec.isWithinRadiusIn ? (
                        <div className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="text-[10px] font-bold">รับรองโดย Admin</span>
                        </div>
                      ) : rec.distanceInMeters !== undefined ? (
                        <div className="inline-flex items-center gap-1">
                          {rec.isWithinRadiusIn ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          )}
                          <span
                            className={`text-[11px] font-bold ${
                              rec.isWithinRadiusIn ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                          >
                            {rec.distanceInMeters}m
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.status === 'present'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.status === 'late'
                            ? 'bg-amber-100 text-amber-800'
                            : rec.status === 'early_leave'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {rec.status === 'present'
                          ? '✓ ปกติ'
                          : rec.status === 'late'
                          ? '⚠️ สาย'
                          : rec.status === 'early_leave'
                          ? '⏱️ ออกก่อน'
                          : '✕ ขาด'}
                      </span>
                    </td>

                    {/* Notes & Admin Reason */}
                    <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs">
                      {rec.adminAdjustReason ? (
                        <div className="space-y-0.5">
                          <div className="text-amber-800 font-medium flex items-center gap-1">
                            <Wrench className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>{rec.adminAdjustReason}</span>
                          </div>
                          {rec.notes && <div className="text-slate-400 text-[10px]">บันทึกเดิม: {rec.notes}</div>}
                        </div>
                      ) : (
                        <span>{rec.notes || '-'}</span>
                      )}
                    </td>

                    {/* Actions for Admin / Authorized Manager */}
                    {canEditAttendance && (
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(rec)}
                            className="text-slate-500 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-indigo-50 transition cursor-pointer"
                            title="แก้ไขบันทึกเวลา (Admin Adjustment)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setRecordToDelete(rec)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                            title="ลบรายการนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Attendance Edit / Manual Clock-In Movable Modal */}
      {isAdjustModalOpen && (
        <MovableModal
          isOpen={isAdjustModalOpen}
          onClose={() => setIsAdjustModalOpen(false)}
          title={editingRecord ? 'แก้ไขเวลาปฏิบัติงาน (Admin Edit)' : 'บันทึกเวลาย้อนหลัง (Manual Attendance)'}
          subtitle="สำหรับกรณีพนักงานเน็ตหลุด แอปล่ม หรือลืมสแกนเวลา เพื่อให้ข้อมูลเงินเดือนและสถิติถูกต้อง"
          icon={<Wrench className="w-5 h-5 text-indigo-400" />}
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleSaveModal} className="p-5 sm:p-6 space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">การปรับแก้โดยผู้ดูแลระบบ (Audit Logging):</span>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  ทุกการปรับแก้จะบันทึกชื่อผู้แก้ไข ({currentUser.fullName}) และเวลาที่ปรับปรุง เพื่อความโปร่งใสในระบบเงินเดือน
                </p>
              </div>
            </div>

            {/* Employee Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                พนักงาน <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.employeeId}
                onChange={(e) => {
                  const emp = employees.find((emp) => emp.id === e.target.value);
                  setFormData({
                    ...formData,
                    employeeId: e.target.value,
                    employeeName: emp?.fullName || formData.employeeName,
                    branchId: emp?.branchId || formData.branchId,
                  });
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                required
              >
                <option value="">-- เลือกพนักงาน --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.empCode ? `[${emp.empCode}] ` : ''}{emp.fullName} - {emp.position} ({branchMap.get(emp.branchId) || 'ไม่ระบุสาขา'})
                  </option>
                ))}
              </select>
            </div>

            {/* Branch & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  สาขาที่ปฏิบัติงาน <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.branchId}
                  onChange={(e) => {
                    const br = branches.find((b) => b.id === e.target.value);
                    setFormData({
                      ...formData,
                      branchId: e.target.value,
                      branchName: br?.name || formData.branchName,
                    });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.startWorkTime || '08:30'} - {b.endWorkTime || '17:30'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  วันที่ปฏิบัติงาน <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>
            </div>

            {/* Clock-In & Clock-Out Times */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">เวลาเข้างาน (Time In)</label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, timeIn: '' })}
                    className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold cursor-pointer"
                  >
                    ล้างค่า
                  </button>
                </div>
                <input
                  type="time"
                  step="1"
                  value={formData.timeIn}
                  onChange={(e) => setFormData({ ...formData, timeIn: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <div className="flex gap-1.5 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, timeIn: '08:30:00' })}
                    className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    08:30
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, timeIn: '09:00:00' })}
                    className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    09:00
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">เวลาออกงาน (Time Out)</label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, timeOut: '' })}
                    className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold cursor-pointer"
                  >
                    ล้างค่า
                  </button>
                </div>
                <input
                  type="time"
                  step="1"
                  value={formData.timeOut}
                  onChange={(e) => setFormData({ ...formData, timeOut: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <div className="flex gap-1.5 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, timeOut: '17:30:00' })}
                    className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    17:30
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, timeOut: '18:00:00' })}
                    className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    18:00
                  </button>
                </div>
              </div>
            </div>

            {/* Attendance Status */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">สถานะการลงเวลา</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'present', label: '✓ ปกติ', color: 'text-emerald-700 border-emerald-300 bg-emerald-50' },
                  { id: 'late', label: '⚠️ สาย', color: 'text-amber-700 border-amber-300 bg-amber-50' },
                  { id: 'early_leave', label: '⏱️ ออกก่อน', color: 'text-purple-700 border-purple-300 bg-purple-50' },
                  { id: 'absent', label: '✕ ขาดงาน', color: 'text-rose-700 border-rose-300 bg-rose-50' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, status: st.id as any })}
                    className={`py-2 px-1 text-center rounded-xl border text-xs font-bold transition cursor-pointer ${
                      formData.status === st.id
                        ? `${st.color} ring-2 ring-indigo-500 shadow-xs`
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* GPS Radius Approval Bypass Toggle */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800">รับรองพิกัด GPS สาขา (Bypass GPS)</div>
                <div className="text-[11px] text-slate-500">
                  ทำเครื่องหมายว่าพนักงานปฏิบัติงานจริงที่สาขา (กรณี GPS มือถือเพี้ยนหรือเน็ตหลุด)
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.approveGps}
                onChange={(e) => setFormData({ ...formData, approveGps: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            {/* Reason for Adjustment (Quick Presets) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                เหตุผลในการปรับแก้ / บันทึกเวลาย้อนหลัง <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {quickReasons.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setFormData({ ...formData, adminAdjustReason: reason })}
                    className={`text-[10px] px-2.5 py-1 rounded-full border transition cursor-pointer ${
                      formData.adminAdjustReason === reason
                        ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={formData.adminAdjustReason}
                onChange={(e) => setFormData({ ...formData, adminAdjustReason: e.target.value })}
                placeholder="ระบุเหตุผล เช่น แอปล่ม, ลืมสแกนเวลา, เน็ตขัดข้อง"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                required
              />
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{editingRecord ? 'บันทึกการแก้ไข' : 'เพิ่มบันทึกเวลา'}</span>
              </button>
            </div>
          </form>
        </MovableModal>
      )}

      {/* Admin Clear All Test Data Confirmation Modal */}
      {isClearAllModalOpen && (
        <MovableModal
          isOpen={isClearAllModalOpen}
          onClose={() => setIsClearAllModalOpen(false)}
          title="ล้างข้อมูลเก่าจากการทดสอบระบบ (Clear Test Data)"
          subtitle="สำหรับ Admin: ลบข้อมูลทดสอบระบบ เพื่อเตรียมพร้อมสำหรับการลงเวลาจริงของพนักงาน"
          icon={<Trash2 className="w-5 h-5 text-rose-500" />}
          maxWidth="max-w-md"
        >
          <div className="p-5 space-y-4">
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-800 space-y-1">
                <p className="font-bold">คำเตือนการลบข้อมูลทดสอบ:</p>
                <p>
                  ข้อมูลที่เลือกลบจะถูกลบออกจากฐานข้อมูลและหน่วยความจำอย่างถาวร
                  โปรดตรวจสอบขอบเขตข้อมูลที่ต้องการล้างก่อนยืนยัน
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-slate-800">
                เลือกขอบเขตข้อมูลที่ต้องการล้าง:
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                <input
                  type="radio"
                  name="clearScope"
                  checked={clearScope === 'all'}
                  onChange={() => setClearScope('all')}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800 block">
                    1. ลบประวัติการลงเวลาทั้งหมดทุกสาขา
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    ล้างประวัติการเข้า-ออกงานทั้งหมดในระบบ ({records.length} รายการ)
                  </span>
                </div>
              </label>

              {selectedBranch !== 'all' && (
                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                  <input
                    type="radio"
                    name="clearScope"
                    checked={clearScope === 'branch'}
                    onChange={() => setClearScope('branch')}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 block">
                      2. ลบเฉพาะสาขาที่กำลังเลือก: {branchMap.get(selectedBranch)}
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      ลบข้อมูลเฉพาะสาขานี้ ({records.filter((r) => r.branchId === selectedBranch).length} รายการ)
                    </span>
                  </div>
                </label>
              )}

              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                <input
                  type="radio"
                  name="clearScope"
                  checked={clearScope === 'filtered'}
                  onChange={() => setClearScope('filtered')}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800 block">
                    3. ลบเฉพาะรายการที่ตรงกับการค้นหา/ตัวกรองปัจจุบัน
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    ลบตามผลลัพธ์ที่กำลังแสดงในตารางขณะนี้ ({filteredRecords.length} รายการ)
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>ยืนยันลบข้อมูลทดสอบ</span>
              </button>
            </div>
          </div>
        </MovableModal>
      )}

      {/* In-App Single Record Deletion Confirmation Modal */}
      {recordToDelete && (
        <MovableModal
          isOpen={Boolean(recordToDelete)}
          onClose={() => setRecordToDelete(null)}
          title="ยืนยันการลบรายการประวัติการลงเวลา"
          subtitle="คลิกลากเพื่อเลื่อนหน้าต่างได้ ข้อมูลจะถูกลบออกจากระบบอย่างถาวร"
          icon={<Trash2 className="w-5 h-5 text-rose-400" />}
          headerColorClass="bg-rose-950 text-white"
          maxWidth="max-w-md"
        >
          <div className="p-5 space-y-4">
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-900 space-y-1">
                <p className="font-bold">คุณต้องการลบข้อมูลประวัติการลงเวลานี้ใช่หรือไม่?</p>
                <p className="text-rose-700">
                  ข้อมูลการลงเวลา พิกัด GPS และรูปภาพ Selfie จะถูกลบออกจากระบบและไม่สามารถกู้คืนได้
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">พนักงาน:</span>
                <span className="font-bold text-slate-800">{recordToDelete.employeeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">สาขา:</span>
                <span className="font-bold text-slate-800">{recordToDelete.branchName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">วันที่:</span>
                <span className="font-mono font-bold text-slate-800">{recordToDelete.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">เวลา เข้า / ออก:</span>
                <span className="font-mono text-slate-700">
                  {recordToDelete.timeIn || '-'} / {recordToDelete.timeOut || '-'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>ยืนยันลบรายการนี้</span>
              </button>
            </div>
          </div>
        </MovableModal>
      )}

      {/* In-App Batch Deletion Confirmation Modal */}
      {isBatchDeleteModalOpen && (
        <MovableModal
          isOpen={isBatchDeleteModalOpen}
          onClose={() => setIsBatchDeleteModalOpen(false)}
          title={`ยืนยันการลบรายการที่เลือก (${selectedRecordIds.length} รายการ)`}
          subtitle="คลิกลากเพื่อเลื่อนหน้าต่างได้ ข้อมูลจะถูกลบออกจากระบบอย่างถาวร"
          icon={<Trash2 className="w-5 h-5 text-rose-400" />}
          headerColorClass="bg-rose-950 text-white"
          maxWidth="max-w-md"
        >
          <div className="p-5 space-y-4">
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-900 space-y-1">
                <p className="font-bold">
                  คุณกำลังจะลบข้อมูลประวัติการลงเวลาทดสอบที่เลือกจำนวน {selectedRecordIds.length} รายการ
                </p>
                <p className="text-rose-700">
                  การลบนี้จะนำข้อมูลออกจากฐานข้อมูลทันที เหมาะสำหรับการเคลียร์ข้อมูลช่วงทดสอบระบบ
                </p>
              </div>
            </div>

            {/* List preview of items to delete */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs max-h-40 overflow-y-auto space-y-1.5">
              <div className="text-[11px] font-bold text-slate-500 uppercase">รายการที่จะถูกลบ:</div>
              {records
                .filter((r) => selectedRecordIds.includes(r.id))
                .slice(0, 5)
                .map((r) => (
                  <div key={r.id} className="flex justify-between items-center py-1 border-b border-slate-200/60 last:border-0">
                    <span className="font-medium text-slate-800 truncate mr-2">{r.employeeName}</span>
                    <span className="font-mono text-slate-500 text-[11px] shrink-0">
                      {r.date} ({r.branchName})
                    </span>
                  </div>
                ))}
              {selectedRecordIds.length > 5 && (
                <div className="text-slate-400 text-[11px] text-center pt-1">
                  และอีก {selectedRecordIds.length - 5} รายการ...
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsBatchDeleteModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>ยืนยันลบ {selectedRecordIds.length} รายการ</span>
              </button>
            </div>
          </div>
        </MovableModal>
      )}

      {/* Floating Success Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1 ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Selfie Image Lightbox Preview Modal */}
      {previewSelfieUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-sm w-full border border-slate-200">
            <div className="bg-slate-900 text-white p-3 flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-indigo-400" /> รูปถ่าย Selfie ยืนยันตัวตน
              </span>
              <button
                onClick={() => setPreviewSelfieUrl(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 bg-slate-100 flex items-center justify-center">
              <img
                src={previewSelfieUrl}
                alt="Selfie Preview"
                className="w-full h-80 object-cover rounded-xl shadow-inner border border-slate-200"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-3 text-center">
              <button
                onClick={() => setPreviewSelfieUrl(null)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

