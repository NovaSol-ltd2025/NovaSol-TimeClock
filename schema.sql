-- NOVASOL Time Clock : ตารางสำหรับข้อมูลแบบ Real-time (ไม่ชนกับตารางเดิมในโปรเจกต์)
-- ชื่อคอลัมน์เป็น snake_case ทั้งหมด (แอปแปลงจาก/เป็น camelCase ให้อัตโนมัติ)

CREATE TABLE IF NOT EXISTS public.ns_branches (
  id                     TEXT PRIMARY KEY,
  name                   TEXT NOT NULL,
  type                   TEXT NOT NULL DEFAULT 'sub',          -- 'hq' | 'sub'
  latitude               DOUBLE PRECISION NOT NULL,
  longitude              DOUBLE PRECISION NOT NULL,
  radius_meters          INTEGER NOT NULL DEFAULT 100,
  address                TEXT,
  phone                  TEXT,
  work_start_time        TEXT,                                  -- 'HH:mm'
  work_end_time          TEXT,                                  -- 'HH:mm'
  late_threshold_minutes INTEGER,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ns_employees (
  id          TEXT PRIMARY KEY,
  emp_code    TEXT NOT NULL,
  full_name   TEXT NOT NULL,
  branch_id   TEXT,
  pin         TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'active',                  -- 'active' | 'terminated'
  position    TEXT,
  department  TEXT,
  phone       TEXT,
  email       TEXT,
  avatar_url  TEXT,
  joined_date TEXT,                                            -- 'YYYY-MM-DD'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ns_employees_branch_idx ON public.ns_employees (branch_id);

CREATE TABLE IF NOT EXISTS public.ns_user_rights (
  id                    TEXT PRIMARY KEY,
  username              TEXT NOT NULL UNIQUE,
  full_name             TEXT NOT NULL,
  role                  TEXT NOT NULL DEFAULT 'staff',         -- 'admin' | 'supervisor' | 'staff'
  password              TEXT,
  employee_id           TEXT,
  branch_scope          TEXT DEFAULT 'all',
  can_manage_users      BOOLEAN NOT NULL DEFAULT false,
  can_manage_employees  BOOLEAN NOT NULL DEFAULT false,
  can_manage_branches   BOOLEAN NOT NULL DEFAULT false,
  can_generate_qr       BOOLEAN NOT NULL DEFAULT false,
  can_export_reports    BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ns_attendance_records (
  id                     TEXT PRIMARY KEY,
  employee_id            TEXT NOT NULL,
  employee_name          TEXT NOT NULL,
  branch_id              TEXT NOT NULL,
  branch_name            TEXT NOT NULL,
  date                   TEXT NOT NULL,                        -- 'YYYY-MM-DD'
  time_in                TEXT,                                 -- 'HH:mm:ss'
  time_out               TEXT,
  selfie_in_url          TEXT,
  selfie_out_url         TEXT,
  latitude_in            DOUBLE PRECISION,
  longitude_in           DOUBLE PRECISION,
  latitude_out           DOUBLE PRECISION,
  longitude_out          DOUBLE PRECISION,
  distance_in_meters     INTEGER,
  distance_out_meters    INTEGER,
  is_within_radius_in    BOOLEAN,
  is_within_radius_out   BOOLEAN,
  status                 TEXT NOT NULL DEFAULT 'present',      -- 'present' | 'late' | 'early_leave' | 'absent'
  notes                  TEXT,
  is_adjusted_by_admin   BOOLEAN,
  admin_adjust_reason    TEXT,
  adjusted_by_admin_name TEXT,
  adjusted_at            TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ns_attendance_date_idx   ON public.ns_attendance_records (date DESC);
CREATE INDEX IF NOT EXISTS ns_attendance_branch_idx ON public.ns_attendance_records (branch_id);
CREATE INDEX IF NOT EXISTS ns_attendance_emp_idx    ON public.ns_attendance_records (employee_id);

-- RLS: แอปเป็นหน้าเว็บล้วน (ใช้ anon key) จึงต้องเปิดสิทธิ์ให้ anon/authenticated
-- *** ดูหมายเหตุด้านความปลอดภัยใน README ก่อนใช้งานจริง ***
ALTER TABLE public.ns_branches           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ns_employees          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ns_user_rights        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ns_attendance_records ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['ns_branches','ns_employees','ns_user_rights','ns_attendance_records'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname='app_full_access') THEN
      EXECUTE format(
        'CREATE POLICY app_full_access ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', t);
    END IF;
  END LOOP;
END $$;

-- เปิด Realtime
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['ns_branches','ns_employees','ns_user_rights','ns_attendance_records'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename=t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

-- สิทธิ์ระดับตาราง: โปรเจกต์ Supabase ใหม่ไม่ให้สิทธิ์ตารางแก่ anon อัตโนมัติ (ไม่งั้นจะขึ้น "permission denied")
REVOKE TRUNCATE, REFERENCES, TRIGGER ON
  public.ns_branches, public.ns_employees, public.ns_user_rights, public.ns_attendance_records
  FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.ns_branches, public.ns_employees, public.ns_user_rights, public.ns_attendance_records
  TO anon, authenticated;
