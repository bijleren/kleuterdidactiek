/*
  # Statistieken per schooljaar

  group_goal_progress telt sessies op sinds het begin: een doel dat vorig jaar
  geoefend werd, stond in september nog steeds als "1x geoefend" in de
  doelenoverzichten. Een leerkracht kijkt naar het lopende schooljaar.

  doel_voortgang geeft dezelfde cijfers per doel, maar binnen een periode, en
  meteen ook de weken die doel_weken apart teruggaf. De oude functie blijft
  bestaan; niets anders gebruikt haar nog.

  group_goal_progress zelf blijft staan: die houdt de geschiedenis over alle
  jaren bij en wordt door de triggers gevuld.
*/
DROP FUNCTION IF EXISTS public.doel_voortgang(uuid, date, date);

CREATE FUNCTION public.doel_voortgang(p_group_id uuid, p_van date, p_tot date)
RETURNS TABLE(code text, sessies integer, herhalingen integer, eerst timestamptz, laatst timestamptz, weken integer[])
LANGUAGE sql
STABLE
SET search_path TO ''
AS $function$
  select c,
         count(*)::int,
         coalesce(sum(s.repetitions), 0)::int,
         min(s.practiced_at),
         max(s.practiced_at),
         array_agg(distinct
           floor(extract(epoch from (s.practiced_at - p_van::timestamptz)) / 604800)::int
           order by floor(extract(epoch from (s.practiced_at - p_van::timestamptz)) / 604800)::int)
  from public.goal_tracking_sessions s
  cross join unnest(s.goal_codes) as c
  where s.group_id = p_group_id
    and s.practiced_at >= p_van::timestamptz
    and s.practiced_at < (p_tot + 1)::timestamptz
  group by c
$function$;

GRANT EXECUTE ON FUNCTION public.doel_voortgang(uuid, date, date) TO authenticated;
