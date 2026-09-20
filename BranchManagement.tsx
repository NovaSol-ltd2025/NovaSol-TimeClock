import React, { useState } from 'react';
import { Branch, BranchType, UserRight } from './types';
import {
  Building2,
  MapPin,
  Navigation,
  Plus,
  Edit2,
  Trash2,
  X,
  Compass,
  Phone,
  AlertCircle,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { MovableModal } from './MovableModal';

interface BranchManagementProps {
  branches: Branch[];
  onSaveBranch: (branch: Branch) => void;
  onDeleteBranch: (branchId: string) => void;
  canEdit: boolean;
  currentUser?: UserRight | null;
}

export const BranchManagement: React.FC<BranchManagementProps> = ({
  branches,
  onSaveBranch,
  onDeleteBranch,
  canEdit,
  currentUser,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Scoping: If user has a restricted branch scope, filter branches
  const isBranchRestricted =
    currentUser &&
    currentUser.role !== 'admin' &&
    currentUser.branchScope &&
    currentUser.branchScope !== 'all';

  const userBranchId = isBranchRestricted ? currentUser.branchScope! : 'all';
  const visibleBranches = isBranchRestricted
    ? branches.filter((b) => b.id === userBranchId)
    : branches;

  // Only Admin can add a new branch
  const canAddNewBranch = canEdit && currentUser?.role === 'admin';

  const [formData, setFormData] = useState<{
    id?: string;
    name: string;
    type: BranchType;
    latitude: number;
    longitude: number;
    radiusMeters: number;
    address: string;
    phone: string;
    workStartTime: string;
    workEndTime: string;
    lateThresholdMinutes: number;
  }>({
    name: '',
    type: 'sub',
    latitude: 13.7563,
    longitude: 100.5018,
    radiusMeters: 100,
    address: '',
    phone: '',
    workStartTime: '08:30',
    workEndTime: '17:30',
    lateThresholdMinutes: 15,
  });

  const [formError, setFormError] = useState('');
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);

  const handleOpenModal = (branch?: Branch) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({
        id: branch.id,
        name: branch.name,
        type: branch.type,
        latitude: branch.latitude,
        longitude: branch.longitude,
        radiusMeters: branch.radiusMeters,
        address: branch.address || '',
        phone: branch.phone || '',
        workStartTime: branch.workStartTime || '08:30',
        workEndTime: branch.workEndTime || '17:30',
        lateThresholdMinutes:
          branch.lateThresholdMinutes !== undefined ? branch.lateThresholdMinutes : 15,
      });
    } else {
      setEditingBranch(null);
      setFormData({
        name: '',
        type: 'sub',
        latitude: 13.7563,
        longitude: 100.5018,
        radiusMeters: 100,
        address: '',
        phone: '',
        workStartTime: '08:30',
        workEndTime: '17:30',
        lateThresholdMinutes: 15,
      });
    }
    setFormError('');
    setIsModalOpen(true);
  };

  const handleGetDeviceLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData((prev) => ({
            ...prev,
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6)),
          }));
        },
        (err) => {
          setFormError(`ไม่สามารถดึงตำแหน่งปัจจุบันได้: ${err.message}`);
        }
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('กรุณากรอกชื่อสาขา');
      return;
    }
    if (isNaN(formData.latitude) || isNaN(formData.longitude)) {
      setFormError('กรุณากรอกพิกัดละติจูดและลองติจูดให้ถูกต้อง');
      return;
    }
    if (formData.radiusMeters <= 0) {
      setFormError('ระยะทางรัศมีเช็คอินต้องมากกว่า 0 เมตร');
      return;
    }

    const branchToSave: Branch = {
      id: formData.id || `b-${Date.now()}`,
      name: formData.name.trim(),
      type: formData.type,
      latitude: formData.latitude,
      longitude: formData.longitude,
      radiusMeters: Number(formData.radiusMeters),
      address: formData.address,
      phone: formData.phone,
      workStartTime: formData.workStartTime || '08:30',
      workEndTime: formData.workEndTime || '17:30',
      lateThresholdMinutes: Number(formData.lateThresholdMinutes) || 0,
    };

    onSaveBranch(branchToSave);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600" />
            ตั้งค่าสาขา & เวลาเข้า-ออกงาน (Branch & Shift Settings)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            กำหนดตำแหน่งพิกัด GPS, รัศมีระยะทางเช็คอิน และกำหนดเวลาเข้า-ออกงานเฉพาะของแต่ละสาขา
          </p>
        </div>

        {canAddNewBranch && (
          <button
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ เพิ่มสาขาใหม่</span>
          </button>
        )}
      </div>

      {/* Branch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleBranches.map((branch) => (
          <div
            key={branch.id}
            className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">{branch.name}</h3>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        branch.type === 'hq'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {branch.type === 'hq' ? '🏢 สำนักงานใหญ่' : '🏪 สาขาย่อย'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{branch.address || 'ไม่ระบุที่อยู่'}</p>
                </div>
              </div>

              {/* Requirement 4: Custom Work Shift Hours per Branch */}
              <div className="mt-3.5 p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-indigo-900 uppercase">
                      เวลาทำงานประจำสาขา
                    </div>
                    <div className="font-bold text-xs text-indigo-700">
                      {branch.workStartTime || '08:30'} - {branch.workEndTime || '17:30'} น.
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold bg-white text-indigo-700 px-2 py-1 rounded-md border border-indigo-200">
                    ผ่อนผันสาย {branch.lateThresholdMinutes ?? 15} นาที
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="text-slate-400 text-[10px] flex items-center gap-1 font-semibold">
                    <Compass className="w-3.5 h-3.5 text-indigo-600" /> พิกัด GPS (Lat, Lng)
                  </div>
                  <div className="font-mono font-bold text-slate-800 mt-1 text-[11px]">
                    {branch.latitude}, {branch.longitude}
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="text-slate-500 text-[10px] flex items-center gap-1 font-semibold">
                    <Navigation className="w-3.5 h-3.5 text-indigo-600" /> รัศมีอนุญาตเช็คอิน
                  </div>
                  <div className="font-bold text-slate-800 mt-1 text-sm">
                    {branch.radiusMeters} <span className="text-xs font-normal text-slate-500">เมตร</span>
                  </div>
                </div>
              </div>

              {branch.phone && (
                <div className="mt-3 text-xs text-slate-600 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>เบอร์ติดต่อ: {branch.phone}</span>
                </div>
              )}
            </div>

            {canEdit && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenModal(branch)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1 cursor-pointer transition"
                >
                  <Edit2 className="w-3.5 h-3.5" /> แก้ไขสาขา
                </button>
                {branch.type !== 'hq' && (
                  <button
                    type="button"
                    onClick={() => setBranchToDelete(branch)}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs flex items-center gap-1 cursor-pointer transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> ลบสาขา
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal for Create / Edit Branch with Movable & Scrollable Features */}
      <MovableModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBranch ? 'แก้ไขข้อมูลสาขา & เวลาทำงาน' : 'เพิ่มสาขาใหม่'}
        subtitle="คลิกลากแถบหัวข้อเพื่อขยับฟอร์ม / สามารถเลื่อนดูเนื้อหาด้านล่างได้"
        icon={<Building2 className="w-5 h-5 text-indigo-400" />}
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

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ชื่อสาขา <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                placeholder="เช่น สาขาชลบุรี-พัทยา"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ประเภทสาขา</label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as BranchType,
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="sub">สาขาย่อย (Sub-branch)</option>
                  <option value="hq">สำนักงานใหญ่ (Headquarters)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  รัศมีเช็คอิน (เมตร) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.radiusMeters}
                  onChange={(e) =>
                    setFormData({ ...formData, radiusMeters: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold text-indigo-800 bg-indigo-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={50}>50 เมตร (ระยะแคบ)</option>
                  <option value={100}>100 เมตร (มาตรฐาน)</option>
                  <option value={150}>150 เมตร</option>
                  <option value={200}>200 เมตร</option>
                  <option value={500}>500 เมตร (อาคารใหญ่)</option>
                </select>
              </div>
            </div>

            {/* Requirement 4: Shift Times Input Section */}
            <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  กำหนดเวลาเข้า-ออกงานประจำสาขา (Shift Schedule)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                เนื่องจากเวลาทำงานแต่ละสาขาไม่เท่ากัน ระบบจะใช้เวลานี้ในการคำนวณการมาสายและออกงานของสาขานี้
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    เวลาเข้างาน <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.workStartTime}
                    onChange={(e) => setFormData({ ...formData, workStartTime: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs font-bold font-mono border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    เวลาเลิกงาน <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.workEndTime}
                    onChange={(e) => setFormData({ ...formData, workEndTime: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs font-bold font-mono border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    ผ่อนผันสาย (นาที)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={formData.lateThresholdMinutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lateThresholdMinutes: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs font-bold font-mono border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Coordinates block */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" /> พิกัดสถานที่ (GPS Coordinates)
                </span>
                <button
                  type="button"
                  onClick={handleGetDeviceLocation}
                  className="text-[11px] text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-bold px-2.5 py-1 rounded-lg transition cursor-pointer border border-indigo-200"
                >
                  📍 ดึงพิกัดปัจจุบัน
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    ละติจูด (Latitude)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) =>
                      setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    ลองติจูด (Longitude)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) =>
                      setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ที่อยู่สาขา</label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                placeholder="ระบุที่อยู่สำหรับออกเอกสาร..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                เบอร์โทรศัพท์สาขา
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                placeholder="เช่น 02-123-4567"
              />
            </div>
          </div>

          <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm cursor-pointer transition-colors"
            >
              {editingBranch ? 'บันทึกการแก้ไข' : 'บันทึกเพิ่มสาขา'}
            </button>
          </div>
        </form>
      </MovableModal>

      {/* In-App Branch Deletion Confirmation Modal */}
      {branchToDelete && (
        <MovableModal
          isOpen={Boolean(branchToDelete)}
          onClose={() => setBranchToDelete(null)}
          title="ยืนยันการลบสาขา"
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
                  คุณต้องการลบสาขา "{branchToDelete.name}" ออกจากระบบใช่หรือไม่?
                </p>
                <p className="text-rose-700">การลบสาขาจะไม่สามารถกู้คืนข้อมูลได้</p>
              </div>
            </div>
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setBranchToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteBranch(branchToDelete.id);
                  setBranchToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>ยืนยันลบสาขา</span>
              </button>
            </div>
          </div>
        </MovableModal>
      )}
    </div>
  );
};
