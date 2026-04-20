-- ===========================================
-- Aura: Fix RLS for History + Signals pages
-- Run this in the Supabase SQL Editor
-- https://supabase.com/dashboard/project/feyqfsdwadnsnsxkcxsf/sql/new
-- ===========================================

-- Fix 1: Let creators and participants see their moments (even expired/inactive)
-- The existing policy "Active moments..." only shows active signals.
-- We add these to allow HistoryPage to function.

drop policy if exists "Creators can view own moments" on public.moments;
create policy "Creators can view own moments"
  on public.moments for select
  to authenticated
  using (auth.uid() = creator_id);

drop policy if exists "Participants can view joined moments" on public.moments;
create policy "Participants can view joined moments"
  on public.moments for select
  to authenticated
  using (
    exists (
      select 1 from public.participants p
      where p.moment_id = moments.id
      and p.user_id = auth.uid()
      and p.status = 'joined'
    )
  );

-- Fix 2: Let creators see who joined their moments
-- Without this, SignalsPage returns 0 joins because owners aren't participants themselves
drop policy if exists "Participants visible to moment members" on public.participants;
drop policy if exists "Participants visible to moment members and creators" on public.participants;

create policy "Participants visible to moment members and creators"
  on public.participants for select
  to authenticated
  using (
    -- Can always see your own record
    user_id = auth.uid()
    -- Moment creator can see all participants on their moment
    or exists (
      select 1 from public.moments m
      where m.id = participants.moment_id
      and m.creator_id = auth.uid()
    )
    -- Members can see fellow participants
    or exists (
      select 1 from public.participants p2
      where p2.moment_id = participants.moment_id
      and p2.user_id = auth.uid()
      and p2.status = 'joined'
    )
  );
