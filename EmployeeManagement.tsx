import React, { useState } from 'react';
import { Employee, Branch, EmployeeStatus } from '../types';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  KeyRound,
  Building2,
  CheckCircle2,
  XCircle,
  X,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  Filter,
} from 'lucide-react';

interface EmployeeManagementProps {
  employees: Employee[];
  branches: Branch[];
  onSaveEmployee: (emp: Employee) => void;
  onDeleteEmployee: (empId: string) => void;
  canEdit: boolean;
}

export const EmployeeManagement: React.FC<EmployeeManagementProps> = ({
  employees,
  branches,
  onSaveEmployee,
  onDeleteEmployee,
  canEdit,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    id?: string;
    empCode: string;
    fullName: string;
    branchId: string;
    pin: string;
    status: EmployeeStatus;
    position: string;
    department: string;
    phone: string;
    email: string;
    joinedDate: string;
    avatarUrl: string;
  }>({
    empCode: '',
    fullName: '',
    branchId: branches[0]?.id || '',
    pin: '',
    status: 'active',
    position: '',
    department: '',
    phone: '',
    email: '',
    joinedDate: new Date().toISOString().split('T')[0],
    avatarUrl: '',
  });

  const [formError, setFormError] = useState('');

  const branchMap = new Map(branches.map((b) => [b.id, b.name]));

  // Open modal for Create or Edit
  const handleOpenModal = (emp?: Employee) => {
    if (emp) {
      setEditingEmp(emp);
      setFormData({
        id: emp.id,
        empCode: emp.empCode,
        fullName: emp.fullName,
        branchId: emp.branchId,
        pin: emp.pin,
        status: emp.status,
        position: emp.position,
        department: emp.department || '',
        phone: emp.phone || '',
        email: emp.email || '',
        joinedDate: emp.joinedDate,
        avatarUrl: emp.avatarUrl || '',
      });
    } else {
      setEditingEmp(null);
      const nextCodeNum = employees.length + 1;
      const autoCode = `NS-${nextCodeNum.toString().padStart(3, '0')}`;
      const randomPin = Math.floor(1000 + Math.random() * 9000).toString();

      setFormData({
        empCode: autoCode,
        fullName: '',
        branchId: branches[0]?.id || '',
        pin: randomPin,
        status: 'active',
        position: 'พนักงานทั่วไป',
        department: 'ปฏิบัติการ',
        phone: '',
        email: '',
        joinedDate: new Date().toISOString().split('T')[0],
        avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200`,
      });
    }
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setFormError('กรุณากรอก ชื่อ-นามสกุล พนักงาน');
      return;
    }
    if (!formData.pin || formData.pin.length !== 4 || !/^\d{4}$/.test(formData.pin)) {
      setFormError('รหัส PIN ต้องเป็นตัวเลข 4 หลักเท่านั้น (เช่น 1234)');
      return;
    }
    if (!formData.branchId) {
      setFormError('กรุณาเลือกสาขาที่พนักงานสังกัด');
      return;
    }

    const newEmp: Employee = {
      id: formData.id || `emp-${Date.now()}`,
      empCode: formData.empCode || `NS-${Math.floor(100 + Math.random() * 900)}`,
      fullName: formData.fullName.trim(),
      branchId: formData.branchId,
      pin: formData.pin,
      status: formData.status,
      position: formData.position || 'พนักงาน',
      department: formData.department,
      phone: formData.phone,
      email: formData.email,
      joinedDate: formData.joinedDate,
      avatarUrl: formData.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    };

    onSaveEmployee(newEmp);
    setIsModalOpen(false);
  };

  // Filtered employees list
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.empCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = selectedBranch === 'all' || emp.branchId === selectedBranch;
    const matchesStatus = selectedStatus === 'all' || emp.status === selectedStatus;
    return matchesSearch && matchesBranch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Search Control */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            จัดการข้อมูลพนักงาน (Employee Directory)
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            เพิ่ม แก้ไข ไขรหัส PIN 4 หลัก สาขาที่สังกัด และกำหนดสถานะ (ทำงานอยู่ / เลิกจ้างแล้ว)
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-md shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ เพิ่มพนักงานใหม่</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, รหัสพนักงาน, ตำแหน่ง..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-700 font-bold focus:outline-hidden cursor-pointer"
          >
            <option value="all">ทุกสาขา</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-700 font-bold focus:outline-hidden cursor-pointer"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="active">ทำงานอยู่ (Active)</option>
            <option value="terminated">เลิกจ้างแล้ว (Terminated)</option>
          </select>
        </div>
      </div>

      {/* Employee List Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((emp) => (
          <div
            key={emp.id}
            className={`bg-white rounded-xl border p-4 transition shadow-sm hover:border-slate-300 relative flex flex-col justify-between ${
              emp.status === 'terminated'
                ? 'border-red-200 bg-red-50/20 opacity-80'
                : 'border-slate-200'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      emp.avatarUrl ||
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
                    }
                    alt={emp.fullName}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs"
                  />
                  <div>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {emp.empCode}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-0.5">{emp.fullName}</h3>
                    <p className="text-[11px] text-slate-500 font-medium">{emp.position}</p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    emp.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {emp.status === 'active' ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" /> ทำงานอยู่
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3" /> เลิกจ้างแล้ว
                    </>
                  )}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" /> สาขาปฏิบัติงาน:
                  </span>
                  <span className="font-bold text-slate-800">
                    {branchMap.get(emp.branchId) || '-'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-amber-500" /> รหัส PIN 4 หลัก:
                  </span>
                  <span className="font-mono font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                    •••• ({emp.pin})
                  </span>
                </div>

                {emp.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> เบอร์โทรศัพท์:
                    </span>
                    <span className="font-medium text-slate-700">{emp.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Admin CRUD Actions */}
            {canEdit && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenModal(emp)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1 cursor-pointer transition"
                >
                  <Edit2 className="w-3.5 h-3.5" /> แก้ไข
                </button>
                <button
                  onClick={() => {
                    if (
                      confirm(
                        `คุณต้องการลบพนักงาน "${emp.fullName}" (${emp.empCode}) ออกจากระบบใช่หรือไม่?`
                      )
                    ) {
                      onDeleteEmployee(emp.id);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs flex items-center gap-1 cursor-pointer transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> ลบ
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal for Create/Edit Employee */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-[#1e293b] text-white px-5 py-3 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                {editingEmp ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    รหัสพนักงาน
                  </label>
                  <input
                    type="text"
                    value={formData.empCode}
                    onChange={(e) => setFormData({ ...formData, empCode: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md font-mono font-bold bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    placeholder="NS-001"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    รหัส PIN 4 หลัก (สำหรับเช็คอิน) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={formData.pin}
                    onChange={(e) =>
                      setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })
                    }
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md font-mono font-bold text-center tracking-widest text-indigo-700 bg-amber-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    placeholder="1234"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                  placeholder="คุณสมชาย ใจดี"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    สาขาที่ปฏิบัติงาน <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    สถานะการทำงาน <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as EmployeeStatus,
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                  >
                    <option value="active">ทำงานอยู่ (Active)</option>
                    <option value="terminated">เลิกจ้างแล้ว (Terminated)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ตำแหน่ง</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    placeholder="เช่น เจ้าหน้าที่บริการ"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    placeholder="081-234-5678"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-xs cursor-pointer transition-colors"
                >
                  {editingEmp ? 'บันทึกการแก้ไข' : 'บันทึกเพิ่มพนักงาน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
