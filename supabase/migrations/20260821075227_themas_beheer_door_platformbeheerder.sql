/*
  # Platformthema's beheerbaar maken

  De policies lieten schrijven alleen toe binnen de eigen school. Daardoor kon
  niemand de platformthema's aanpassen — ook een beheerder niet, want die
  hebben school_id null en vielen dus buiten elke schrijfregel.

  is_current_user_admin() is dezelfde controle die elders in dit schema al
  gebruikt wordt: SECURITY DEFINER en via auth.email(), zodat de policy niet
  zelf auth.users hoeft te lezen — de fout die het tabblad Kijk plat legde.

  Wie wat mag:
  - leerkracht  : thema's van de eigen school, inclusief hun items
  - beheerder   : daarnaast de platformthema's (school_id null)

  Nagespeeld als rol authenticated zonder beheerdersmail: platformthema lezen
  mag, aanpassen levert 0 rijen op.
*/

drop policy if exists "Schrijven: alleen eigen school" on public.themas;
create policy "Schrijven: eigen school, of platform als beheerder"
  on public.themas for insert to authenticated
  with check (
    school_id in (
      select us.school_id from public.user_schools us
      where us.user_id = auth.uid() and us.is_active = true
    )
    or (school_id is null and public.is_current_user_admin())
  );

drop policy if exists "Aanpassen: alleen eigen school" on public.themas;
create policy "Aanpassen: eigen school, of platform als beheerder"
  on public.themas for update to authenticated
  using (
    school_id in (
      select us.school_id from public.user_schools us
      where us.user_id = auth.uid() and us.is_active = true
    )
    or (school_id is null and public.is_current_user_admin())
  )
  with check (
    school_id in (
      select us.school_id from public.user_schools us
      where us.user_id = auth.uid() and us.is_active = true
    )
    or (school_id is null and public.is_current_user_admin())
  );

drop policy if exists "Verwijderen: alleen eigen school" on public.themas;
create policy "Verwijderen: eigen school, of platform als beheerder"
  on public.themas for delete to authenticated
  using (
    school_id in (
      select us.school_id from public.user_schools us
      where us.user_id = auth.uid() and us.is_active = true
    )
    or (school_id is null and public.is_current_user_admin())
  );

drop policy if exists "Beheren: items van eigen thema's" on public.thema_items;
create policy "Beheren: items van eigen thema's of platform als beheerder"
  on public.thema_items for all to authenticated
  using (
    exists (
      select 1 from public.themas t
      where t.id = thema_id
        and (
          t.school_id in (
            select us.school_id from public.user_schools us
            where us.user_id = auth.uid() and us.is_active = true
          )
          or (t.school_id is null and public.is_current_user_admin())
        )
    )
  )
  with check (
    exists (
      select 1 from public.themas t
      where t.id = thema_id
        and (
          t.school_id in (
            select us.school_id from public.user_schools us
            where us.user_id = auth.uid() and us.is_active = true
          )
          or (t.school_id is null and public.is_current_user_admin())
        )
    )
  );
