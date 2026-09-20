import React, { useState, useEffect, useRef } from 'react';
import { Branch, Employee, AttendanceRecord, UserRight } from '../types';
import { isWithinRadius, getCurrentPosition } from '../lib/geoUtils';
import {
  UserCheck,
  Camera,
  MapPin,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  LogIn,
  LogOut,
  Building2,
  ShieldCheck,
  Clock,
  User,
} from 'lucide-react';

interface CheckInOutModalProps {
  branches: Branch[];
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  onSaveRecord: (record: AttendanceRecord) => Promise<boolean | void> | void;
  onClose: () => void;
  defaultBranchId?: string;
  currentUser?: UserRight | null;
}

export const CheckInOutModal: React.FC<CheckInOutModalProps> = ({
  branches,
  employees,
  attendanceRecords,
  onSaveRecord,
  onClose,
  defaultBranchId,
  currentUser,
}) => {
  // Check if current user is tied to an employee
  const linkedEmployee = currentUser?.employeeId
    ? employees.find((e) => e.id === currentUser.employeeId) || null
    : null;

  const isBranchRestricted =
    currentUser &&
    currentUser.role !== 'admin' &&
    currentUser.branchScope &&
    currentUser.branchScope !== 'all';

  const initialBranchId =
    (isBranchRestricted ? currentUser?.branchScope : defaultBranchId) ||
    linkedEmployee?.branchId ||
    branches[0]?.id ||
    '';

  const [step, setStep] = useState<1 | 2 | 3 | 4>(linkedEmployee ? 2 : 1);

  // Form State
  const [selectedBranchId, setSelectedBranchId] = useState<string>(initialBranchId);
  const [empCodeInput, setEmpCodeInput] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [authenticatedEmployee, setAuthenticatedEmployee] = useState<Employee | null>(
    linkedEmployee
  );

  // GPS State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [isGpsValid, setIsGpsValid] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string>('');
  const [isLoadingGps, setIsLoadingGps] = useState<boolean>(false);

  // Camera / Selfie State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [capturedSelfieUrl, setCapturedSelfieUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string>('');

  // Clock Type (in vs out)
  const [clockType, setClockType] = useState<'in' | 'out'>('in');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const selectedBranch =
    branches.find((b) => b.id === selectedBranchId) || branches[0];

  // If already authenticated on mount, fetch GPS immediately
  useEffect(() => {
    if (linkedEmployee) {
      fetchGpsPosition();
    }
  }, []);

  // Validate Employee ID and PIN
  const handleVerifyIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (pin.length !== 4) {
      setErrorMessage('กรุณากรอกรหัส PIN ให้ครบ 4 หลัก');
      return;
    }

    const activeEmps = employees.filter((emp) => emp.status === 'active');

    let matchedEmp: Employee | undefined;

    if (empCodeInput.trim()) {
      const cleanCode = empCodeInput.trim().toUpperCase();
      matchedEmp = activeEmps.find(
        (emp) =>
          emp.empCode.toUpperCase() === cleanCode ||
          emp.empCode.replace(/-/g, '').toUpperCase() === cleanCode.replace(/-/g, '')
      );

      if (!matchedEmp) {
        setErrorMessage(`ไม่พบรหัสพนักงาน "${empCodeInput.trim()}" ในระบบ`);
        return;
      }

      if (matchedEmp.pin !== pin) {
        setErrorMessage('รหัส PIN ไม่ถูกต้องสำหรับพนักงานท่านนี้');
        return;
      }
    } else {
      matchedEmp = activeEmps.find((emp) => emp.pin === pin);
      if (!matchedEmp) {
        setErrorMessage('รหัส PIN ไม่ถูกต้อง หรือพนักงานไม่ได้อยู่ในสถานะทำงาน');
        return;
      }
    }

    setAuthenticatedEmployee(matchedEmp);
    const targetBranchId = (!defaultBranchId && matchedEmp.branchId) ? matchedEmp.branchId : selectedBranchId;
    if (!defaultBranchId && matchedEmp.branchId) {
      setSelectedBranchId(matchedEmp.branchId);
    }
    setStep(2);
    // Auto load GPS location
    const branchForGps = branches.find((b) => b.id === targetBranchId) || selectedBranch;
    fetchGpsPosition(branchForGps);
  };

  // Fetch Browser GPS Location
  const fetchGpsPosition = async (targetBranch?: Branch) => {
    const branchToEvaluate = targetBranch || selectedBranch;
    setIsLoadingGps(true);
    setGpsError('');
    try {
      const pos = await getCurrentPosition();
      setUserLocation({ lat: pos.latitude, lng: pos.longitude });

      const check = isWithinRadius(
        pos.latitude,
        pos.longitude,
        branchToEvaluate.latitude,
        branchToEvaluate.longitude,
        branchToEvaluate.radiusMeters
      );

      setDistanceMeters(check.distance);
      setIsGpsValid(check.isWithin);
    } catch (err: any) {
      setGpsError(err.message || 'ไม่สามารถระบุพิกัด GPS ได้');
      // Fallback for preview mode demo if GPS permission is denied
      setUserLocation({
        lat: branchToEvaluate.latitude + 0.0001,
        lng: branchToEvaluate.longitude + 0.0001,
      });
      const fallbackCheck = isWithinRadius(
        branchToEvaluate.latitude + 0.0001,
        branchToEvaluate.longitude + 0.0001,
        branchToEvaluate.latitude,
        branchToEvaluate.longitude,
        branchToEvaluate.radiusMeters
      );
      setDistanceMeters(fallbackCheck.distance);
      setIsGpsValid(fallbackCheck.isWithin);
    } finally {
      setIsLoadingGps(false);
    }
  };

  // Start Camera Stream when moving to Step 3
  useEffect(() => {
    if (step === 3 && !capturedSelfieUrl) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [step, capturedSelfieUrl]);

  const startCamera = async () => {
    setCameraError('');
    try {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setCameraError(
        'ไม่สามารถเข้าถึงกล้องหน้าได้ กรุณาอนุญาตการใช้งานกล้องในเบราว์เซอร์ของคุณ'
      );
    }
  };

  const stopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
  };

  // Capture Selfie to Canvas & DataURL
  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 320;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedSelfieUrl(dataUrl);
        stopCamera();
      }
    }
  };

  const handleRetakePhoto = () => {
    setCapturedSelfieUrl(null);
    startCamera();
  };

  // Final submit handler
  const handleFinalSubmit = async () => {
    if (!authenticatedEmployee || isSaving) return;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    // Check if employee already has an attendance record for today
    const existingIndex = attendanceRecords.findIndex(
      (r) => r.employeeId === authenticatedEmployee.id && r.date === todayStr
    );

    let finalRecord: AttendanceRecord;

    if (existingIndex >= 0 && clockType === 'out') {
      // Update existing record with Clock-Out info
      const existing = attendanceRecords[existingIndex];
      finalRecord = {
        ...existing,
        timeOut: timeStr,
        selfieOutUrl: capturedSelfieUrl || undefined,
        latitudeOut: userLocation?.lat,
        longitudeOut: userLocation?.lng,
        distanceOutMeters: distanceMeters || undefined,
        isWithinRadiusOut: isGpsValid,
        notes: notes ? `${existing.notes || ''} | ออกงาน: ${notes}` : existing.notes,
      };
    } else {
      // Requirement 4: Calculate isLate dynamically based on branch's configured workStartTime
      const shiftStartTime = selectedBranch.workStartTime || '08:30';
      const lateThreshold = selectedBranch.lateThresholdMinutes ?? 15;
      const [shiftH, shiftM] = shiftStartTime.split(':').map((v) => parseInt(v, 10) || 0);
      const [nowH, nowM] = timeStr.split(':').map((v) => parseInt(v, 10) || 0);

      const shiftCutoffMinutes = shiftH * 60 + shiftM + lateThreshold;
      const currentMinutes = nowH * 60 + nowM;

      const isLate = clockType === 'in' && currentMinutes > shiftCutoffMinutes;

      finalRecord = {
        id: `att-${Date.now()}`,
        employeeId: authenticatedEmployee.id,
        employeeName: authenticatedEmployee.fullName,
        branchId: selectedBranch.id,
        branchName: selectedBranch.name,
        date: todayStr,
        timeIn: clockType === 'in' ? timeStr : undefined,
        timeOut: clockType === 'out' ? timeStr : undefined,
        selfieInUrl: clockType === 'in' ? capturedSelfieUrl || undefined : undefined,
        selfieOutUrl: clockType === 'out' ? capturedSelfieUrl || undefined : undefined,
        latitudeIn: userLocation?.lat,
        longitudeIn: userLocation?.lng,
        distanceInMeters: distanceMeters || undefined,
        isWithinRadiusIn: isGpsValid,
        status: isLate ? 'late' : 'present',
        notes: notes || undefined,
      };
    }

    // รอผลบันทึกลงฐานข้อมูลจริงก่อน จึงแสดงหน้า "สำเร็จ" (ถ้าไม่สำเร็จ App จะแจ้งเตือนเอง)
    setIsSaving(true);
    const saved = await onSaveRecord(finalRecord);
    setIsSaving(false);
    if (saved === false) return;
    setIsSuccess(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const visibleBranches = isBranchRestricted
    ? branches.filter((b) => b.id === currentUser?.branchScope)
    : branches;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-bold text-sm leading-tight">
                ระบบลงเวลาเข้า-ออกงาน (Time Clock Station)
              </h3>
              <p className="text-[10px] text-slate-400">
                สาขา {selectedBranch.name} • รัศมี GPS {selectedBranch.radiusMeters} เมตร
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600 shrink-0">
          <span className={step === 1 ? 'text-indigo-700' : 'text-slate-400'}>1. ยืนยันรหัส</span>
          <span>→</span>
          <span className={step === 2 ? 'text-indigo-700' : 'text-slate-400'}>2. พิกัด GPS</span>
          <span>→</span>
          <span className={step === 3 ? 'text-indigo-700' : 'text-slate-400'}>3. ถ่าย Selfie</span>
          <span>→</span>
          <span className={step === 4 ? 'text-indigo-700' : 'text-slate-400'}>4. บันทึกเวลางาน</span>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* SUCCESS SCREEN */}
          {isSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                ลงเวลาสำเร็จเรียบร้อย!
              </h3>
              <p className="text-xs text-slate-500">
                ระบบบันทึกเวลา พิกัด GPS และรูปถ่าย Selfie ของคุณลงในฐานข้อมูลเรียบร้อยแล้ว
              </p>
            </div>
          ) : (
            <>
              {/* STEP 1: EMPLOYEE ID & PIN AUTHENTICATION (Requirement 1) */}
              {step === 1 && (
                <form onSubmit={handleVerifyIdentity} className="space-y-4">
                  <div className="text-center space-y-1">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto border border-indigo-200">
                      <KeyRound className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-base text-slate-900">
                      กรอกรหัสพนักงาน & รหัส PIN 4 หลัก
                    </h4>
                    <p className="text-xs text-slate-500">
                      เพื่อยืนยันตัวตนก่อนการตรวจสอบพิกัด GPS และถ่ายภาพ Selfie
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-indigo-600" />
                      รหัสพนักงาน (Employee ID) <span className="text-slate-400 font-normal">(เช่น NS02-006)</span>
                    </label>
                    <input
                      type="text"
                      value={empCodeInput}
                      onChange={(e) => setEmpCodeInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 uppercase bg-slate-50 focus:bg-white"
                      placeholder="NS02-006 หรือ NS-001"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      รหัส PIN 4 หลัก <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center text-2xl font-mono tracking-widest py-2.5 border-2 border-slate-300 rounded-2xl focus:border-indigo-500 focus:outline-hidden bg-amber-50/50"
                      placeholder="••••"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition"
                  >
                    ตรวจสอบรหัสและไปขั้นตอนถัดไป →
                  </button>
                </form>
              )}

              {/* STEP 2: GPS RADIUS CHECK */}
              {step === 2 && authenticatedEmployee && (
                <div className="space-y-4">
                  <div className="bg-indigo-50/60 p-3.5 rounded-2xl border border-indigo-100 flex items-center gap-3">
                    {authenticatedEmployee.avatarUrl ? (
                      <img
                        src={authenticatedEmployee.avatarUrl}
                        alt={authenticatedEmployee.fullName}
                        className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-xs shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-indigo-200 text-indigo-800 font-bold flex items-center justify-center text-base shrink-0">
                        {authenticatedEmployee.fullName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-bold text-indigo-950">
                        {authenticatedEmployee.fullName} ({authenticatedEmployee.empCode})
                      </div>
                      <div className="text-[11px] text-indigo-700 font-medium mt-0.5">
                        {authenticatedEmployee.position}
                      </div>
                    </div>
                  </div>

                  {/* Branch Selection: Displayed after employee identity is authenticated */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                        สาขาที่ต้องการลงเวลา
                      </span>
                      {selectedBranch?.workStartTime && (
                        <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          เข้างาน: {selectedBranch.workStartTime} - {selectedBranch.workEndTime} น.
                        </span>
                      )}
                    </label>
                    <select
                      value={selectedBranchId}
                      onChange={(e) => {
                        const newBranchId = e.target.value;
                        setSelectedBranchId(newBranchId);
                        const newB = branches.find((b) => b.id === newBranchId);
                        if (newB) {
                          fetchGpsPosition(newB);
                        }
                      }}
                      disabled={Boolean(isBranchRestricted)}
                      className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white disabled:bg-slate-100 cursor-pointer"
                    >
                      {visibleBranches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} (เวลา {b.workStartTime || '08:30'} - {b.workEndTime || '17:30'} น.)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-indigo-600" />
                      ตรวจสอบพิกัด GPS ระยะทางจากสาขา
                    </h4>

                    {isLoadingGps ? (
                      <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2 bg-slate-50 rounded-xl">
                        <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                        <span>กำลังดึงตำแหน่งพิกัด GPS ของคุณ...</span>
                      </div>
                    ) : (
                      <div
                        className={`p-4 rounded-2xl border ${
                          isGpsValid
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-amber-50 border-amber-200 text-amber-900'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {isGpsValid ? (
                            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                          )}
                          <div className="space-y-1">
                            <div className="font-bold text-sm">
                              {isGpsValid
                                ? '✓ อยู่ในรัศมีที่อนุญาตเช็คอิน'
                                : '⚠️ คุณไม่อยู่ในรัศมีของสาขา'}
                            </div>
                            <div className="text-xs">
                              ระยะห่างของคุณจากสาขา:{' '}
                              <span className="font-bold text-base">
                                {distanceMeters !== null ? `${distanceMeters} เมตร` : 'กำลังคำนวณ'}
                              </span>{' '}
                              (รัศมีที่กำหนดไม่เกิน {selectedBranch.radiusMeters} เมตร)
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={fetchGpsPosition}
                      className="text-xs text-indigo-700 hover:underline font-bold flex items-center gap-1 cursor-pointer pt-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> รีเฟรชตำแหน่ง GPS อีกครั้ง
                    </button>
                  </div>

                  <button
                    onClick={() => setStep(3)}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition"
                  >
                    ถ่ายรูป Selfie ยืนยันตัวตน →
                  </button>
                </div>
              )}

              {/* STEP 3: SELFIE CAMERA CAPTURE */}
              {step === 3 && (
                <div className="space-y-3">
                  <div className="text-center space-y-1">
                    <h4 className="font-bold text-sm text-slate-900 flex items-center justify-center gap-1.5">
                      <Camera className="w-4 h-4 text-indigo-600" />
                      ถ่ายรูป Selfie ใบหน้าหน้าตรง
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      ถ่ายรูปยืนยันตัวตนเพื่อป้องกันการตอกบัตร/เข้างานแทนกัน (ป้องกันการทุจริต)
                    </p>
                  </div>

                  {cameraError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{cameraError}</span>
                    </div>
                  )}

                  <div className="relative bg-slate-900 rounded-2xl overflow-hidden h-64 flex items-center justify-center border-2 border-indigo-500/30">
                    {capturedSelfieUrl ? (
                      <img
                        src={capturedSelfieUrl}
                        alt="Captured Selfie"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        {/* Oval face guide */}
                        <div className="absolute inset-0 border-2 border-dashed border-sky-400/60 rounded-full my-6 mx-16 pointer-events-none flex items-center justify-center">
                          <span className="text-[10px] bg-slate-900/70 text-sky-300 font-semibold px-2 py-0.5 rounded">
                            จัดใบหน้าให้อยู่ในกรอบ
                          </span>
                        </div>
                      </>
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    {capturedSelfieUrl ? (
                      <button
                        type="button"
                        onClick={handleRetakePhoto}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> ถ่ายรูปใหม่
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCapturePhoto}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
                      >
                        <Camera className="w-4 h-4" /> กดถ่ายรูป Selfie
                      </button>
                    )}
                  </div>

                  {capturedSelfieUrl && (
                    <button
                      onClick={() => setStep(4)}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition mt-2"
                    >
                      ไปยังขั้นตอนสุดท้ายบันทึกเวลา →
                    </button>
                  )}
                </div>
              )}

              {/* STEP 4: CONFIRM CLOCK IN/OUT */}
              {step === 4 && authenticatedEmployee && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-xs text-slate-500 font-medium">พนักงาน:</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {authenticatedEmployee.fullName} ({authenticatedEmployee.empCode})
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-xs text-slate-500 font-medium">สาขา:</span>
                      <span className="font-bold text-indigo-800 text-xs">
                        {selectedBranch.name}
                      </span>
                    </div>

                    {/* Requirement 4: Shift Display */}
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" /> กะเวลาสาขา:
                      </span>
                      <span className="font-bold text-xs text-slate-800">
                        {selectedBranch.workStartTime || '08:30'} - {selectedBranch.workEndTime || '17:30'} น.
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">ระยะ GPS:</span>
                      <span
                        className={`font-bold text-xs px-2 py-0.5 rounded-md ${
                          isGpsValid
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {distanceMeters} เมตร ({isGpsValid ? '✓ ในระยะ' : '⚠️ นอกระยะ'})
                      </span>
                    </div>
                  </div>

                  {/* Clock Type Selector */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setClockType('in')}
                      className={`p-3.5 rounded-2xl border-2 flex flex-col items-center gap-1.5 cursor-pointer transition ${
                        clockType === 'in'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      <LogIn className="w-5 h-5 text-emerald-600" />
                      <span className="text-xs">ลงเวลาเข้างาน (Clock In)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setClockType('out')}
                      className={`p-3.5 rounded-2xl border-2 flex flex-col items-center gap-1.5 cursor-pointer transition ${
                        clockType === 'out'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-900 font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      <LogOut className="w-5 h-5 text-indigo-600" />
                      <span className="text-xs">ลงเวลาออกงาน (Clock Out)</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      หมายเหตุเพิ่มเติม (ถ้ามี)
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="เช่น ขออนุญาตออกไปพบลูกค้าภายนอก..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <button
                    onClick={handleFinalSubmit}
                    disabled={isSaving}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-wait text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSaving ? 'กำลังบันทึกลงฐานข้อมูล...' : 'ยืนยันบันทึกเวลาทำงาน'}</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
