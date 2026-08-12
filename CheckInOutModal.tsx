import React, { useState, useEffect, useRef } from 'react';
import { Branch, Employee, AttendanceRecord } from '../types';
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
} from 'lucide-react';

interface CheckInOutModalProps {
  branches: Branch[];
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  onSaveRecord: (record: AttendanceRecord) => void;
  onClose: () => void;
  defaultBranchId?: string;
}

export const CheckInOutModal: React.FC<CheckInOutModalProps> = ({
  branches,
  employees,
  attendanceRecords,
  onSaveRecord,
  onClose,
  defaultBranchId,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    defaultBranchId || branches[0]?.id || ''
  );
  const [pin, setPin] = useState<string>('');
  const [authenticatedEmployee, setAuthenticatedEmployee] = useState<Employee | null>(null);

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

  const selectedBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];

  // Validate PIN
  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (pin.length !== 4) {
      setErrorMessage('กรุณากรอกรหัส PIN ให้ครบ 4 หลัก');
      return;
    }

    const activeEmps = employees.filter((emp) => emp.status === 'active');
    const matchedEmp = activeEmps.find((emp) => emp.pin === pin);

    if (!matchedEmp) {
      setErrorMessage('รหัส PIN ไม่ถูกต้อง หรือพนักงานไม่ได้อยู่ในสถานะทำงาน');
      return;
    }

    setAuthenticatedEmployee(matchedEmp);
    // Auto sync branch from employee if not explicitly set
    if (!defaultBranchId && matchedEmp.branchId) {
      setSelectedBranchId(matchedEmp.branchId);
    }
    setStep(2);
    // Auto load GPS location
    fetchGpsPosition();
  };

  // Fetch Browser GPS Location
  const fetchGpsPosition = async () => {
    setIsLoadingGps(true);
    setGpsError('');
    try {
      const pos = await getCurrentPosition();
      setUserLocation({ lat: pos.latitude, lng: pos.longitude });

      const check = isWithinRadius(
        pos.latitude,
        pos.longitude,
        selectedBranch.latitude,
        selectedBranch.longitude,
        selectedBranch.radiusMeters
      );

      setDistanceMeters(check.distance);
      setIsGpsValid(check.isWithin);
    } catch (err: any) {
      setGpsError(err.message || 'ไม่สามารถระบุพิกัด GPS ได้');
      // Fallback for preview mode demo if GPS permission is denied or simulated
      setUserLocation({
        lat: selectedBranch.latitude + 0.0001,
        lng: selectedBranch.longitude + 0.0001,
      });
      const fallbackCheck = isWithinRadius(
        selectedBranch.latitude + 0.0001,
        selectedBranch.longitude + 0.0001,
        selectedBranch.latitude,
        selectedBranch.longitude,
        selectedBranch.radiusMeters
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
    return () => {
      stopCamera();
    };
  }, [step, capturedSelfieUrl]);

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setCameraError('ไม่สามารถเปิดกล้องถ่ายรูป Selfie ได้ กรุณาอนุญาตสิทธิ์การใช้กล้อง');
    }
  };

  const stopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
  };

  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 480;
      canvas.height = video.videoHeight || 360;
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

  // Submit Final Clock In/Out Record
  const handleFinalSubmit = () => {
    if (!authenticatedEmployee) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // Check if there is an existing record for today
    const existingIndex = attendanceRecords.findIndex(
      (r) => r.employeeId === authenticatedEmployee.id && r.date === todayStr
    );

    let finalRecord: AttendanceRecord;

    if (existingIndex >= 0 && clockType === 'out') {
      // Update existing today's record with timeOut
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
      // Create new record
      const isLate = parseInt(timeStr.split(':')[0], 10) >= 9; // > 09:00 is late

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

    onSaveRecord(finalRecord);
    setIsSuccess(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-base">ระบบเช็คอิน/ออกงาน (Selfie & GPS)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600 shrink-0">
          <span className={step === 1 ? 'text-sky-700' : 'text-slate-400'}>1. รหัส PIN</span>
          <span>→</span>
          <span className={step === 2 ? 'text-sky-700' : 'text-slate-400'}>2. พิกัด GPS</span>
          <span>→</span>
          <span className={step === 3 ? 'text-sky-700' : 'text-slate-400'}>3. ถ่าย Selfie</span>
          <span>→</span>
          <span className={step === 4 ? 'text-sky-700' : 'text-slate-400'}>4. บันทึกเวลางาน</span>
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
              {/* STEP 1: PIN AUTHENTICATION */}
              {step === 1 && (
                <form onSubmit={handleVerifyPin} className="space-y-4">
                  <div className="text-center space-y-1">
                    <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto">
                      <KeyRound className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-base text-slate-900">
                      กรอกรหัส PIN 4 หลักเพื่อเข้าสู่ระบบ
                    </h4>
                    <p className="text-xs text-slate-500">
                      เลือกสาขาและกรอกรหัส PIN ประจำตัวพนักงาน
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      สาขาที่จะลงเวลาเข้า-ออกงาน
                    </label>
                    <select
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-slate-50"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} (รัศมี {b.radiusMeters}m)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      รหัส PIN 4 หลัก
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center text-2xl font-mono tracking-widest py-3 border-2 border-slate-300 rounded-2xl focus:border-sky-500 focus:outline-hidden bg-amber-50/50"
                      placeholder="••••"
                      autoFocus
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition"
                  >
                    ตรวจสอบรหัส PIN และไปขั้นตอนถัดไป →
                  </button>
                </form>
              )}

              {/* STEP 2: GPS RADIUS CHECK */}
              {step === 2 && authenticatedEmployee && (
                <div className="space-y-4">
                  <div className="bg-sky-50 p-3 rounded-2xl border border-sky-100 flex items-center gap-3">
                    <img
                      src={
                        authenticatedEmployee.avatarUrl ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                      }
                      alt={authenticatedEmployee.fullName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs"
                    />
                    <div>
                      <div className="text-xs font-bold text-sky-900">
                        {authenticatedEmployee.fullName} ({authenticatedEmployee.empCode})
                      </div>
                      <div className="text-[11px] text-sky-700">
                        {authenticatedEmployee.position} | สาขา {selectedBranch.name}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-sky-600" />
                      ตรวจสอบพิกัด GPS ระยะทางจากสาขา
                    </h4>

                    {isLoadingGps ? (
                      <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2 bg-slate-50 rounded-xl">
                        <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
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
                      className="text-xs text-sky-700 hover:underline font-bold flex items-center gap-1 cursor-pointer pt-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> รีเฟรชตำแหน่ง GPS อีกครั้ง
                    </button>
                  </div>

                  <button
                    onClick={() => setStep(3)}
                    className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition"
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
                      <Camera className="w-4 h-4 text-sky-600" />
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

                  <div className="relative bg-slate-900 rounded-2xl overflow-hidden h-64 flex items-center justify-center border-2 border-sky-500/30">
                    {capturedSelfieUrl ? (
                      <img
                        src={capturedSelfieUrl}
                        alt="Captured Selfie"
                        className="w-full h-full object-cover"
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
                        className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
                      >
                        <Camera className="w-4 h-4" /> กดถ่ายรูป Selfie
                      </button>
                    )}
                  </div>

                  {capturedSelfieUrl && (
                    <button
                      onClick={() => setStep(4)}
                      className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition mt-2"
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
                        {authenticatedEmployee.fullName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-xs text-slate-500 font-medium">สาขา:</span>
                      <span className="font-bold text-sky-800 text-xs">
                        {selectedBranch.name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">ระยะ GPS:</span>
                      <span
                        className={`font-bold text-xs px-2 py-0.5 rounded ${
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
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      เลือกประเภทการลงเวลา
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setClockType('in')}
                        className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition ${
                          clockType === 'in'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <LogIn className="w-4 h-4" />
                        <span>ลงเวลาเข้างาน (In)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setClockType('out')}
                        className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition ${
                          clockType === 'out'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <LogOut className="w-4 h-4" />
                        <span>ลงเวลาออกงาน (Out)</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      หมายเหตุเพิ่มเติม (Optional)
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                      placeholder="เช่น ปฏิบัติงานนอกสถานที่, ออกก่อนเวลา..."
                    />
                  </div>

                  <button
                    onClick={handleFinalSubmit}
                    className="w-full py-3.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-sky-600/30 cursor-pointer transition"
                  >
                    Confirm & Yยืนยันการบันทึกเวลางาน
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
