-- Maya GYM cloud saving. One isolated table, own-row-only RLS. Touches nothing of FILEY/Amigo.
begin;
create table if not exists public.gym_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.gym_state enable row level security;
drop policy if exists gym_state_select_own on public.gym_state;
drop policy if exists gym_state_insert_own on public.gym_state;
drop policy if exists gym_state_update_own on public.gym_state;
drop policy if exists gym_state_delete_own on public.gym_state;
create policy gym_state_select_own on public.gym_state for select to authenticated using (auth.uid() = user_id);
create policy gym_state_insert_own on public.gym_state for insert to authenticated with check (auth.uid() = user_id);
create policy gym_state_update_own on public.gym_state for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy gym_state_delete_own on public.gym_state for delete to authenticated using (auth.uid() = user_id);
revoke all on public.gym_state from anon;
grant select, insert, update, delete on public.gym_state to authenticated;
commit;
