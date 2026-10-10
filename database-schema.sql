-- مكتب النائب المستشار طاهر الخولي | Initial online schema for Supabase
-- Run in Supabase SQL Editor only after reviewing your project and access requirements.
create extension if not exists pgcrypto;

create table if not exists public.citizens (
 id uuid primary key default gen_random_uuid(), national_id text unique, name text not null,
 sheyakha text, address text, phone text, notes text, created_at timestamptz not null default now()
);
create table if not exists public.services (
 id uuid primary key default gen_random_uuid(), name text not null, category text not null,
 description text, requirements text, status text not null default 'نشطة', created_at timestamptz not null default now()
);
create table if not exists public.events (
 id uuid primary key default gen_random_uuid(), name text not null, location text not null,
 event_date date, status text not null default 'مخططة', description text, created_at timestamptz not null default now()
);
create table if not exists public.requests (
 id uuid primary key default gen_random_uuid(), request_number text not null unique,
 citizen_name text not null, national_id text, phone text, category text not null,
 priority text not null default 'عادية', status text not null default 'جديد', assigned_to text,
 details text not null, follow_up text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.beneficiaries (
 id uuid primary key default gen_random_uuid(), citizen_name text not null, national_id text,
 service_name text not null, date date, status text not null default 'مكتمل', notes text, created_at timestamptz not null default now()
);
-- Additional beneficiary fields used by the national-ID OCR-assisted form.
alter table public.beneficiaries add column if not exists address text;
alter table public.beneficiaries add column if not exists district text;
alter table public.beneficiaries add column if not exists governorate text;
alter table public.beneficiaries add column if not exists birth_date text;
alter table public.beneficiaries add column if not exists job text;
alter table public.beneficiaries add column if not exists gender text;
alter table public.beneficiaries add column if not exists marital_status text;
alter table public.beneficiaries add column if not exists religion text;

create table if not exists public.audit_log (
 id uuid primary key default gen_random_uuid(), actor text, action text not null,
 details text, office text, created_at timestamptz not null default now()
);
create index if not exists citizens_name_idx on public.citizens using btree(name);
create index if not exists citizens_national_id_idx on public.citizens using btree(national_id);
create index if not exists requests_status_idx on public.requests using btree(status);
create index if not exists requests_created_at_idx on public.requests using btree(created_at desc);
create index if not exists events_date_idx on public.events using btree(event_date);

-- IMPORTANT: Do not enable anonymous write access for real personal data.
-- These permissive policies are intentionally NOT created here. Enable Auth/RLS policies
-- before using this system with real citizen information. Login was deferred by project plan.

-- Keep citizen records private until authentication and explicit access policies are configured.
alter table public.citizens enable row level security;
alter table public.services enable row level security;
alter table public.events enable row level security;
alter table public.requests enable row level security;
alter table public.beneficiaries enable row level security;
alter table public.audit_log enable row level security;
