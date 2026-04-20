BEGIN;

UPDATE public.users
SET created_at = '2024-06-10 09:15:00',
    phone_number = '0903123456',
    updated_at = '2026-04-19 08:55:00',
    is_active = true,
    is_verify_email = true
WHERE user_id = 1;

UPDATE public.users
SET created_at = '2024-06-20 19:40:00',
    phone_number = '0918456789',
    updated_at = '2026-04-19 08:55:00',
    is_active = true,
    is_verify_email = true
WHERE user_id = 2;

UPDATE public.health_profile
SET allergy = 'Di ung penicillin',
    avatar_url = NULL,
    birthday = '1989-05-10',
    blood_type = 'O_POSITIVE',
    emergency_contact_phone = '0903123456',
    full_name = 'Cao Hoang Phuc',
    gender = 'MALE',
    height = 170.00,
    medical_history = 'Tang huyet ap nhe, tung dau da day theo dot',
    weight = 68.00,
    user_id = 1
WHERE profile = 1;

UPDATE public.health_profile
SET allergy = 'Khong ghi nhan',
    avatar_url = NULL,
    birthday = '1992-08-21',
    blood_type = 'A_POSITIVE',
    emergency_contact_phone = '0918456789',
    full_name = 'Ngoc Xuyen',
    gender = 'FEMALE',
    height = 158.00,
    medical_history = 'Thieu mau thieu sat sau sinh, dang theo doi dinh ky',
    weight = 52.00,
    user_id = 2
WHERE profile = 2;

UPDATE public.health_profile
SET allergy = 'Chua ghi nhan',
    avatar_url = NULL,
    birthday = '2024-06-15',
    blood_type = 'B_POSITIVE',
    emergency_contact_phone = '0903123456',
    full_name = 'Minh Than',
    gender = 'MALE',
    height = 82.00,
    medical_history = 'Sinh du thang, tung viem ho hap nhe luc 8 thang tuoi',
    weight = 11.30,
    user_id = 1
WHERE profile = 3;

UPDATE public.family
SET created_at = '2024-06-15',
    name = 'Gia dinh Phuc - Xuyen',
    owner = 1
WHERE family_id = 1;

UPDATE public.family_invitation
SET created_at = '2024-06-20 20:15:00',
    role = 2,
    status = 'ACCEPTED',
    family_id = 1,
    receiver_id = 2,
    sender_id = 1
WHERE invite_id = 1;

UPDATE public.family_medicine_cabinet
SET name = 'Tu thuoc gia dinh phong khach',
    family_id = 1
WHERE cabinet_id = 1;

UPDATE public.family_relationship
SET join_at = '2024-06-15',
    role = 'OWNER',
    family_id = 1,
    profile_id = 1
WHERE fam_rela_id = 1;

UPDATE public.family_relationship
SET join_at = '2024-06-20',
    role = 'MOTHER',
    family_id = 1,
    profile_id = 2
WHERE fam_rela_id = 2;

UPDATE public.family_relationship
SET join_at = '2024-06-15',
    role = 'YOUNGER',
    family_id = 1,
    profile_id = 3
WHERE fam_rela_id = 3;

UPDATE public.details_medicine
SET expiry_date = '2027-01-31',
    name = 'Paracetamol 500mg',
    quantity = 16,
    unit = 'vien',
    cabinet_id = 1
WHERE medicine_id = 1;

INSERT INTO public.details_medicine (medicine_id, expiry_date, name, quantity, unit, cabinet_id)
VALUES
    (2, '2027-03-31', 'Amlodipine 5mg', 28, 'vien', 1),
    (3, '2026-11-30', 'BioGaia Protectis', 1, 'lo', 1),
    (4, '2027-06-30', 'Nuoc muoi sinh ly Fysoline', 6, 'ong', 1)
ON CONFLICT (medicine_id) DO UPDATE
SET expiry_date = EXCLUDED.expiry_date,
    name = EXCLUDED.name,
    quantity = EXCLUDED.quantity,
    unit = EXCLUDED.unit,
    cabinet_id = EXCLUDED.cabinet_id;

INSERT INTO public.appointment (appointment_id, appointment_date, clinic_name, doctor_name, location, note, status, profile_id)
VALUES
    (1, '2026-04-20 09:00:00', 'Benh vien Tim Tam Duc', 'Nguyen Van Hung', '4 Nguyen Luong Bang, Quan 7, TP.HCM', 'Tai kham huyet ap sau 1 thang dung thuoc', 'SCHEDULED', 1),
    (2, '2026-03-12 08:30:00', 'Phong kham CarePlus', 'Le Thu Ha', '105 Ton Dat Tien, Quan 7, TP.HCM', 'Kham tong quat dinh ky quy I', 'COMPLETED', 1),
    (3, '2026-04-22 14:00:00', 'VNVC Phu My Hung', 'Tran Ngoc Lan', '224 Nguyen Luong Bang, Quan 7, TP.HCM', 'Kham sang loc truoc mui cum mua', 'SCHEDULED', 3),
    (4, '2026-02-10 10:00:00', 'Benh vien Nhi Dong Thanh Pho', 'Pham Quoc Bao', '15 Vo Tran Chi, Binh Chanh, TP.HCM', 'Tai kham sau dot ho keo dai', 'COMPLETED', 3)
ON CONFLICT (appointment_id) DO UPDATE
SET appointment_date = EXCLUDED.appointment_date,
    clinic_name = EXCLUDED.clinic_name,
    doctor_name = EXCLUDED.doctor_name,
    location = EXCLUDED.location,
    note = EXCLUDED.note,
    status = EXCLUDED.status,
    profile_id = EXCLUDED.profile_id;

INSERT INTO public.growth_log (growth_id, height, note, record_date, weight, profile_id)
VALUES
    (1, 62.00, 'Kham sau sinh 2 thang, tang truong tot', '2024-08-15', 6.20, 3),
    (2, 69.00, 'Bat dau an dam, ngu on dinh hon', '2024-12-15', 8.10, 3),
    (3, 74.00, 'Sau tiem nhac 6 trong 1, suc khoe on dinh', '2025-04-15', 9.20, 3),
    (4, 78.00, 'An tot, khong con non tro ban dem', '2025-10-15', 10.10, 3),
    (5, 82.00, 'Kham dinh ky 22 thang tuoi, van dong nhanh nhen', '2026-04-10', 11.30, 3)
ON CONFLICT (growth_id) DO UPDATE
SET height = EXCLUDED.height,
    note = EXCLUDED.note,
    record_date = EXCLUDED.record_date,
    weight = EXCLUDED.weight,
    profile_id = EXCLUDED.profile_id;

INSERT INTO public.medicine_schedule (schedule_id, dosage, end_date, frequency, is_taken, medicine_name, note, start_date, medicine_id, profile_id)
VALUES
    (1, '1 vien/lan sau an sang', '2026-04-30', 1, false, 'Amlodipine 5mg', 'Uong deu moi sang, theo doi huyet ap buoi toi', '2026-04-01', 2, 1),
    (2, '5 giot/lan sau an', '2026-04-22', 2, false, 'BioGaia Protectis', 'Dung sau dot roi loan tieu hoa nhe', '2026-04-18', 3, 3)
ON CONFLICT (schedule_id) DO UPDATE
SET dosage = EXCLUDED.dosage,
    end_date = EXCLUDED.end_date,
    frequency = EXCLUDED.frequency,
    is_taken = EXCLUDED.is_taken,
    medicine_name = EXCLUDED.medicine_name,
    note = EXCLUDED.note,
    start_date = EXCLUDED.start_date,
    medicine_id = EXCLUDED.medicine_id,
    profile_id = EXCLUDED.profile_id;

INSERT INTO public.medicine_dose_status (dose_id, dose_date, is_taken, note, session, taken_at, schedule_id)
VALUES
    (1, '2026-04-18', true, 'Da uong sau an sang', 'MORNING', '2026-04-18 07:35:00', 1),
    (2, '2026-04-19', true, 'Da uong sau bua sang', 'MORNING', '2026-04-19 07:40:00', 1),
    (3, '2026-04-20', false, NULL, 'MORNING', NULL, 1),
    (4, '2026-04-18', true, 'Be uong sau bua sang', 'MORNING', '2026-04-18 08:10:00', 2),
    (5, '2026-04-18', true, 'Be uong sau bua toi', 'EVENING', '2026-04-18 20:15:00', 2),
    (6, '2026-04-19', true, 'Be uong du lieu sang', 'MORNING', '2026-04-19 08:05:00', 2),
    (7, '2026-04-19', false, NULL, 'EVENING', NULL, 2),
    (8, '2026-04-20', false, NULL, 'MORNING', NULL, 2),
    (9, '2026-04-20', false, NULL, 'EVENING', NULL, 2)
ON CONFLICT (dose_id) DO UPDATE
SET dose_date = EXCLUDED.dose_date,
    is_taken = EXCLUDED.is_taken,
    note = EXCLUDED.note,
    session = EXCLUDED.session,
    taken_at = EXCLUDED.taken_at,
    schedule_id = EXCLUDED.schedule_id;

INSERT INTO public.vaccination (vaccine_log_id, clinic_name, date_given, dose_number, planned_date, status, vaccine_name, profile_id)
VALUES
    (1, 'Benh vien Tu Du', '2024-06-15', 1, '2024-06-15', 'DONE', 'Viem gan B so sinh', 3),
    (2, 'VNVC Phu My Hung', '2024-06-16', 1, '2024-06-16', 'DONE', 'BCG', 3),
    (3, 'VNVC Phu My Hung', '2024-08-20', 1, '2024-08-18', 'DONE', '6 trong 1', 3),
    (4, 'VNVC Phu My Hung', '2024-10-20', 2, '2024-10-18', 'DONE', '6 trong 1', 3),
    (5, 'VNVC Phu My Hung', '2025-06-20', 1, '2025-06-15', 'DONE', 'Soi - Quai bi - Rubella', 3),
    (6, 'VNVC Phu My Hung', NULL, 1, '2026-04-21', 'PLANNED', 'Cum mua', 3)
ON CONFLICT (vaccine_log_id) DO UPDATE
SET clinic_name = EXCLUDED.clinic_name,
    date_given = EXCLUDED.date_given,
    dose_number = EXCLUDED.dose_number,
    planned_date = EXCLUDED.planned_date,
    status = EXCLUDED.status,
    vaccine_name = EXCLUDED.vaccine_name,
    profile_id = EXCLUDED.profile_id;

INSERT INTO public.ai_request_log (request_id, created_at, error_message, execution_time, feature_type, input_prompt, output_raw, provider, status, total_tokens)
VALUES
    (1, '2026-04-18 21:05:00', NULL, 2.41, 'OCR', 'Trich xuat toa thuoc tu anh chup va giu nguyen ten thuoc, lieu dung.', 'Amlodipine 5mg, ngay 1 vien buoi sang sau an; tai kham sau 1 thang.', 'OPENAI', 'SUCCESS', 612),
    (2, '2026-04-19 07:45:00', NULL, 1.88, 'CHAT', 'Lich tiem cum mua tiep theo cua Minh Than la khi nao?', 'Lich tiem cum mua dang duoc len ke hoach vao ngay 2026-04-21 tai VNVC Phu My Hung.', 'OPENAI', 'SUCCESS', 734)
ON CONFLICT (request_id) DO UPDATE
SET created_at = EXCLUDED.created_at,
    error_message = EXCLUDED.error_message,
    execution_time = EXCLUDED.execution_time,
    feature_type = EXCLUDED.feature_type,
    input_prompt = EXCLUDED.input_prompt,
    output_raw = EXCLUDED.output_raw,
    provider = EXCLUDED.provider,
    status = EXCLUDED.status,
    total_tokens = EXCLUDED.total_tokens;

INSERT INTO public.ocr_session (ocr_id, image_url, prompt_request, raw_text, status, structure_data, profile_id, request_id)
VALUES
    (1, 'https://cdn.carenest.app/demo/prescription-phuc-20260418.jpg', 'Trich xuat toa thuoc tu anh chup va giu nguyen ten thuoc, lieu dung.', 'Amlodipine 5mg ngay 1 vien buoi sang sau an. Tai kham sau 1 thang.', 'COMPLETED', '{"doctor":"Nguyen Van Hung","medicines":[{"name":"Amlodipine 5mg","dosage":"1 vien sang sau an"}],"follow_up":"1 thang"}', 1, 1)
ON CONFLICT (ocr_id) DO UPDATE
SET image_url = EXCLUDED.image_url,
    prompt_request = EXCLUDED.prompt_request,
    raw_text = EXCLUDED.raw_text,
    status = EXCLUDED.status,
    structure_data = EXCLUDED.structure_data,
    profile_id = EXCLUDED.profile_id,
    request_id = EXCLUDED.request_id;

INSERT INTO public.ai_conversation (conversation_id, created_at, status, title, updated_at, user_id)
VALUES
    (1, '2026-04-19 07:40:00', 'ACTIVE', 'Theo doi tiem chung cho Minh Than', '2026-04-19 07:46:00', 1)
ON CONFLICT (conversation_id) DO UPDATE
SET created_at = EXCLUDED.created_at,
    status = EXCLUDED.status,
    title = EXCLUDED.title,
    updated_at = EXCLUDED.updated_at,
    user_id = EXCLUDED.user_id;

INSERT INTO public.ai_chat_detail (message_id, content, message_type, sender, sent_at, conversation_id, ocr_id, request_id)
VALUES
    (1, 'Lich tiem cum mua tiep theo cua Minh Than la khi nao?', 'TEXT', 'USER', '2026-04-19 07:44:00', 1, NULL, 2),
    (2, 'Mui cum mua tiep theo cua be dang duoc len ke hoach vao ngay 2026-04-21 tai VNVC Phu My Hung.', 'TEXT', 'AI', '2026-04-19 07:45:00', 1, NULL, 2),
    (3, 'Anh nen dua be den som 15 phut va mang theo so tiem chung de bac si doi chieu mui truoc do.', 'SUGGESTION', 'AI', '2026-04-19 07:45:30', 1, NULL, 2)
ON CONFLICT (message_id) DO UPDATE
SET content = EXCLUDED.content,
    message_type = EXCLUDED.message_type,
    sender = EXCLUDED.sender,
    sent_at = EXCLUDED.sent_at,
    conversation_id = EXCLUDED.conversation_id,
    ocr_id = EXCLUDED.ocr_id,
    request_id = EXCLUDED.request_id;

INSERT INTO public.notifications (notification_id, content, is_read, reference_id, scheduled_time, title, type, profile_id)
VALUES
    (1, 'Ban co lich hen voi bac si Nguyen Van Hung tai Benh vien Tim Tam Duc', false, 1, '2026-04-20 09:00:00', 'Nhac lich hen kham', 'APPOINTMENT', 1),
    (2, 'Amlodipine 5mg - 1 vien/lan sau an sang (MORNING)', false, 3, '2026-04-20 08:00:00', 'Den gio uong thuoc', 'MEDICINE', 1),
    (3, 'Den lich tiem Cum mua - mui 1', false, 6, '2026-04-21 00:00:00', 'Nhac lich tiem chung', 'VACCINATION', 3),
    (4, 'Ho so gia dinh da duoc cap nhat day du thong tin suc khoe va lich cham soc.', true, NULL, '2026-04-19 08:30:00', 'Cap nhat ho so thanh cong', 'SYSTEM', 2)
ON CONFLICT (notification_id) DO UPDATE
SET content = EXCLUDED.content,
    is_read = EXCLUDED.is_read,
    reference_id = EXCLUDED.reference_id,
    scheduled_time = EXCLUDED.scheduled_time,
    title = EXCLUDED.title,
    type = EXCLUDED.type,
    profile_id = EXCLUDED.profile_id;

SELECT setval('public.appointment_appointment_id_seq', 4, true);
SELECT setval('public.details_medicine_medicine_id_seq', 4, true);
SELECT setval('public.family_family_id_seq', 1, true);
SELECT setval('public.family_invitation_invite_id_seq', 1, true);
SELECT setval('public.family_medicine_cabinet_cabinet_id_seq', 1, true);
SELECT setval('public.family_relationship_fam_rela_id_seq', 3, true);
SELECT setval('public.growth_log_growth_id_seq', 5, true);
SELECT setval('public.health_profile_profile_seq', 3, true);
SELECT setval('public.medicine_dose_status_dose_id_seq', 9, true);
SELECT setval('public.medicine_schedule_schedule_id_seq', 2, true);
SELECT setval('public.notifications_notification_id_seq', 4, true);
SELECT setval('public.ocr_session_ocr_id_seq', 1, true);
SELECT setval('public.ai_request_log_request_id_seq', 2, true);
SELECT setval('public.ai_conversation_conversation_id_seq', 1, true);
SELECT setval('public.ai_chat_detail_message_id_seq', 3, true);
SELECT setval('public.otp_tokens_id_seq', 2, true);
SELECT setval('public.users_user_id_seq', 2, true);
SELECT setval('public.vaccination_vaccine_log_id_seq', 6, true);

COMMIT;
