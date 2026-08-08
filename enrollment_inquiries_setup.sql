-- =========================================================
-- BrightSteps website enrollment form
-- Run this once in your Supabase project's SQL editor
-- (Dashboard -> SQL Editor -> New query -> paste -> Run)
-- =========================================================

create table if not exists public.enrollment_inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  parent_name text not null,
  parent_email text not null,
  parent_phone text not null,
  child_name text not null,
  child_dob date,
  grade_level text not null,
  message text,
  status text not null default 'new'
);

-- Enable row level security
alter table public.enrollment_inquiries enable row level security;

-- Allow anyone (the public website, using the anon key) to submit
-- an inquiry, but never to read, edit, or delete existing ones.
create policy "Public can submit enrollment inquiries"
  on public.enrollment_inquiries
  for insert
  to anon
  with check (true);

-- Only signed in staff (Administrator or Staff roles in your existing
-- profiles table) can read the inquiries. Adjust the role check below
-- if your Hub uses different role names.
create policy "Staff can view enrollment inquiries"
  on public.enrollment_inquiries
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Administrator', 'Staff')
    )
  );

-- =========================================================
-- BrightSteps website contact form
-- =========================================================

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  status text not null default 'new'
);

alter table public.contact_messages enable row level security;

create policy "Public can submit contact messages"
  on public.contact_messages
  for insert
  to anon
  with check (true);

create policy "Staff can view contact messages"
  on public.contact_messages
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Administrator', 'Staff')
    )
  );
