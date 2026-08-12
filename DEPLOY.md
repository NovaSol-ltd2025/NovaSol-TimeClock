# คู่มือ Deploy ระบบลงเวลาเข้า-ออกงาน โนวาโซล

## ✅ สิ่งที่แก้ไข/เตรียมไว้ให้แล้ว

1. **Supabase เชื่อมต่อและใช้งานได้ทันที** — สร้างโปรเจกต์ `NovaSol-TimeCock` พร้อมตาราง
   `branches`, `employees`, `user_rights`, `attendance_records` และใส่ข้อมูลตัวอย่างไว้แล้ว
2. **แก้บั๊กสำคัญ**: schema เดิมสร้างคอลัมน์แบบ camelCase โดยไม่ใส่ quote (เช่น `empCode`)
   ทำให้ Postgres แปลงเป็นตัวพิมพ์เล็กอัตโนมัติ (`empcode`) และแอปอ่านข้อมูลไม่ตรงกัน — แก้แล้วโดย
   สร้างตารางใหม่ด้วยคอลัมน์ที่มี quote ครอบ ตรงกับที่โค้ดคาดหวัง
3. **ฝัง Supabase URL/Key เป็นค่าเริ่มต้นในโค้ด** (`src/lib/supabase.ts`) แอปจึงเชื่อมต่อฐานข้อมูลได้
   ทันทีโดยไม่ต้องตั้งค่าอะไรเพิ่ม (ใช้ anon/publishable key ซึ่งปลอดภัยที่จะฝังในโค้ดฝั่ง client
   เพราะการเข้าถึงข้อมูลถูกควบคุมด้วย Row Level Security ที่ฐานข้อมูล)
   - หากต้องการเปลี่ยนไปใช้ Supabase โปรเจกต์อื่น ตั้งค่า Environment Variables บน Vercel:
     `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` หรือใช้หน้าตั้งค่าในแอป (ปุ่ม Database ⚙️)
4. Build ผ่านแล้ว ไม่มี TypeScript error (`npm run build` สำเร็จ)

## 📦 ขั้นตอนที่ 1: อัปโหลดโค้ดขึ้น GitHub

ผมไม่มีการเชื่อมต่อ GitHub ในระบบนี้ จึง push ให้อัตโนมัติไม่ได้ — ทำตามนี้ที่เครื่องของคุณ:

```bash
# แตกไฟล์ zip แล้วเข้าไปในโฟลเดอร์โปรเจกต์
cd novasol-attendance

git init
git add .
git commit -m "Initial commit: ระบบลงเวลาเข้า-ออกงาน โนวาโซล + Supabase"

# สร้าง repo ใหม่บน https://github.com/new (ตั้งชื่อ เช่น novasol-attendance)
# แล้วรันคำสั่งที่ GitHub แสดงให้ (แทน YOUR_USERNAME ด้วยชื่อจริง):
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/novasol-attendance.git
git push -u origin main
```

## 🚀 ขั้นตอนที่ 2: Deploy บน Vercel

1. เข้า https://vercel.com/new
2. เลือก "Import Git Repository" แล้วเลือก repo `novasol-attendance` ที่เพิ่ง push ขึ้นไป
3. Vercel จะตรวจจับว่าเป็นโปรเจกต์ Vite ให้อัตโนมัติ — กด **Deploy** ได้เลย (ไม่ต้องตั้งค่า
   Environment Variables ก็ใช้งานได้ เพราะฝัง Supabase key ไว้ในโค้ดแล้ว)
4. รอ 1-2 นาที จะได้ URL เช่น `https://novasol-attendance.vercel.app`

**ทางเลือกอื่น (ไม่ต้องใช้ GitHub):** ใช้ Vercel CLI ที่เครื่องคุณเอง
```bash
npm i -g vercel
cd novasol-attendance
vercel --prod
```

## 🔑 บัญชีทดสอบที่ seed ไว้ในฐานข้อมูลแล้ว

| Username | Role | สิทธิ |
|---|---|---|
| admin | ผู้ดูแลระบบ | จัดการได้ทุกอย่าง |
| sup_chonburi | หัวหน้าสาขาชลบุรี | ดูรายงาน/สร้าง QR สาขาชลบุรี |
| staff_user | พนักงาน | เช็คอิน/เช็คเอาท์เท่านั้น |

พนักงานตัวอย่าง (ใช้ PIN เช็คอิน): NS-001 ถึง NS-006 (ดู PIN ในหน้า "จัดการพนักงาน")

## 🛠️ แก้ปัญหา: Build error `Command "vite build" exited with 127`

สาเหตุ: โปรเจกต์เดิมมีทั้ง `package-lock.json` (npm) และ `bun.lock` (bun) อยู่พร้อมกัน ทำให้ Vercel
เดา package manager ผิด (สลับไปใช้ bun) และขั้นตอนติดตั้ง dependency ไม่สมบูรณ์ ผลคือหา `vite`
ไม่เจอตอน build (error 127 = command not found)

**แก้แล้วในไฟล์ zip นี้** โดย:
- ลบ `bun.lock` ออก เหลือแค่ `package-lock.json` (npm อย่างเดียว ไม่กำกวม)
- กำหนด `buildCommand`, `installCommand`, `outputDirectory` ตรงๆ ใน `vercel.json` กันการเดาผิดซ้ำ

**ถ้าคุณ push โค้ดเวอร์ชันเก่าขึ้น GitHub ไปแล้วและเจอ error นี้อยู่** ให้แทนที่ไฟล์ในโฟลเดอร์โปรเจกต์
ด้วยไฟล์จาก zip นี้ (โดยเฉพาะ `vercel.json` และลบ `bun.lock` ทิ้ง) แล้ว commit + push ใหม่:

```bash
rm bun.lock
git add -A
git commit -m "fix: remove conflicting bun.lock, pin build commands for Vercel"
git push
```

Vercel จะ redeploy อัตโนมัติเมื่อ push ขึ้น branch ที่เชื่อมไว้ (เช่น `main`)

## 🗄️ ข้อมูลเชื่อมต่อ Supabase (สำหรับอ้างอิง/เปลี่ยนโปรเจกต์)

- Project: `NovaSol-TimeCock`
- URL: `https://bhglkhlzvctqmdjnrgum.supabase.co`
- Dashboard: https://supabase.com/dashboard/project/bhglkhlzvctqmdjnrgum
