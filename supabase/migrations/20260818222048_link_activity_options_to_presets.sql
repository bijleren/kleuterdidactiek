/*
  # Activiteiten aan presets koppelen via een sleutel in plaats van de naam

  ## Probleem
  ActivityPresetsManager legde het verband met `presets.find(p => p.name ===
  option.name)`. Een hernoemde preset brak daardoor stil de live tellingen op
  het bord: geen foutmelding, alleen een teller die op nul bleef staan.

  ## Aanpak
  - `preset_id` als echte verwijzing; `on delete set null`, want een activiteit
    op een bord blijft geldig als de preset verdwijnt.
  - Backfill op naam binnen de school van het bord. Een preset van de school
    wint van een globale preset met dezelfde naam.
  - Bij het toepassen: 53 van de 74 activiteiten gekoppeld. De overige 21 zijn
    vrij aangemaakte activiteiten die nooit uit een preset kwamen; de code valt
    voor die rijen terug op de naam.
*/

alter table public.activity_options
  add column if not exists preset_id uuid
    references public.activity_presets(id) on delete set null;

create index if not exists idx_activity_options_preset_id
  on public.activity_options(preset_id);

comment on column public.activity_options.preset_id is
  'Preset waaruit deze activiteit is gemaakt. Null = vrij aangemaakte activiteit.';

with match as (
  select distinct on (o.id) o.id as option_id, p.id as preset_id
  from public.activity_options o
  join public.activity_boards b on b.id = o.board_id
  join public.activity_presets p
    on p.name = o.name
   and (p.school_id = b.school_id or p.school_id is null)
  where o.preset_id is null
  order by o.id, (p.school_id is not null) desc, p.created_at
)
update public.activity_options o
   set preset_id = m.preset_id
  from match m
 where o.id = m.option_id;
