-- ข้อมูลตั้งต้น: สาขา 4 แห่ง + บัญชี admin (เปลี่ยนรหัสผ่านทันทีหลังล็อกอินครั้งแรก)
INSERT INTO public.ns_branches (id,name,type,latitude,longitude,radius_meters,address,phone,work_start_time,work_end_time,late_threshold_minutes) VALUES
('b-hq','สำนักงานใหญ่ (กรุงเทพมหานคร)','hq',13.7563,100.5018,100,'99/1 อาคารโนวาโซล ถนนพระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310','02-123-4567','08:30','17:30',15),
('b-chonburi','สาขาชลบุรี-พัทยา','sub',12.9236,100.8825,100,'45/8 หมู่ 5 ถนนสุขุมวิท ต.นาเกลือ อ.บางละมุง จ.ชลบุรี 20150','038-987-654','09:00','18:00',15),
('b-chiangmai','สาขาเชียงใหม่','sub',18.7883,98.9853,150,'120/3 ถนนซุปเปอร์ไฮเวย์ ต.ช้างเผือก อ.เมือง จ.เชียงใหม่ 50300','053-111-222','08:00','17:00',10),
('b-phuket','สาขาภูเก็ต','sub',7.8804,98.3923,100,'88/9 ถนนเทพกระษัตรี ต.ตลาดใหญ่ อ.เมือง จ.ภูเก็ต 83000','076-333-444','09:30','18:30',15)
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ns_user_rights (id,username,full_name,role,password,employee_id,branch_scope,can_manage_users,can_manage_employees,can_manage_branches,can_generate_qr,can_export_reports) VALUES
('usr-admin','admin','ผู้ดูแลระบบ (Admin โนวาโซล)','admin','admin123',NULL,'all',true,true,true,true,true)
ON CONFLICT (id) DO NOTHING;
