import React, { useState } from 'react';
import { Branch, BranchType } from '../types';
import {
  Building2,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Navigation,
  Phone,
  AlertCircle,
  X,
  Compass,
} from 'lucide-react';

interface BranchManagementProps {
  branches: Branch[];
  onSaveBranch: (branch: Branch) => void;
  onDeleteBranch: (branchId: string) => void;
  canEdit: boolean;
}

export const BranchManagement: React.FC<BranchManagementProps> = ({
  branches,
  onSaveBranch,
  onDeleteBranch,
  canEdit,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const [formData, setFormData] = useState<{
    id?: string;
    name: string;
    type: BranchType;
    latitude: number;
    longitude: number;
    radiusMeters: number;
    address: string;
    phone: string;
  }>({
    name: '',
    type: 'sub',
    latitude: 13.7563,
    longitude: 100.5018,
    radiusMeters: 100,
    address: '',
    phone: '',
  });

  const [formError, setFormError] = useState('');

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
    };

    onSaveBranch(branchToSave);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-sky-600" />
            ตั้งค่าสำนักงานใหญ่ & สาขาย่อย (GPS Geofence Settings)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            กำหนดตำแหน่งพิกัด ละติจูด, ลองติจูด และรัศมีระยะทางอนุญาตเช็คอิน (เช่น 100 เมตร)
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => handleOpenModal()}
            className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-sky-600/20 flex items-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ เพิ่มสาขาใหม่</span>
          </button>
        )}
      </div>

      {/* Branch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {branches.map((branch) => (
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
                          ? 'bg-sky-100 text-sky-800 border border-sky-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {branch.type === 'hq' ? '🏢 สำนักงานใหญ่' : '🏪 สาขาย่อย'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{branch.address || 'ไม่ระบุที่อยู่'}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="text-slate-400 text-[10px] flex items-center gap-1 font-semibold">
                    <Compass className="w-3.5 h-3.5 text-sky-600" /> พิกัด GPS (Lat, Lng)
                  </div>
                  <div className="font-mono font-bold text-slate-800 mt-1 text-[11px]">
                    {branch.latitude}, {branch.longitude}
                  </div>
                </div>

                <div className="bg-sky-50 p-2.5 rounded-xl border border-sky-100">
                  <div className="text-sky-700 text-[10px] flex items-center gap-1 font-semibold">
                    <Navigation className="w-3.5 h-3.5 text-sky-600" /> รัศมีอนุญาตเช็คอิน
                  </div>
                  <div className="font-bold text-sky-900 mt-1 text-sm">
                    {branch.radiusMeters} <span className="text-xs font-normal">เมตร</span>
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
                    onClick={() => {
                      if (confirm(`คุณต้องการลบสาขา "${branch.name}" ออกจากระบบใช่หรือไม่?`)) {
                        onDeleteBranch(branch.id);
                      }
                    }}
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

      {/* Modal for Create / Edit Branch */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-sky-400" />
                {editingBranch ? 'แก้ไขข้อมูลสาขา' : 'เพิ่มสาขาใหม่'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
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
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
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
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold text-sky-800 bg-sky-50 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  >
                    <option value={50}>50 เมตร (ระยะแคบ)</option>
                    <option value={100}>100 เมตร (มาตรฐาน)</option>
                    <option value={150}>150 เมตร</option>
                    <option value={200}>200 เมตร</option>
                    <option value={500}>500 เมตร (อาคารใหญ่)</option>
                  </select>
                </div>
              </div>

              {/* Coordinates block */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-sky-600" /> พิกัดสถานที่ (GPS Coordinates)
                  </span>
                  <button
                    type="button"
                    onClick={handleGetDeviceLocation}
                    className="text-[11px] text-sky-700 bg-sky-100 hover:bg-sky-200 font-bold px-2.5 py-1 rounded-lg transition cursor-pointer"
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
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
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
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
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
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
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
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  placeholder="เช่น 02-123-4567"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-md cursor-pointer"
                >
                  {editingBranch ? 'บันทึกการแก้ไขสาขา' : 'บันทึกสร้างสาขา'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
