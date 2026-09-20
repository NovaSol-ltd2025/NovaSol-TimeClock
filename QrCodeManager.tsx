import React, { useState } from 'react';
import { Branch, UserRight } from './types';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Printer,
  Download,
  Building2,
  MapPin,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  Smartphone,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';

interface QrCodeManagerProps {
  branches: Branch[];
  currentUser?: UserRight;
  onOpenCheckInForBranch: (branchId: string) => void;
}

export const QrCodeManager: React.FC<QrCodeManagerProps> = ({
  branches,
  currentUser,
  onOpenCheckInForBranch,
}) => {
  // Requirement 3: Branch scoping for non-admin
  const isBranchRestricted =
    currentUser &&
    currentUser.role !== 'admin' &&
    currentUser.branchScope &&
    currentUser.branchScope !== 'all';

  const defaultBranchId = isBranchRestricted
    ? currentUser.branchScope!
    : branches[0]?.id || '';

  const [selectedBranchId, setSelectedBranchId] = useState<string>(defaultBranchId);
  const [copied, setCopied] = useState(false);
  const [isGeneratingPng, setIsGeneratingPng] = useState(false);

  const visibleBranches = isBranchRestricted
    ? branches.filter((b) => b.id === currentUser?.branchScope)
    : branches;

  const selectedBranch =
    branches.find((b) => b.id === selectedBranchId) || visibleBranches[0] || branches[0];

  // Requirement 5: QR Code encodes the direct Web Login / Clock-in URL for employees
  // ถ้ากำหนด VITE_PUBLIC_APP_URL (โดเมนสาธารณะของระบบ) จะใช้ค่านั้นเสมอ ไม่ว่าแอดมินเปิดหน้านี้จากลิงก์ไหน
  // (ลิงก์เฉพาะ deployment ของ Vercel เช่น xxx-hash-team.vercel.app ต้องล็อกอิน Vercel จึงห้ามใช้ทำ QR)
  const publicBaseUrl = (import.meta.env.VITE_PUBLIC_APP_URL || '').trim().replace(/\/+$/, '');
  const origin = publicBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const pathname = publicBaseUrl ? '/' : typeof window !== 'undefined' ? window.location.pathname : '';
  const qrWebUrl = `${origin}${pathname}?branchId=${selectedBranch?.id || ''}&tab=employee`;
  const isVercelDeploymentUrl = !publicBaseUrl && /-[a-z0-9]{8,}-[a-z0-9-]+\.vercel\.app$/i.test(origin);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrWebUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to generate self-contained HTML for A4 Printing
  const getPosterHTML = () => {
    const svgEl = document.getElementById('branch-qr-svg');
    const svgHtml = svgEl ? svgEl.outerHTML : '';

    return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ป้าย QR Code ลงเวลา - ${selectedBranch?.name || ''} - NOVASOL</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600;700&display=swap');
    @page { size: A4 portrait; margin: 8mm; }
    * { box-sizing: border-box; font-family: 'Chakra Petch', -apple-system, sans-serif; }
    body { margin: 0; padding: 0; background-color: #f1f5f9; color: #0f172a; }
    .print-controls {
      background: #0f172a;
      color: white;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .btn-print {
      background: #4f46e5;
      color: white;
      border: none;
      padding: 9px 22px;
      border-radius: 10px;
      font-weight: bold;
      font-size: 14px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 2px 6px rgba(79, 70, 229, 0.3);
    }
    .btn-close {
      background: #334155;
      color: #cbd5e1;
      border: none;
      padding: 8px 18px;
      border-radius: 10px;
      font-size: 13px;
      cursor: pointer;
    }
    .poster-page {
      width: 194mm;
      min-height: 275mm;
      margin: 20px auto;
      background: #ffffff;
      border: 3px solid #1e293b;
      border-radius: 24px;
      padding: 28px 32px;
      box-shadow: 0 12px 30px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      text-align: center;
    }
    @media print {
      body { background: #fff !important; }
      .print-controls { display: none !important; }
      .poster-page {
        width: 100% !important;
        min-height: 100% !important;
        margin: 0 !important;
        border: 2.5px solid #0f172a !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        padding: 15mm 12mm !important;
        page-break-inside: avoid !important;
      }
    }
    .header-box {
      background: linear-gradient(135deg, #3730a3 0%, #1e1b4b 100%);
      color: white;
      padding: 18px 24px;
      border-radius: 18px;
      margin-bottom: 18px;
      box-shadow: 0 4px 12px rgba(55, 48, 163, 0.2);
    }
    .company-name {
      font-size: 24px;
      font-weight: 700;
      margin: 8px 0 2px 0;
      letter-spacing: 0.5px;
    }
    .station-title {
      font-size: 13px;
      color: #c7d2fe;
      font-weight: 600;
      letter-spacing: 1px;
    }
    .branch-badge {
      display: inline-block;
      background: #e0e7ff;
      color: #312e81;
      font-size: 19px;
      font-weight: 700;
      padding: 8px 28px;
      border-radius: 9999px;
      border: 1.5px solid #c7d2fe;
      margin-bottom: 6px;
    }
    .address {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 12px;
      font-weight: 500;
    }
    .meta-tags {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .tag {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 6px 14px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
      color: #334155;
    }
    .qr-container {
      background: #ffffff;
      padding: 18px;
      border-radius: 20px;
      display: inline-block;
      border: 2px dashed #94a3b8;
      margin: 8px auto;
      box-shadow: 0 4px 12px rgba(0,0,0,0.04);
    }
    .qr-container svg {
      width: 240px !important;
      height: 240px !important;
      display: block;
    }
    .url-text {
      font-family: monospace;
      font-size: 11px;
      color: #64748b;
      margin-top: 8px;
      word-break: break-all;
    }
    .instructions {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 16px 22px;
      text-align: left;
      margin-top: 18px;
    }
    .instructions h4 {
      margin: 0 0 8px 0;
      font-size: 13px;
      color: #1e293b;
      font-weight: 700;
    }
    .instructions ol {
      margin: 0;
      padding-left: 20px;
      font-size: 12px;
      color: #475569;
      line-height: 1.6;
    }
    .footer-note {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 14px;
    }
  </style>
</head>
<body>
  <div class="print-controls">
    <div style="font-weight: bold; font-size: 14px;">
      🖨️ ป้าย QR Code ประจำสาขา A4 (NOVASOL TIME CLOCK)
    </div>
    <div style="display: flex; gap: 10px;">
      <button class="btn-print" onclick="window.print()">
        <span>พิมพ์เอกสารนี้ (Print A4)</span>
      </button>
      <button class="btn-close" onclick="window.close()">
        ✕ ปิดหน้านี้
      </button>
    </div>
  </div>

  <div class="poster-page">
    <div>
      <div class="header-box">
        <img src="https://i.postimg.cc/FHGkmGKB/NOVASOL-1/logo.png" alt="NOVASOL Logo" style="height: 48px; background: white; padding: 4px 8px; border-radius: 8px; display: inline-block;" />
        <div class="company-name">ห้างหุ้นส่วนจำกัด โนวาโซล (NOVASOL Ltd.)</div>
        <div class="station-title">จุดลงเวลาเข้า-ออกงานประจำสาขา (TIME CLOCK STATION)</div>
      </div>

      <div>
        <div class="branch-badge">📍 ${selectedBranch?.name}</div>
        <div class="address">${selectedBranch?.address || 'สำนักงานสาขา'}</div>
        <div class="meta-tags">
          <div class="tag">⏰ เวลาทำงาน: ${selectedBranch?.workStartTime || '08:30'} - ${selectedBranch?.workEndTime || '17:30'} น.</div>
          <div class="tag">📡 พิกัด GPS (รัศมี ${selectedBranch?.radiusMeters} เมตร)</div>
        </div>
      </div>

      <div class="qr-container">
        ${svgHtml}
      </div>
      <div class="url-text">${qrWebUrl}</div>
    </div>

    <div>
      <div class="instructions">
        <h4>📱 ขั้นตอนการสแกนลงเวลาสำหรับพนักงาน:</h4>
        <ol>
          <li>เปิดกล้องมือถือ หรือแอป LINE สแกน QR Code ด้านบนเพื่อเข้าสู่ระบบลงเวลา</li>
          <li>กรอกรหัสพนักงาน (เช่น NS02-006) และรหัส PIN 4 หลักประจำตัว</li>
          <li>อนุญาตให้เข้าถึงตำแหน่ง GPS ของอุปกรณ์ เพื่อยืนยันว่าอยู่ภายในบริเวณสาขา</li>
          <li>ถ่ายภาพ Selfie หน้าตรงเพื่อยืนยันตัวตน และกดบันทึกเวลาเข้า/ออกงาน</li>
        </ol>
      </div>
      <div class="footer-note">
        ระบบบันทึกเวลาปฏิบัติงานออนไลน์ หจก.โนวาโซล • มีระบบตรวจสอบพิกัดดาวเทียม GPS และรูปถ่ายเพื่อความโปร่งใส
      </div>
    </div>
  </div>

  <script>
    window.addEventListener('load', function() {
      // Small timeout to ensure font and SVG rendering before opening print dialog
      setTimeout(function() {
        try {
          window.print();
        } catch (e) {
          console.warn('Auto print triggered');
        }
      }, 400);
    });
  </script>
</body>
</html>`;
  };

  // Method 1: Print directly via hidden iframe (with auto fallback to new tab)
  const handlePrintQrPoster = () => {
    const html = getPosterHTML();

    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.id = 'qr-print-iframe';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();

        iframe.contentWindow?.focus();
        setTimeout(() => {
          try {
            iframe.contentWindow?.print();
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
            }, 3000);
          } catch (err) {
            console.warn('Iframe print error, falling back to new window:', err);
            handleOpenInNewTab();
          }
        }, 500);
        return;
      }
    } catch (e) {
      console.warn('Hidden iframe print error:', e);
    }

    // Fallback if iframe print is blocked
    handleOpenInNewTab();
  };

  // Method 2: Open in a clean new tab (100% immune to sandbox iframe restrictions)
  const handleOpenInNewTab = () => {
    const html = getPosterHTML();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const win = window.open(blobUrl, '_blank');
    if (!win) {
      alert(
        'เบราว์เซอร์บล็อกป๊อปอัป กรุณาอนุญาตป๊อปอัป หรือกดปุ่ม "ดาวน์โหลดรูปภาพโปสเตอร์ (PNG)" ด้านล่างแทน'
      );
    }
  };

  // Method 3: Generate High-Resolution PNG on Canvas (2480 x 3508 A4 300 DPI)
  const handleDownloadPosterImage = () => {
    setIsGeneratingPng(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1240;
      canvas.height = 1754; // A4 standard 150 DPI
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsGeneratingPng(false);
        return;
      }

      // Fill background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Decorative Outer Frame
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 10;
      ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

      // Header Gradient Box
      const grad = ctx.createLinearGradient(60, 60, canvas.width - 120, 240);
      grad.addColorStop(0, '#3730a3');
      grad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(60, 60, canvas.width - 120, 200, 20);
      ctx.fill();

      // Header text
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = 'bold 36px "Chakra Petch", sans-serif';
      ctx.fillText('ห้างหุ้นส่วนจำกัด โนวาโซล (NOVASOL Ltd.)', canvas.width / 2, 140);
      ctx.font = '20px "Chakra Petch", sans-serif';
      ctx.fillStyle = '#c7d2fe';
      ctx.fillText('จุดลงเวลาเข้า-ออกงานประจำสาขา (TIME CLOCK STATION)', canvas.width / 2, 190);

      // Branch Badge
      ctx.fillStyle = '#e0e7ff';
      ctx.beginPath();
      ctx.roundRect(canvas.width / 2 - 280, 295, 560, 56, 28);
      ctx.fill();
      ctx.fillStyle = '#312e81';
      ctx.font = 'bold 26px "Chakra Petch", sans-serif';
      ctx.fillText(`📍 ${selectedBranch?.name || ''}`, canvas.width / 2, 334);

      // Address
      ctx.fillStyle = '#64748b';
      ctx.font = '18px "Chakra Petch", sans-serif';
      ctx.fillText(selectedBranch?.address || 'สำนักงานสาขา', canvas.width / 2, 385);

      // Work Time & GPS Tag
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 18px "Chakra Petch", sans-serif';
      ctx.fillText(
        `⏰ เวลาทำงาน: ${selectedBranch?.workStartTime || '08:30'} - ${
          selectedBranch?.workEndTime || '17:30'
        } น.   |   📡 รัศมี GPS: ${selectedBranch?.radiusMeters || 100} เมตร`,
        canvas.width / 2,
        425
      );

      // Draw QR Code from SVG element
      const svgEl = document.getElementById('branch-qr-svg');
      if (svgEl) {
        const svgString = new XMLSerializer().serializeToString(svgEl);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const blobURL = URL.createObjectURL(svgBlob);
        const qrImg = new Image();

        qrImg.onload = () => {
          const qrSize = 520;
          const qrX = (canvas.width - qrSize) / 2;
          const qrY = 480;

          // QR Box
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.roundRect(qrX - 25, qrY - 25, qrSize + 50, qrSize + 50, 24);
          ctx.fill();
          ctx.stroke();

          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
          URL.revokeObjectURL(blobURL);

          // URL text
          ctx.fillStyle = '#64748b';
          ctx.font = '15px monospace';
          ctx.fillText(qrWebUrl, canvas.width / 2, qrY + qrSize + 55);

          // Instructions Box
          const instY = 1140;
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(90, instY, canvas.width - 180, 420, 20);
          ctx.fill();
          ctx.stroke();

          ctx.textAlign = 'left';
          ctx.fillStyle = '#1e293b';
          ctx.font = 'bold 24px "Chakra Petch", sans-serif';
          ctx.fillText('📱 ขั้นตอนการสแกนลงเวลาสำหรับพนักงาน:', 130, instY + 55);

          ctx.fillStyle = '#334155';
          ctx.font = '20px "Chakra Petch", sans-serif';
          ctx.fillText(
            '1. เปิดกล้องมือถือ หรือแอป LINE สแกน QR Code ด้านบนเพื่อเปิดหน้าเว็บ',
            130,
            instY + 120
          );
          ctx.fillText(
            '2. กรอกรหัสพนักงาน (เช่น NS02-006) และรหัส PIN 4 หลักประจำตัว',
            130,
            instY + 180
          );
          ctx.fillText(
            `3. กดยืนยันตำแหน่ง GPS ของอุปกรณ์ (ต้องอยู่ภายในรัศมี ${
              selectedBranch?.radiusMeters || 100
            } ม. ของสาขา)`,
            130,
            instY + 240
          );
          ctx.fillText(
            '4. ถ่ายภาพ Selfie หน้าตรงเพื่อยืนยันตัวตน และกดบันทึกเวลาเข้า/ออกงาน',
            130,
            instY + 300
          );

          // Footer
          ctx.textAlign = 'center';
          ctx.fillStyle = '#94a3b8';
          ctx.font = '16px "Chakra Petch", sans-serif';
          ctx.fillText(
            'ระบบบันทึกเวลาปฏิบัติงานออนไลน์ NOVASOL Ltd. • มีการตรวจสอบพิกัด GPS และ Selfie',
            canvas.width / 2,
            1660
          );

          // Trigger download
          const a = document.createElement('a');
          a.download = `NOVASOL_QR_Poster_${selectedBranch?.name || 'branch'}.png`;
          a.href = canvas.toDataURL('image/png');
          a.click();
          setIsGeneratingPng(false);
        };

        qrImg.onerror = () => {
          setIsGeneratingPng(false);
          alert('ไม่สามารถเรนเดอร์ภาพ QR Code ได้ กรุณาใช้ปุ่มพิมพ์ปกติ');
        };

        qrImg.src = blobURL;
      } else {
        setIsGeneratingPng(false);
      }
    } catch (e) {
      console.warn('Canvas poster error:', e);
      setIsGeneratingPng(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <QrCode className="w-6 h-6 text-indigo-600" />
            สร้างและพิมพ์ QR Code โปสเตอร์ A4 ประจำสาขา (Branch QR Poster)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            สร้างป้าย QR Code ขนาด A4 สำหรับนำไปพิมพ์หรือติดที่หน้างาน เพื่อให้พนักงานสแกนลงเวลาเข้า-ออกงาน
          </p>
        </div>

        {!isBranchRestricted && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-700">เลือกสาขา:</label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-hidden cursor-pointer"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.type === 'hq' ? '🏢' : '🏪'} {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main QR Code Poster Preview (Formatted for A4 Print & Display) */}
      <div
        id="printable-qr-poster"
        className="a4-print-target max-w-xl mx-auto bg-white rounded-3xl border-2 border-indigo-500/30 p-8 shadow-xl space-y-5 text-center relative overflow-hidden"
      >
        {/* Top Decorative Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-sky-600 text-white -mx-8 -mt-8 p-6 space-y-2">
          <div className="flex justify-center mb-2">
            <div className="bg-white p-2 rounded-xl shadow-xs inline-block">
              <img
                src="https://i.postimg.cc/FHGkmGKB/NOVASOL-1/logo.png"
                alt="NOVASOL Logo"
                className="h-10 w-auto object-contain"
              />
            </div>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            ห้างหุ้นส่วนจำกัด โนวาโซล (NOVASOL Ltd.)
          </h3>
          <p className="text-indigo-100 text-xs font-semibold">
            จุดลงเวลาเข้า-ออกงานประจำสาขา (TIME CLOCK STATION)
          </p>
        </div>

        {/* Branch Details & Work Shift */}
        <div className="space-y-1.5">
          <div className="inline-block bg-indigo-50 text-indigo-900 font-bold text-sm px-4 py-1 rounded-full border border-indigo-200">
            {selectedBranch?.name}
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {selectedBranch?.address || 'ไม่ระบุที่อยู่'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-1 text-xs">
            <span className="text-indigo-700 font-semibold flex items-center gap-1 bg-indigo-50/60 px-2.5 py-1 rounded-lg border border-indigo-100">
              <Clock className="w-3.5 h-3.5" />
              เวลาทำงาน: {selectedBranch?.workStartTime || '08:30'} -{' '}
              {selectedBranch?.workEndTime || '17:30'} น.
            </span>
            <span className="text-slate-600 font-medium flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg">
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              รัศมีเช็คอิน {selectedBranch?.radiusMeters} เมตร
            </span>
          </div>
        </div>

        {/* Generated QR Code Container (Encodes Real URL) */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 inline-block shadow-inner">
          <QRCodeSVG
            id="branch-qr-svg"
            value={qrWebUrl}
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

        {/* Direct Link Preview with Copy */}
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-xs no-print">
          <span className="font-mono text-[11px] text-slate-600 truncate text-left select-all">
            {qrWebUrl}
          </span>
          <button
            onClick={handleCopyLink}
            className="shrink-0 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer transition"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
          </button>
        </div>

        {isVercelDeploymentUrl && (
          <div className="no-print text-left text-xs bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl space-y-1">
            <p className="font-bold">⚠️ QR นี้อาจสแกนไม่ได้: กำลังใช้ลิงก์เฉพาะของ Vercel deployment</p>
            <p>
              ลิงก์แบบ <span className="font-mono">xxx-รหัส-ทีม.vercel.app</span> ถูก Vercel บังคับล็อกอิน
              พนักงานทั่วไปจะเข้าไม่ได้ ให้เปิดระบบผ่านโดเมนหลัก (Production Domain) แล้วสร้าง QR ใหม่
              หรือตั้งค่า <span className="font-mono">VITE_PUBLIC_APP_URL</span> ใน Vercel
            </p>
          </div>
        )}

        {/* Instructions for Employees */}
        <div className="space-y-2 text-xs text-slate-600 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
          <div className="font-bold text-indigo-950 text-xs flex items-center justify-center gap-1.5">
            <Smartphone className="w-4 h-4 text-indigo-600" />
            ขั้นตอนการสแกนลงเวลาเข้า-ออกงาน
          </div>
          <ol className="text-left text-[11px] space-y-1 pl-4 list-decimal text-slate-700 font-medium">
            <li>เปิดกล้องมือถือหรือแอป LINE สแกน QR Code นี้เพื่อเปิดหน้าเว็บ</li>
            <li>กรอกรหัสพนักงาน (เช่น NS02-006) และรหัส PIN 4 หลัก</li>
            <li>
              ยืนยันตำแหน่ง GPS ว่าอยู่ภายในสาขา (ระยะไม่เกิน {selectedBranch?.radiusMeters} เมตร)
            </li>
            <li>ถ่ายภาพ Selfie หน้าตรงเพื่อยืนยันตัวตนและบันทึกเวลาทำงาน</li>
          </ol>
        </div>

        {/* Multi-Channel Print and Export Actions */}
        <div className="pt-3 flex flex-wrap items-center justify-center gap-2.5 no-print">
          {/* Main Action: Print Now */}
          <button
            onClick={handlePrintQrPoster}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition"
            title="สั่งพิมพ์โปสเตอร์ขนาด A4 ทันที"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์โปสเตอร์ A4 (Print Now)</span>
          </button>

          {/* Secondary Action: Open in New Tab to Print */}
          <button
            onClick={handleOpenInNewTab}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition"
            title="เปิดหน้าพิมพ์ในแท็บใหม่เพื่อป้องกันข้อจำกัดใน iframe"
          >
            <ExternalLink className="w-4 h-4 text-sky-300" />
            <span>เปิดแท็บใหม่เพื่อพิมพ์</span>
          </button>

          {/* Download Action: High-Res PNG */}
          <button
            onClick={handleDownloadPosterImage}
            disabled={isGeneratingPng}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition"
            title="ดาวน์โหลดไฟล์รูปภาพ PNG ความละเอียดสูง สำหรับส่ง LINE หรือพิมพ์ในโปรแกรมดูภาพ"
          >
            <Download className="w-4 h-4" />
            <span>{isGeneratingPng ? 'กำลังสร้างรูป...' : 'ดาวน์โหลดรูปโปสเตอร์ A4'}</span>
          </button>

          {/* Test Action: Open Clock-in Modal */}
          <button
            onClick={() => onOpenCheckInForBranch(selectedBranch.id)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>ทดสอบเปิดหน้าลงเวลา</span>
          </button>
        </div>
      </div>
    </div>
  );
};
