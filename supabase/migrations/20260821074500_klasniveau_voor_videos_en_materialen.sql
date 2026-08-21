/*
  # Klasniveau voor video's en materialen

  De bibliotheek kende twee niveaus: van het platform (is_global) of van de
  school (school_id). Wat een leerkracht voor haar eigen klas toevoegde kwam
  dus meteen bij alle collega's terecht.

  Met group_id erbij zijn er drie:
  - is_global = true            → inhoud van Bijleren, voor iedereen
  - school_id, group_id null    → van de school, voor alle collega's
  - school_id + group_id        → van deze klas

  Bestaande rijen houden group_id null en blijven dus schoolinhoud, precies
  zoals ze zich vandaag gedragen: 6 video's en 4 materialen.

  De RLS blijft ongewijzigd: schoolleden mogen alles van hun school lezen. Het
  onderscheid tussen klas en school is een ordening in de bibliotheek, geen
  afscherming — een collega ziet klasinhoud niet in zijn lijst, maar het is
  geen beveiligingsgrens.
*/

alter table public.educational_videos
  add column if not exists group_id uuid references public.groups(id) on delete set null;

alter table public.educational_materials
  add column if not exists group_id uuid references public.groups(id) on delete set null;

create index if not exists idx_educational_videos_group_id
  on public.educational_videos(group_id);
create index if not exists idx_educational_materials_group_id
  on public.educational_materials(group_id);

comment on column public.educational_videos.group_id is
  'Gevuld = alleen voor deze klas in de bibliotheek. Null met een school_id = '
  'voor de hele school. Ordening, geen afscherming.';
comment on column public.educational_materials.group_id is
  'Gevuld = alleen voor deze klas in de bibliotheek. Null met een school_id = '
  'voor de hele school. Ordening, geen afscherming.';
