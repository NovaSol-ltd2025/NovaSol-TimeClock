import React, { useState, useRef, useEffect } from 'react';
import { Employee, Branch, EmployeeStatus, UserRight } from './types';
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
  Camera,
  Upload,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';
import { MovableModal } from './MovableModal';

interface EmployeeManagementProps {
  employees: Employee[];
  branches: Branch[];
  onSaveEmployee: (emp: Employee) => void;
  onDeleteEmployee: (empId: string) => void;
  canEdit: boolean;
  currentUser?: UserRight;
}

export const EmployeeManagement: React.FC<EmployeeManagementProps> = ({
  employees,
  branches,
  onSaveEmployee,
  onDeleteEmployee,
  canEdit,
  currentUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  // If user is non-admin and restricted to a branch, default to their branch
  const isBranchRestricted =
    currentUser &&
    currentUser.role !== 'admin' &&
    currentUser.branchScope &&
    currentUser.branchScope !== 'all';

  const userBranchId = isBranchRestricted ? currentUser.branchScope! : 'all';

  const [selectedBranch, setSelectedBranch] = useState<string>(userBranchId);
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
  const [empToDelete, setEmpToDelete] = useState<Employee | null>(null);

  // Camera capture inside modal state (Requirement 2)
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Keep branch in sync if restricted
  useEffect(() => {
    if (isBranchRestricted) {
      setSelectedBranch(userBranchId);
    }
  }, [isBranchRestricted, userBranchId]);

  // Clean up camera stream when modal closes
  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 } },
        audio: false,
      });
      cameraStreamRef.current = stream;
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setFormError('ไม่สามารถเปิดกล้องได้ กรุณาตรวจสอบการอนุญาตใช้งานกล้อง');
      setIsCameraActive(false);
    }
  };

  // Capture frame from webcam
  const handleCapturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 320;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 320, 320);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setFormData((prev) => ({ ...prev, avatarUrl: dataUrl }));
      }
      stopCamera();
    }
  };

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress to compact dimensions for optimal storage
        const canvas = document.createElement('canvas');
        const maxDim = 320;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setFormData((prev) => ({ ...prev, avatarUrl: compressed }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const branchMap = new Map(branches.map((b) => [b.id, b.name]));

  // Open modal for Create or Edit
  const handleOpenModal = (emp?: Employee) => {
    stopCamera();
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
      const defaultBranch = isBranchRestricted ? userBranchId : branches[0]?.id || '';
      const autoCode = `NS-${nextCodeNum.toString().padStart(3, '0')}`;
      const randomPin = Math.floor(1000 + Math.random() * 9000).toString();

      setFormData({
        empCode: autoCode,
        fullName: '',
        branchId: defaultBranch,
        pin: randomPin,
        status: 'active',
        position: 'พนักงานทั่วไป',
        department: 'ปฏิบัติการ',
        phone: '',
        email: '',
        joinedDate: new Date().toISOString().split('T')[0],
        avatarUrl: '',
      });
    }
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    stopCamera();
    setIsModalOpen(false);
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
      empCode: formData.empCode.trim() || `NS-${Math.floor(100 + Math.random() * 900)}`,
      fullName: formData.fullName.trim(),
      branchId: formData.branchId,
      pin: formData.pin,
      status: formData.status,
      position: formData.position || 'พนักงาน',
      department: formData.department,
      phone: formData.phone,
      email: formData.email,
      joinedDate: formData.joinedDate,
      avatarUrl: formData.avatarUrl || undefined,
    };

    onSaveEmployee(newEmp);
    handleCloseModal();
  };

  // Requirement 3: Branch-specific data filtering for non-admin users
  const visibleBranches = isBranchRestricted
    ? branches.filter((b) => b.id === userBranchId)
    : branches;

  const filteredEmployees = employees.filter((emp) => {
    // If user is restricted to branch, strictly filter by branch
    if (isBranchRestricted && emp.branchId !== userBranchId) {
      return false;
    }

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
      {/* Top Header Card - Daytime Theme */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            ข้อมูลบุคลากร & พนักงาน (Employee Records)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isBranchRestricted
              ? `แสดงเฉพาะพนักงานสังกัดสาขา: ${branchMap.get(userBranchId) || userBranchId}`
              : 'จัดการฐานข้อมูลพนักงานประจำสาขา, รหัสพนักงาน, รูปภาพ และรหัส PIN 4 หลัก'}
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-2 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ เพิ่มพนักงานใหม่</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, รหัสพนักงาน (เช่น NS02-006), ตำแหน่ง..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Branch Filter (Hidden or disabled if restricted to branch) */}
          {!isBranchRestricted && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="all">ทุกสาขา ({employees.length})</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="active">ทำงานอยู่ (Active)</option>
            <option value="terminated">เลิกจ้างแล้ว (Terminated)</option>
          </select>
        </div>
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400 text-xs">
            ไม่พบข้อมูลพนักงานที่ตรงกับเงื่อนไขการค้นหา
          </div>
        ) : null}

        {filteredEmployees.map((emp) => (
          <div
            key={emp.id}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition p-5 flex flex-col justify-between"
          >
            <div>
              {/* Header Info */}
              <div className="flex items-start gap-3.5">
                {emp.avatarUrl ? (
                  <img
                    src={emp.avatarUrl}
                    alt={emp.fullName}
                    className="w-13 h-13 rounded-2xl object-cover border-2 border-indigo-100 shadow-2xs shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-13 h-13 rounded-2xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-lg shrink-0 border border-indigo-200">
                    {emp.fullName.charAt(0)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200">
                      {emp.empCode}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        emp.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {emp.status === 'active' ? '● ทำงานอยู่' : '○ พ้นสภาพ'}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm truncate mt-1">{emp.fullName}</h3>
                  <p className="text-xs text-slate-500 truncate">{emp.position}</p>
                </div>
              </div>

              {/* Details */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" /> สาขาที่สังกัด:
                  </span>
                  <span className="font-bold text-slate-800">
                    {branchMap.get(emp.branchId) || '-'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-amber-500" /> รหัส PIN เช็คอิน:
                  </span>
                  <span className="font-mono font-bold bg-amber-50 text-amber-900 px-2 py-0.5 rounded border border-amber-200 text-xs">
                    •••• ({emp.pin})
                  </span>
                </div>

                {emp.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> เบอร์โทรศัพท์:
                    </span>
                    <span className="font-medium text-slate-700">{emp.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Actions */}
            {canEdit && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenModal(emp)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1 cursor-pointer transition"
                >
                  <Edit2 className="w-3.5 h-3.5" /> แก้ไข
                </button>
                <button
                  type="button"
                  onClick={() => setEmpToDelete(emp)}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs flex items-center gap-1 cursor-pointer transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> ลบ
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal for Create/Edit Employee with Photo Functionality with Movable & Scrollable Features (Requirement 2) */}
      <MovableModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingEmp ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่'}
        subtitle="คลิกลากแถบหัวข้อเพื่อขยับฟอร์ม / สามารถเลื่อนดูช่องกรอกและปุ่มบันทึกได้"
        icon={<UserPlus className="w-5 h-5 text-indigo-400" />}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Requirement 2: Employee Photo Upload & Live Camera Capture Section */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-indigo-600" />
                  รูปภาพประจำตัวพนักงาน (Employee Photo)
                </label>

                {/* Camera Mode */}
                {isCameraActive ? (
                  <div className="space-y-2">
                    <div className="relative w-48 h-48 mx-auto rounded-2xl overflow-hidden border-2 border-indigo-500 bg-black shadow-md">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={handleCapturePhoto}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>กดถ่ายภาพนี้</span>
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                      >
                        ยกเลิกกล้อง
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    {/* Avatar Preview */}
                    <div className="relative shrink-0">
                      {formData.avatarUrl ? (
                        <img
                          src={formData.avatarUrl}
                          alt="Preview"
                          className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-300 shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-2xl border-2 border-dashed border-indigo-300">
                          {formData.fullName ? formData.fullName.charAt(0) : '?'}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap gap-2">
                        {/* File Upload Button */}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>อัปโหลดรูปภาพ</span>
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                        />

                        {/* Webcam Capture Button */}
                        <button
                          type="button"
                          onClick={startCamera}
                          className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>ถ่ายภาพจากกล้อง</span>
                        </button>

                        {formData.avatarUrl && (
                          <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, avatarUrl: '' }))}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs rounded-xl cursor-pointer"
                          >
                            ลบรูป
                          </button>
                        )}
                      </div>

                      {/* URL input fallback */}
                      <input
                        type="url"
                        value={formData.avatarUrl.startsWith('data:') ? '' : formData.avatarUrl}
                        onChange={(e) =>
                          setFormData({ ...formData, avatarUrl: e.target.value })
                        }
                        placeholder="หรือวางลิงก์ URL รูปภาพ เช่น https://..."
                        className="w-full px-2.5 py-1 text-[11px] border border-slate-300 rounded-lg bg-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Code & PIN */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    รหัสพนักงาน (Employee ID) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.empCode}
                    onChange={(e) => setFormData({ ...formData, empCode: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono font-bold bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    placeholder="เช่น NS02-006 หรือ NS-001"
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
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono font-bold text-center tracking-widest text-indigo-700 bg-amber-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
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
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                  placeholder="เช่น คุณสมชาย ใจดี"
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
                    disabled={Boolean(isBranchRestricted)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white font-medium disabled:bg-slate-100"
                  >
                    {visibleBranches.map((b) => (
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
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
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
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
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
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    placeholder="081-234-5678"
                  />
                </div>
              </div>
            </div>

          <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer transition-colors"
            >
              {editingEmp ? 'บันทึกการแก้ไข' : 'บันทึกเพิ่มพนักงาน'}
            </button>
          </div>
        </form>
      </MovableModal>

      {/* In-App Employee Deletion Confirmation Modal */}
      {empToDelete && (
        <MovableModal
          isOpen={Boolean(empToDelete)}
          onClose={() => setEmpToDelete(null)}
          title="ยืนยันการลบพนักงาน"
          subtitle="คลิกลากเพื่อเลื่อนหน้าต่างได้"
          icon={<Trash2 className="w-5 h-5 text-rose-400" />}
          headerColorClass="bg-rose-950 text-white"
          maxWidth="max-w-md"
        >
          <div className="p-5 space-y-4">
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-900 space-y-1">
                <p className="font-bold">
                  คุณต้องการลบพนักงาน "{empToDelete.fullName}" ({empToDelete.empCode}) ออกจากระบบใช่หรือไม่?
                </p>
                <p className="text-rose-700">การลบพนักงานจะไม่สามารถกู้คืนข้อมูลได้</p>
              </div>
            </div>
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEmpToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteEmployee(empToDelete.id);
                  setEmpToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>ยืนยันลบพนักงาน</span>
              </button>
            </div>
          </div>
        </MovableModal>
      )}
    </div>
  );
};
