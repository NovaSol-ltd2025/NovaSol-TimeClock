import React, { useState } from 'react';
import { Branch } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Printer, Download, Building2, MapPin, ShieldCheck, ExternalLink, Copy, Check } from 'lucide-react';

interface QrCodeManagerProps {
  branches: Branch[];
  onOpenCheckInForBranch: (branchId: string) => void;
}

export const QrCodeManager: React.FC<QrCodeManagerProps> = ({
  branches,
  onOpenCheckInForBranch,
}) => {
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || '');
  const [copied, setCopied] = useState(false);

  const selectedBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];

  // The payload inside the QR Code encodes the branch check-in URL / data
  const qrPayload = JSON.stringify({
    app: 'NOVASOL_TIME_CLOCK',
    branchId: selectedBranch?.id,
    branchName: selectedBranch?.name,
    lat: selectedBranch?.latitude,
    lng: selectedBranch?.longitude,
    radius: selectedBranch?.radiusMeters,
    timestamp: new Date().toISOString(),
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintQrPoster = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <QrCode className="w-6 h-6 text-sky-600" />
            สร้างและพิมพ์ QR Code ประจำสาขา (Branch QR Code Generator)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            สร้าง QR Code สำหรับให้พนักงานสแกนผ่านมือถือ เพื่อสแกนเข้า-ออกงานร่วมกับการถ่ายรูป Selfie และตรวจสอบ GPS
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-700">เลือกสาขา:</label>
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-hidden cursor-pointer"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.type === 'hq' ? '🏢' : '🏪'} {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main QR Code Poster Preview */}
      <div className="max-w-xl mx-auto bg-white rounded-3xl border-2 border-sky-600/30 p-8 shadow-xl space-y-6 text-center relative overflow-hidden">
        {/* Top Decorative Header */}
        <div className="bg-slate-900 text-white -mx-8 -mt-8 p-6 space-y-2">
          <div className="flex justify-center mb-2">
            <img
              src="https://i.postimg.cc/FHGkmGKB/NOVASOL-1/logo.png"
              alt="NOVASOL Logo"
              className="h-12 w-auto object-contain bg-white px-2 py-1 rounded-xl"
            />
          </div>
          <h3 className="text-xl font-extrabold text-white tracking-tight">
            ห้างหุ้นส่วนจำกัด โนวาโซล (NOVASOL Ltd.)
          </h3>
          <p className="text-sky-400 text-xs font-bold">
            จุดลงเวลาเข้า-ออกงานปฏิบัติงาน (TIME CLOCK STATION)
          </p>
        </div>

        {/* Branch Details */}
        <div className="space-y-1">
          <div className="inline-block bg-sky-100 text-sky-900 font-extrabold text-sm px-4 py-1 rounded-full border border-sky-300">
            {selectedBranch?.name}
          </div>
          <p className="text-xs text-slate-500 font-medium pt-1">
            {selectedBranch?.address || 'ไม่ระบุที่อยู่'}
          </p>
          <p className="text-[11px] text-sky-700 font-semibold">
            📍 พิกัด GPS อนุญาตเช็คอินระยะไม่เกิน {selectedBranch?.radiusMeters} เมตร
          </p>
        </div>

        {/* Generated QR Code Container */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 inline-block shadow-inner">
          <QRCodeSVG
            value={qrPayload}
            size={220}
            level="H"
            includeMargin={true}
            imageSettings={{
              src: 'https://i.postimg.cc/FHGkmGKB/NOVASOL-1/logo.png',
              x: undefined,
              y: undefined,
              height: 36,
              width: 36,
              excavate: true,
            }}
          />
        </div>

        {/* Instructions */}
        <div className="space-y-2 text-xs text-slate-600 bg-sky-50/70 p-4 rounded-xl border border-sky-100">
          <div className="font-bold text-slate-800 text-sm flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            ขั้นตอนการลงเวลาเข้า-ออกงานสำหรับพนักงาน
          </div>
          <ol className="text-left text-[11px] space-y-1 pl-4 list-decimal text-slate-700">
            <li>เปิดกล้องมือถือสแกน QR Code หรือเปิดระบบลงเวลา</li>
            <li>กรอกรหัส PIN 4 หลักประจำตัวพนักงาน</li>
            <li>ยืนยันตำแหน่ง GPS ว่าอยู่ในรัศมี {selectedBranch?.radiusMeters} เมตร</li>
            <li>ถ่ายรูป Selfie หน้าตรงผ่านกล้องมือถือเพื่อยืนยันตัวตน</li>
          </ol>
        </div>

        {/* Actions for Admin */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3 no-print">
          <button
            onClick={() => onOpenCheckInForBranch(selectedBranch.id)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition"
          >
            <ExternalLink className="w-4 h-4" />
            <span>ทดสอบสแกนเช็คอินสาขานี้</span>
          </button>

          <button
            onClick={handlePrintQrPoster}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์ป้าย QR Code โปสเตอร์ (A4)</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'คัดลอกลิงก์แล้ว' : 'คัดลอกลิงก์'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
