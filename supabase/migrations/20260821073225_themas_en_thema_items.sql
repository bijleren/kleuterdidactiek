/*
  # Thema's: een bundel woorden, materialen en video's rond één onderwerp

  Een thema verzamelt wat bij elkaar hoort tijdens een projectweek.

  ## Waarom item_id text
  Zelfde patroon als lesson_items. Voor materiaal en video is het een uuid, voor
  een woord het woord zelf. Dat laatste is bewust: de bestaande woordenschat
  bestaat uit begrippen uit de leerplannen (neerslag, zoogdieren, temperatuur)
  en niet uit alledaagse themawoorden zoals schelp of kastanje. Een thema moet
  dus woorden kunnen bevatten die nog nergens staan, zonder dat iemand ze eerst
  als woordenschatwoord moet aanmaken.

  ## Platformthema's
  school_id null = van het platform, zichtbaar voor iedereen. Scholen maken hun
  eigen thema's met hun school_id ernaast; schrijven mag alleen daarin.
*/

create table if not exists public.themas (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  naam text not null,
  beschrijving text,
  emoji text not null default '🎨',
  is_actief boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.thema_items (
  id uuid primary key default gen_random_uuid(),
  thema_id uuid not null references public.themas(id) on delete cascade,
  item_type text not null check (item_type in ('woord', 'materiaal', 'video')),
  item_id text not null,
  item_name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (thema_id, item_type, item_id)
);

create index if not exists idx_themas_school_id on public.themas(school_id);
create index if not exists idx_thema_items_thema_id on public.thema_items(thema_id);

comment on table public.themas is
  'Bundel van woorden, materialen en video''s rond één onderwerp. '
  'school_id null = platformthema, zichtbaar voor alle scholen.';
comment on column public.thema_items.item_id is
  'uuid bij materiaal en video, het woord zelf bij een woord — zodat een thema '
  'ook woorden kan bevatten die nog niet in de woordenschat staan.';

alter table public.themas enable row level security;
alter table public.thema_items enable row level security;

create policy "Lezen: platformthema's en eigen school"
  on public.themas for select to authenticated
  using (
    school_id is null
    or school_id in (
      select us.school_id from public.user_schools us
      where us.user_id = auth.uid() and us.is_active = true
    )
  );

create policy "Schrijven: alleen eigen school"
  on public.themas for insert to authenticated
  with check (
    school_id in (
      select us.school_id from public.user_schools us
      where us.user_id = auth.uid() and us.is_active = true
    )
  );

create policy "Aanpassen: alleen eigen school"
  on public.themas for update to authenticated
  using (
    school_id in (
      select us.school_id from public.user_schools us
      where us.user_id = auth.uid() and us.is_active = true
    )
  )
  with check (
    school_id in (
      select us.school_id from public.user_schools us
      where us.user_id = auth.uid() and us.is_active = true
    )
  );

create policy "Verwijderen: alleen eigen school"
  on public.themas for delete to authenticated
  using (
    school_id in (
      select us.school_id from public.user_schools us
      where us.user_id = auth.uid() and us.is_active = true
    )
  );

create policy "Lezen: items van zichtbare thema's"
  on public.thema_items for select to authenticated
  using (
    exists (
      select 1 from public.themas t
      where t.id = thema_id
        and (
          t.school_id is null
          or t.school_id in (
            select us.school_id from public.user_schools us
            where us.user_id = auth.uid() and us.is_active = true
          )
        )
    )
  );

create policy "Beheren: items van eigen thema's"
  on public.thema_items for all to authenticated
  using (
    exists (
      select 1 from public.themas t
      where t.id = thema_id
        and t.school_id in (
          select us.school_id from public.user_schools us
          where us.user_id = auth.uid() and us.is_active = true
        )
    )
  )
  with check (
    exists (
      select 1 from public.themas t
      where t.id = thema_id
        and t.school_id in (
          select us.school_id from public.user_schools us
          where us.user_id = auth.uid() and us.is_active = true
        )
    )
  );
