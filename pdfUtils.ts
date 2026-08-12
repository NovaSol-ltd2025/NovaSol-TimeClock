import { AttendanceRecord, Branch, Employee } from '../types';

export interface ReportFilterOptions {
  periodType: 'daily' | 'monthly';
  selectedDate: string; // YYYY-MM-DD
  selectedMonth: string; // YYYY-MM
  selectedBranchId: string; // 'all' or specific branchId
}

export function generatePrintableReportHTML(
  records: AttendanceRecord[],
  employees: Employee[],
  branches: Branch[],
  filter: ReportFilterOptions
): string {
  const branchMap = new Map(branches.map((b) => [b.id, b.name]));
  const branchName =
    filter.selectedBranchId === 'all'
      ? 'ทุกสาขา'
      : branchMap.get(filter.selectedBranchId) || 'ไม่ระบุสาขา';

  const periodTitle =
    filter.periodType === 'daily'
      ? `ประจำวันที่ ${formatThaiDate(filter.selectedDate)}`
      : `ประจำเดือน ${formatThaiMonthYear(filter.selectedMonth)}`;

  // Filter employees for this scope
  const filteredEmployees = employees.filter((emp) => {
    if (emp.status === 'terminated') return false;
    if (filter.selectedBranchId !== 'all' && emp.branchId !== filter.selectedBranchId)
      return false;
    return true;
  });

  // Calculate stats
  let totalPresent = 0;
  let totalLate = 0;
  let totalAbsences = 0;

  const rowsHtml = filteredEmployees
    .map((emp, index) => {
      const empBranchName = branchMap.get(emp.branchId) || '-';

      // Find attendance records for this employee
      const empRecords = records.filter((r) => {
        if (r.employeeId !== emp.id) return false;
        if (filter.periodType === 'daily') {
          return r.date === filter.selectedDate;
        } else {
          return r.date.startsWith(filter.selectedMonth);
        }
      });

      if (filter.periodType === 'daily') {
        const record = empRecords[0];
        const statusText = record
          ? record.status === 'late'
            ? 'มาสาย'
            : 'มาทำงาน'
          : 'ยังไม่ลงเวลา/ขาดงาน';

        const statusColor = record
          ? record.status === 'late'
            ? '#d97706'
            : '#16a34a'
          : '#dc2626';

        if (record) {
          totalPresent++;
          if (record.status === 'late') totalLate++;
        } else {
          totalAbsences++;
        }

        return `
        <tr>
          <td style="text-align: center;">${index + 1}</td>
          <td><b>${emp.empCode}</b></td>
          <td><b>${emp.fullName}</b><br><small style="color:#64748b;">${emp.position}</small></td>
          <td>${empBranchName}</td>
          <td style="text-align: center; color: #1e293b; font-weight: 600;">${record?.timeIn || '-'}</td>
          <td style="text-align: center; color: #1e293b; font-weight: 600;">${record?.timeOut || '-'}</td>
          <td style="text-align: center;">
            <span style="display:inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold; background-color: ${statusColor}15; color: ${statusColor}; border: 1px solid ${statusColor}40;">
              ${statusText}
            </span>
          </td>
          <td style="text-align: center; font-size: 11px;">
            ${
              record?.distanceInMeters !== undefined
                ? `${record.distanceInMeters} ม. ${
                    record.isWithinRadiusIn ? '✓ ในรัศมี' : '⚠️ นอกรัศมี'
                  }`
                : '-'
            }
          </td>
          <td style="font-size: 11px; color: #475569;">${record?.notes || '-'}</td>
        </tr>
      `;
      } else {
        // Monthly Summary per employee
        const daysPresent = empRecords.filter((r) => r.timeIn).length;
        const daysLate = empRecords.filter((r) => r.status === 'late').length;

        totalPresent += daysPresent;
        totalLate += daysLate;

        return `
        <tr>
          <td style="text-align: center;">${index + 1}</td>
          <td><b>${emp.empCode}</b></td>
          <td><b>${emp.fullName}</b><br><small style="color:#64748b;">${emp.position}</small></td>
          <td>${empBranchName}</td>
          <td style="text-align: center; font-weight: bold; color: #16a34a;">${daysPresent} วัน</td>
          <td style="text-align: center; font-weight: bold; color: #d97706;">${daysLate} ครั้ง</td>
          <td style="text-align: center; font-weight: bold; color: #2563eb;">${(daysPresent * 8).toFixed(0)} ชม.</td>
          <td style="text-align: center;">
            <span style="font-size: 11px; color: #059669; font-weight: bold;">พร้อมอนุมัติจ่ายเงินเดือน</span>
          </td>
        </tr>
      `;
      }
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <title>รายงานสรุปการเข้า-ออกงาน - หจก.โนวาโซล</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600;700&display=swap');
        body {
          font-family: 'Chakra Petch', sans-serif;
          color: #0f172a;
          margin: 0;
          padding: 24px;
          background-color: #fff;
          font-size: 13px;
        }
        .header-table {
          width: 100%;
          border-bottom: 2px solid #0284c7;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .logo {
          height: 55px;
          object-fit: contain;
        }
        .title {
          font-size: 20px;
          font-weight: 700;
          color: #0369a1;
          margin: 0;
        }
        .subtitle {
          font-size: 13px;
          color: #475569;
          margin-top: 4px;
        }
        .badge-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }
        .stat-box {
          flex: 1;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px;
          text-align: center;
          background: #f8fafc;
        }
        .stat-box .num {
          font-size: 18px;
          font-weight: bold;
          color: #0284c7;
        }
        .stat-box .label {
          font-size: 11px;
          color: #64748b;
        }
        table.data-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
        }
        table.data-table th, table.data-table td {
          border: 1px solid #cbd5e1;
          padding: 8px 10px;
          text-align: left;
        }
        table.data-table th {
          background-color: #f1f5f9;
          color: #1e293b;
          font-weight: 700;
          font-size: 12px;
        }
        .footer-signatures {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
        }
        .sign-block {
          width: 30%;
          text-align: center;
          border-top: 1px stroke #94a3b8;
          padding-top: 8px;
        }
        .line {
          border-bottom: 1px dotted #94a3b8;
          margin: 40px auto 8px auto;
          width: 80%;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 16px; text-align: right;">
        <button onclick="window.print()" style="background: #0284c7; color: white; border: none; padding: 10px 20px; font-family: inherit; font-size: 14px; font-weight: bold; border-radius: 6px; cursor: pointer;">
          🖨️ พิมพ์เอกสาร / บันทึก PDF
        </button>
      </div>

      <table class="header-table">
        <tr>
          <td style="width: 120px;">
            <img src="https://i.postimg.cc/FHGkmGKB/NOVASOL-1/logo.png" alt="NOVASOL Logo" class="logo" />
          </td>
          <td>
            <h1 class="title">รายงานสรุปการเข้า-ออกงานพนักงาน (หจก.โนวาโซล)</h1>
            <div class="subtitle">
              สาขา: <b>${branchName}</b> | ${periodTitle} | พิมพ์เมื่อ: ${new Date().toLocaleString(
                'th-TH'
              )}
            </div>
          </td>
        </tr>
      </table>

      <div class="badge-bar">
        <div class="stat-box">
          <div class="num">${filteredEmployees.length}</div>
          <div class="label">จำนวนพนักงานทั้งหมด</div>
        </div>
        <div class="stat-box">
          <div class="num" style="color: #16a34a;">${totalPresent}</div>
          <div class="label">${
            filter.periodType === 'daily' ? 'มาทำงานวันนี้' : 'รวมวันที่มาทำงาน'
          }</div>
        </div>
        <div class="stat-box">
          <div class="num" style="color: #d97706;">${totalLate}</div>
          <div class="label">มาสาย</div>
        </div>
        ${
          filter.periodType === 'daily'
            ? `
        <div class="stat-box">
          <div class="num" style="color: #dc2626;">${totalAbsences}</div>
          <div class="label">ยังไม่เข้างาน/ขาดงาน</div>
        </div>
        `
            : ''
        }
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">ลำดับ</th>
            <th style="width: 80px;">รหัสพนักงาน</th>
            <th>ชื่อ-นามสกุล / ตำแหน่ง</th>
            <th>สาขาปฏิบัติงาน</th>
            ${
              filter.periodType === 'daily'
                ? `
              <th style="text-align: center; width: 80px;">เวลาเข้า</th>
              <th style="text-align: center; width: 80px;">เวลาออก</th>
              <th style="text-align: center; width: 90px;">สถานะ</th>
              <th style="text-align: center; width: 110px;">ระยะทาง GPS</th>
              <th>หมายเหตุ</th>
            `
                : `
              <th style="text-align: center; width: 90px;">จำนวนวันมาทำ</th>
              <th style="text-align: center; width: 80px;">จำนวนสาย</th>
              <th style="text-align: center; width: 100px;">ชม. ทำงานรวม</th>
              <th style="text-align: center; width: 130px;">หมายเหตุจ่ายค่าจ้าง</th>
            `
            }
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div style="font-size: 11px; color: #64748b; margin-top: 10px;">
        * เอกสารสรุปเวลานี้จัดทำขึ้นเพื่อใช้ประกอบการพิจารณาอนุมัติจ่ายค่าจ้าง/เงินเดือนประจำงวด ของ หจก.โนวาโซล
      </div>

      <div class="footer-signatures">
        <div class="sign-block">
          <div class="line"></div>
          <div>( ..................................................... )</div>
          <div>ผู้จัดทำ / เจ้าหน้าที่บุคคล</div>
        </div>
        <div class="sign-block">
          <div class="line"></div>
          <div>( ..................................................... )</div>
          <div>ผู้ตรวจสอบ / หัวหน้าสาขา</div>
        </div>
        <div class="sign-block">
          <div class="line"></div>
          <div>( ..................................................... )</div>
          <div>ผู้อนุมัติ / ผู้จัดการ (หจก.โนวาโซล)</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

function formatThaiDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const monthNames = [
    'มกราคม',
    'กุมภาพันธ์',
    'มีนาคม',
    'เมษายน',
    'พฤษภาคม',
    'มิถุนายน',
    'กรกฎาคม',
    'สิงหาคม',
    'กันยายน',
    'ตุลาคม',
    'พฤศจิกายน',
    'ธันวาคม',
  ];
  return `${d.getDate()} ${monthNames[d.getMonth()]} พ.ศ. ${d.getFullYear() + 543}`;
}

function formatThaiMonthYear(monthStr: string): string {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const monthIndex = parseInt(month, 10) - 1;
  const monthNames = [
    'มกราคม',
    'กุมภาพันธ์',
    'มีนาคม',
    'เมษายน',
    'พฤษภาคม',
    'มิถุนายน',
    'กรกฎาคม',
    'สิงหาคม',
    'กันยายน',
    'ตุลาคม',
    'พฤศจิกายน',
    'ธันวาคม',
  ];
  const yearBE = parseInt(year, 10) + 543;
  return `${monthNames[monthIndex]} ${yearBE}`;
}
