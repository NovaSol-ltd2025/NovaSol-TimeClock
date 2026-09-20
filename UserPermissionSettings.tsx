import React, { useState } from 'react';
import { UserRight, Role, Employee, Branch } from './types';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  Lock,
  X,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { MovableModal } from './MovableModal';

interface UserPermissionSettingsProps {
  userRights: UserRight[];
  employees: Employee[];
  branches: Branch[];
  onSaveUserRight: (user: UserRight) => void;
  onDeleteUserRight: (userId: string) => void;
  canEdit: boolean;
}

export const UserPermissionSettings: React.FC<UserPermissionSettingsProps> = ({
  userRights,
  employees,
  branches,
  onSaveUserRight,
  onDeleteUserRight,
  canEdit,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRight | null>(null);

  const [formData, setFormData] = useState<{
    id?: string;
    username: string;
    fullName: string;
    role: Role;
    password?: string;
    employeeId: string;
    branchScope: string;
    canManageUsers: boolean;
    canManageEmployees: boolean;
    canManageBranches: boolean;
    canGenerateQr: boolean;
    canExportReports: boolean;
  }>({
    username: '',
    fullName: '',
    role: 'staff',
    password: '',
    employeeId: '',
    branchScope: 'all',
    canManageUsers: false,
    canManageEmployees: false,
    canManageBranches: false,
    canGenerateQr: true,
    canExportReports: false,
  });

  const [formError, setFormError] = useState('');
  const [userToDelete, setUserToDelete] = useState<UserRight | null>(null);

  const handleOpenModal = (user?: UserRight) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        password: user.password || (user.role === 'admin' ? 'admin123' : '123456'),
        employeeId: user.employeeId || '',
        branchScope: user.branchScope || 'all',
        canManageUsers: user.canManageUsers,
        canManageEmployees: user.canManageEmployees,
        canManageBranches: user.canManageBranches,
        canGenerateQr: user.canGenerateQr,
        canExportReports: user.canExportReports,
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        fullName: '',
        role: 'staff',
        password: '123456',
        employeeId: '',
        branchScope: 'all',
        canManageUsers: false,
        canManageEmployees: false,
        canManageBranches: false,
        canGenerateQr: true,
        canExportReports: false,
      });
    }
    setFormError('');
    setIsModalOpen(true);
  };

  const handleRolePreset = (role: Role) => {
    if (role === 'admin') {
      setFormData((prev) => ({
        ...prev,
        role,
        branchScope: 'all',
        canManageUsers: true,
        canManageEmployees: true,
        canManageBranches: true,
        canGenerateQr: true,
        canExportReports: true,
      }));
    } else if (role === 'supervisor') {
      setFormData((prev) => ({
        ...prev,
        role,
        canManageUsers: false,
        canManageEmployees: true,
        canManageBranches: false,
        canGenerateQr: true,
        canExportReports: true,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        role,
        canManageUsers: false,
        canManageEmployees: false,
        canManageBranches: false,
        canGenerateQr: false,
        canExportReports: false,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.fullName.trim()) {
      setFormError('กรุณากรอก Username และ ชื่อผู้ใช้งาน');
      return;
    }

    const newUser: UserRight = {
      id: formData.id || `usr-${Date.now()}`,
      username: formData.username.trim(),
      fullName: formData.fullName.trim(),
      role: formData.role,
      password: formData.password || '123456',
      employeeId: formData.employeeId || undefined,
      branchScope: formData.branchScope,
      canManageUsers: formData.canManageUsers,
      canManageEmployees: formData.canManageEmployees,
      canManageBranches: formData.canManageBranches,
      canGenerateQr: formData.canGenerateQr,
      canExportReports: formData.canExportReports,
    };

    onSaveUserRight(newUser);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-sky-600" />
            ตั้งค่าผู้ใช้งานและกำหนดสิทธิสิทธิ์ (User & Access Permissions)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            กำหนดบทบาท Admin (สิทธิเต็ม), Supervisor (หัวหน้าสาขา) และ Staff (พนักงานลงเวลา)
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => handleOpenModal()}
            className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-sky-600/20 flex items-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ เพิ่มผู้ใช้งานระบบ</span>
          </button>
        )}
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {userRights.map((user) => (
          <div
            key={user.id}
            className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-base">{user.fullName}</span>
                  </div>
                  <p className="text-xs font-mono text-sky-700 bg-sky-50 px-2 py-0.5 rounded inline-block mt-1">
                    @{user.username}
                  </p>
                </div>

                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    user.role === 'admin'
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : user.role === 'supervisor'
                      ? 'bg-sky-100 text-sky-800 border border-sky-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {user.role === 'admin'
                    ? '👑 Admin (ผู้ดูแลระบบ)'
                    : user.role === 'supervisor'
                    ? '👔 Supervisor (หัวหน้า)'
                    : '👤 Staff (พนักงาน)'}
                </span>
              </div>

              {/* Scope & Permissions List */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400">ขอบเขตสาขา:</span>
                  <span className="font-bold text-slate-800">
                    {user.branchScope === 'all'
                      ? '🌐 ทุกสาขา'
                      : branches.find((b) => b.id === user.branchScope)?.name || user.branchScope}
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5 mt-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    สิทธิการใช้งานระบบ
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <div className="flex items-center gap-1">
                      {user.canManageUsers ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-300" />
                      )}
                      <span className={user.canManageUsers ? 'font-semibold text-slate-800' : 'text-slate-400'}>
                        จัดการผู้ใช้งาน
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {user.canManageEmployees ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-300" />
                      )}
                      <span
                        className={
                          user.canManageEmployees ? 'font-semibold text-slate-800' : 'text-slate-400'
                        }
                      >
                        จัดการพนักงาน
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {user.canManageBranches ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-300" />
                      )}
                      <span
                        className={user.canManageBranches ? 'font-semibold text-slate-800' : 'text-slate-400'}
                      >
                        จัดการสาขา
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {user.canExportReports ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-300" />
                      )}
                      <span
                        className={user.canExportReports ? 'font-semibold text-slate-800' : 'text-slate-400'}
                      >
                        พิมพ์รายงาน PDF
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {canEdit && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenModal(user)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1 cursor-pointer transition"
                >
                  <Edit2 className="w-3.5 h-3.5" /> แก้ไขสิทธิ
                </button>
                {user.username !== 'admin' && (
                  <button
                    type="button"
                    onClick={() => setUserToDelete(user)}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs flex items-center gap-1 cursor-pointer transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> ลบ
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal for User Permissions with Movable & Scrollable Features */}
      <MovableModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'แก้ไขสิทธิผู้ใช้งาน' : 'เพิ่มผู้ใช้งานระบบใหม่'}
        subtitle="คลิกลากแถบหัวข้อเพื่อขยับฟอร์ม / สามารถเลื่อนดูสิทธิการเข้าถึงด้านล่างได้"
        icon={<Shield className="w-5 h-5 text-sky-400" />}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Username <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    placeholder="เช่น admin_bkk"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อ-นามสกุล ผู้ใช้ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    placeholder="เช่น คุณกิตติชัย ผู้ดูแล"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  รหัสผ่านเข้าสู่ระบบ (Password) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  placeholder="กรอกรหัสผ่านสำหรับเข้าสู่ระบบ"
                  required
                />
              </div>

              {/* Role Quick Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  บทบาทหลัก (Role Preset)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['admin', 'supervisor', 'staff'] as Role[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRolePreset(r)}
                      className={`px-3 py-2 rounded-xl border text-xs font-bold capitalize transition cursor-pointer ${
                        formData.role === r
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {r === 'admin' ? '👑 Admin' : r === 'supervisor' ? '👔 Supervisor' : '👤 Staff'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Branch Scope */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ขอบเขตการเห็นข้อมูลสาขา
                </label>
                <select
                  value={formData.branchScope}
                  onChange={(e) => setFormData({ ...formData, branchScope: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  <option value="all">🌐 ทุกสาขา (ผู้ดูแลระบบกลาง)</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Checkbox Toggles */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-800 mb-2">
                  กำหนดสิทธิรายละเอียด (Permission Granular Toggles)
                </div>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.canManageUsers}
                    onChange={(e) =>
                      setFormData({ ...formData, canManageUsers: e.target.checked })
                    }
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span>สิทธิจัดการสิทธิผู้ใช้งานระบบ (Manage System Users)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.canManageEmployees}
                    onChange={(e) =>
                      setFormData({ ...formData, canManageEmployees: e.target.checked })
                    }
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span>สิทธิเพิ่ม/แก้ไข/ลบ ข้อมูลพนักงาน (CRUD Employees)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.canManageBranches}
                    onChange={(e) =>
                      setFormData({ ...formData, canManageBranches: e.target.checked })
                    }
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span>สิทธิเพิ่ม/แก้ไข/ตั้งค่าพิกัดสาขา (Branch CRUD & GPS)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.canGenerateQr}
                    onChange={(e) =>
                      setFormData({ ...formData, canGenerateQr: e.target.checked })
                    }
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span>สิทธิสร้าง QR Code เช็คอินสาขา (Generate QR Code)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.canExportReports}
                    onChange={(e) =>
                      setFormData({ ...formData, canExportReports: e.target.checked })
                    }
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span>สิทธิพิมพ์รายงานสรุปการเข้างาน / ส่งออก PDF จ่ายเงินเดือน</span>
                </label>
              </div>
            </div>

          <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs px-6 py-3.5 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-md cursor-pointer transition"
            >
              {editingUser ? 'บันทึกแก้ไขสิทธิ' : 'บันทึกเพิ่มผู้ใช้'}
            </button>
          </div>
        </form>
      </MovableModal>

      {/* In-App User Deletion Confirmation Modal */}
      {userToDelete && (
        <MovableModal
          isOpen={Boolean(userToDelete)}
          onClose={() => setUserToDelete(null)}
          title="ยืนยันการลบผู้ใช้งาน"
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
                  คุณต้องการลบผู้ใช้งาน "@{userToDelete.username}" ({userToDelete.fullName}) ออกจากระบบใช่หรือไม่?
                </p>
                <p className="text-rose-700">การลบผู้ใช้งานจะไม่สามารถกู้คืนข้อมูลได้</p>
              </div>
            </div>
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteUserRight(userToDelete.id);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>ยืนยันลบผู้ใช้</span>
              </button>
            </div>
          </div>
        </MovableModal>
      )}
    </div>
  );
};
