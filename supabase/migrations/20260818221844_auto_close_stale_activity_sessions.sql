/*
  # Verlopen activiteitensessies automatisch afsluiten

  ## Probleem
  Alleen de knop "Bord stoppen" schreef `end_time`. Verliep een bord via
  `active_until`, of sloot de leerkracht gewoon het tabblad, dan bleef de sessie
  openstaan. ActivityAnalytics filtert op `end_time is not null`, dus die tijd
  verdween uit de rapportage in plaats van te laat binnen te komen.
  Bij het toepassen stonden 7 sessies open, alle 7 ouder dan een dag.

  ## Aanpak
  - `auto_closed` markeert sessies die niet door de leerkracht zijn afgesloten.
  - Heeft het bord een eindtijd (`archived_at` of `active_until`), dan is die de
    waarheid. Heeft het er geen, dan wordt de duur afgetopt op `p_max_duur`;
    dat is een bovengrens, geen meting — vandaar de vlag.
  - `greatest(kandidaat, start_time)` houdt een einde nooit voor de start.
  - pg_cron draait de functie elk kwartier.
*/

alter table public.activity_sessions
  add column if not exists auto_closed boolean not null default false;

comment on column public.activity_sessions.auto_closed is
  'true = end_time is automatisch gezet, niet door de leerkracht. Bij borden '
  'zonder eindtijd is de duur afgetopt op close_stale_activity_sessions.p_max_duur '
  'en dus een bovengrens, geen meting.';

create or replace function public.close_stale_activity_sessions(
  p_max_duur interval default '2 hours'
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_aantal integer;
begin
  with te_sluiten as (
    select s.id,
           least(
             coalesce(b.archived_at, b.active_until, s.start_time + p_max_duur),
             s.start_time + p_max_duur
           ) as kandidaat,
           s.start_time
    from public.activity_sessions s
    join public.activity_boards b on b.id = s.board_id
    where s.end_time is null
      and coalesce(b.archived_at, b.active_until, s.start_time + p_max_duur) < now()
  )
  update public.activity_sessions s
     set end_time = greatest(t.kandidaat, t.start_time),
         auto_closed = true
    from te_sluiten t
   where s.id = t.id;

  get diagnostics v_aantal = row_count;
  return v_aantal;
end;
$$;

revoke all on function public.close_stale_activity_sessions(interval) from public, anon, authenticated;

select cron.schedule(
  'close-stale-activity-sessions',
  '*/15 * * * *',
  $$select public.close_stale_activity_sessions();$$
);
