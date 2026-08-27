-- Smart Teacher - Supabase Setup SQL v2
-- انسخ هذا الكود كامل والصقه في Supabase SQL Editor ثم اضغط Run

-- ============================================
-- الجداول الأساسية
-- ============================================

-- جدول المجموعات
create table groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  subject text not null,
  grade text not null,
  days text[] default '{}',
  start_time time,
  end_time time,
  room text,
  status text default 'active',
  created_at timestamp with time zone default now()
);

-- جدول الطلاب
create table students (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  phone text,
  parent_phone text,
  center_id text unique,
  grade text,
  group_id uuid references groups(id),
  status text default 'active',
  notes text,
  created_at timestamp with time zone default now()
);

-- جدول الحضور
create table attendance (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references students(id),
  group_id uuid references groups(id),
  lesson_date date not null,
  status text not null check (status in ('present', 'absent', 'late', 'excused')),
  notes text,
  created_at timestamp with time zone default now()
);

-- جدول المدفوعات
create table payments (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references students(id),
  amount numeric not null,
  type text not null check (type in ('subscription', 'payment', 'expense')),
  date date not null,
  notes text,
  created_at timestamp with time zone default now()
);

-- جدول المحتوى التعليمي
create table content (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  subject text,
  unit text,
  lesson text,
  file_url text,
  video_url text,
  notes text,
  group_ids uuid[] default '{}',
  created_at timestamp with time zone default now()
);

-- جدول الواجبات
create table homework (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  group_id uuid references groups(id),
  lesson text,
  due_date date,
  file_url text,
  notes text,
  created_at timestamp with time zone default now()
);

-- جدول الاختبارات
create table exams (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  group_id uuid references groups(id),
  total_marks numeric,
  exam_date date,
  created_at timestamp with time zone default now()
);

-- جدول الدرجات
create table grades (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references students(id),
  exam_id uuid references exams(id),
  marks numeric,
  created_at timestamp with time zone default now()
);

-- ============================================
-- جدول سجل العمليات (Audit Log)
-- ============================================

create table audit_logs (
  id uuid default gen_random_uuid() primary key,
  action text not null,
  table_name text not null,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamp with time zone default now()
);

-- ============================================
-- جدول إعدادات النظام
-- ============================================

create table settings (
  id uuid default gen_random_uuid() primary key,
  key text unique not null,
  value text,
  updated_at timestamp with time zone default now()
);

-- إعدادات افتراضية
insert into settings (key, value) values
  ('teacher_name', 'مدرس'),
  ('center_name', 'السنتر'),
  ('subscription_amount', '500'),
  ('whatsapp_delay', '5'),
  ('absence_threshold', '3')
on conflict (key) do nothing;

-- ============================================
-- تفعيل RLS (الأمان)
-- ============================================

alter table groups enable row level security;
alter table students enable row level security;
alter table attendance enable row level security;
alter table payments enable row level security;
alter table content enable row level security;
alter table homework enable row level security;
alter table exams enable row level security;
alter table grades enable row level security;
alter table audit_logs enable row level security;
alter table settings enable row level security;

-- سياسة: السماح بالوصول الكامل (لمدرس واحد)
create policy "allow_all" on groups for all using (true) with check (true);
create policy "allow_all" on students for all using (true) with check (true);
create policy "allow_all" on attendance for all using (true) with check (true);
create policy "allow_all" on payments for all using (true) with check (true);
create policy "allow_all" on content for all using (true) with check (true);
create policy "allow_all" on homework for all using (true) with check (true);
create policy "allow_all" on exams for all using (true) with check (true);
create policy "allow_all" on grades for all using (true) with check (true);
create policy "allow_all" on audit_logs for all using (true) with check (true);
create policy "allow_all" on settings for all using (true) with check (true);
