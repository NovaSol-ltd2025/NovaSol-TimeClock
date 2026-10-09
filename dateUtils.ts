/**
 * ฟังก์ชันเกี่ยวกับวันที่/เวลา: บังคับใช้โซนเวลาไทย (Asia/Bangkok) เสมอ
 *
 * เดิมโค้ดใช้ `new Date().toISOString().split('T')[0]` เพื่อหา "วันที่วันนี้" ซึ่งเป็นวันที่ตาม UTC
 * ไม่ใช่เวลาไทย (UTC+7) ทำให้การสแกนช่วงเที่ยงคืน-06:59 น. เวลาไทย (ซึ่งยังเป็น "เมื่อวาน" ใน UTC)
 * ถูกบันทึกผิดเป็นวันก่อนหน้าเสมอ พนักงานกะเช้าที่สแกนตอน 05:00-07:00 น. จึงเจอปัญหานี้ทุกวัน
 *
 * ฟังก์ชันด้านล่างนี้คำนวณจากโซนเวลา Asia/Bangkok ตรงๆ ไม่พึ่งพาโซนเวลาของเครื่อง/เบราว์เซอร์ผู้ใช้
 * (กันปัญหาเพิ่มเติมกรณีมือถือบางเครื่องตั้งโซนเวลาผิด) ให้ใช้ฟังก์ชันเหล่านี้แทน Date ตรงๆ ทุกจุด
 * ที่ต้องการ "วันที่ของวันนี้" หรือ "เวลาปัจจุบัน" สำหรับบันทึกข้อมูล
 */

export const APP_TIME_ZONE = 'Asia/Bangkok';

/** คืนค่าวันที่แบบ 'YYYY-MM-DD' ตามเวลาไทย ของเวลาที่ระบุ (ค่าเริ่มต้น: เวลาปัจจุบัน) */
export function getThaiDateStr(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** คืนค่าเวลาแบบ 'HH:mm' (24 ชม.) ตามเวลาไทย ของเวลาที่ระบุ (ค่าเริ่มต้น: เวลาปัจจุบัน) */
export function getThaiTimeStr(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/** คืนค่า 'YYYY-MM' (เดือนของวันนี้) ตามเวลาไทย ของเวลาที่ระบุ */
export function getThaiMonthStr(date: Date = new Date()): string {
  return getThaiDateStr(date).substring(0, 7);
}
