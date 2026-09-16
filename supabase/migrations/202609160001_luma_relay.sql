-- Relay coordination only. Never store claim keys or complete claim links.
create table public.luma_relay_state (
  scope text primary key, lease_token uuid, lease_until timestamptz,
  active_hash text, budget_day date not null default current_date,
  spent numeric(78,0) not null default 0
);
create table public.luma_relay_jobs (
  scope text not null references public.luma_relay_state(scope), escrow text not null,
  deposit_id text not null, recipient text not null, raw_tx text not null, tx_hash text not null,
  subject text not null, created_at timestamptz not null default now(),
  primary key(scope, escrow, deposit_id)
);
create index luma_relay_subject_time on public.luma_relay_jobs(subject, created_at);
create table public.luma_relay_limits (
  subject text primary key, window_start timestamptz not null, attempts integer not null
);
alter table public.luma_relay_state enable row level security;
alter table public.luma_relay_jobs enable row level security;
alter table public.luma_relay_limits enable row level security;
revoke all on public.luma_relay_state, public.luma_relay_jobs, public.luma_relay_limits from public, anon, authenticated;
grant all on public.luma_relay_state, public.luma_relay_jobs, public.luma_relay_limits to service_role;

create function public.luma_relay_acquire(p_scope text, p_token uuid, p_subject text) returns boolean
language plpgsql security invoker set search_path = public as $$
declare attempts_now integer;
begin
  insert into luma_relay_limits values(p_subject, now(), 1)
  on conflict(subject) do update set
    attempts = case when luma_relay_limits.window_start < now() - interval '1 minute' then 1 else luma_relay_limits.attempts + 1 end,
    window_start = case when luma_relay_limits.window_start < now() - interval '1 minute' then now() else luma_relay_limits.window_start end
  returning attempts into attempts_now;
  if attempts_now > 10 then return false; end if;
  insert into luma_relay_state(scope) values(p_scope) on conflict do nothing;
  update luma_relay_state set lease_token = p_token, lease_until = now() + interval '55 seconds'
  where scope = p_scope and (lease_until is null or lease_until < now());
  return found;
end $$;

create function public.luma_relay_save(p_scope text, p_token uuid, p_subject text, p_escrow text, p_id text, p_recipient text, p_raw text, p_hash text, p_cost numeric, p_budget numeric) returns boolean
language plpgsql security invoker set search_path = public as $$
declare state_row luma_relay_state;
begin
  select * into state_row from luma_relay_state where scope = p_scope for update;
  if not found or state_row.lease_token is distinct from p_token or state_row.lease_until <= now() then return false; end if;
  if p_cost <= 0 or p_budget <= 0 then return false; end if;
  if state_row.budget_day <> current_date then state_row.spent := 0; end if;
  if state_row.spent + p_cost > p_budget then return false; end if;
  if (select count(*) from luma_relay_jobs where subject = p_subject and created_at >= current_date) >= 20 then return false; end if;
  insert into luma_relay_jobs(scope, escrow, deposit_id, recipient, raw_tx, tx_hash, subject)
  values(p_scope, p_escrow, p_id, p_recipient, p_raw, p_hash, p_subject);
  update luma_relay_state set active_hash = p_hash, spent = state_row.spent + p_cost, budget_day = current_date where scope = p_scope;
  return true;
end $$;
create function public.luma_relay_release(p_scope text, p_token uuid) returns void
language sql security invoker set search_path = public as $$
  update luma_relay_state set lease_token = null, lease_until = null where scope = p_scope and lease_token = p_token;
$$;
revoke all on function public.luma_relay_acquire(text,uuid,text), public.luma_relay_save(text,uuid,text,text,text,text,text,text,numeric,numeric), public.luma_relay_release(text,uuid) from public, anon, authenticated;
grant execute on function public.luma_relay_acquire(text,uuid,text), public.luma_relay_save(text,uuid,text,text,text,text,text,text,numeric,numeric), public.luma_relay_release(text,uuid) to service_role;
