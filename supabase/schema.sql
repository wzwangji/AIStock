-- AI Stock Analysis Dashboard - Supabase Schema
-- 在 Supabase Dashboard -> SQL Editor 执行本文件
-- 包含 4 张表 + 索引 + RLS 策略

-- =============================================================
-- 1. analyses : 核心业务表，保存每次股票分析的行情快照和 LLM 结果
-- =============================================================
create table if not exists public.analyses (
    id           uuid primary key default gen_random_uuid(),
    symbol       text not null,
    quote_data   jsonb not null,
    analysis     jsonb not null,
    sentiment    text  check (sentiment in ('Bullish','Neutral','Bearish')),
    risk_level   text  check (risk_level in ('Low','Medium','High')),
    created_at   timestamptz not null default now()
);

create index if not exists idx_analyses_created_at on public.analyses (created_at desc);
create index if not exists idx_analyses_symbol_created on public.analyses (symbol, created_at desc);

-- =============================================================
-- 2. request_logs : 流量监控
-- =============================================================
create table if not exists public.request_logs (
    id                bigserial primary key,
    method            text not null,
    path              text not null,
    status_code       int  not null,
    response_time_ms  int  not null,
    ip                text,
    user_agent        text,
    error_type        text,
    created_at        timestamptz not null default now()
);

create index if not exists idx_request_logs_created_at on public.request_logs (created_at desc);
create index if not exists idx_request_logs_status on public.request_logs (status_code);

-- =============================================================
-- 3. llm_logs : LLM 调用监控
-- =============================================================
create table if not exists public.llm_logs (
    id                bigserial primary key,
    model             text not null,
    prompt_tokens     int  default 0,
    completion_tokens int  default 0,
    response_time_ms  int  not null,
    success           boolean not null,
    error_message     text,
    symbol            text,
    created_at        timestamptz not null default now()
);

create index if not exists idx_llm_logs_created_at on public.llm_logs (created_at desc);

-- =============================================================
-- 4. error_logs : 异常监控
-- =============================================================
create table if not exists public.error_logs (
    id          bigserial primary key,
    type        text not null check (type in ('stock_api','llm','json_parse','supabase','validation','rate_limit','unknown')),
    message     text not null,
    stack       text,
    context     jsonb,
    created_at  timestamptz not null default now()
);

create index if not exists idx_error_logs_created_at on public.error_logs (created_at desc);
create index if not exists idx_error_logs_type on public.error_logs (type);

-- =============================================================
-- RLS : 无认证场景下保持简单 —— 全开
-- 后端使用 service_role key 绕过 RLS；这里的 policy 是为了未来万一用 anon key 时也能读
-- =============================================================
alter table public.analyses     enable row level security;
alter table public.request_logs enable row level security;
alter table public.llm_logs     enable row level security;
alter table public.error_logs   enable row level security;

drop policy if exists "allow all analyses"     on public.analyses;
drop policy if exists "allow all request_logs" on public.request_logs;
drop policy if exists "allow all llm_logs"     on public.llm_logs;
drop policy if exists "allow all error_logs"   on public.error_logs;

create policy "allow all analyses"     on public.analyses     for all using (true) with check (true);
create policy "allow all request_logs" on public.request_logs for all using (true) with check (true);
create policy "allow all llm_logs"     on public.llm_logs     for all using (true) with check (true);
create policy "allow all error_logs"   on public.error_logs   for all using (true) with check (true);
