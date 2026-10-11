/*
  # Woordklikken verwijderen

  vocabulary_practice_log had enkel SELECT- en INSERT-policies. 'Klikken
  verwijderen' in de woordenschat verwijderde daardoor stil 0 rijen: de
  teller ging op het scherm omlaag, maar na opnieuw laden stonden de
  klikken er weer. Zelfde voorwaarde als lezen/toevoegen: actief lid van
  de school van de klas.
*/
create policy "School members can delete vocabulary_practice_log"
  on public.vocabulary_practice_log
  for delete
  to authenticated
  using (
    group_id in (
      select g.id
      from public.groups g
      where g.school_id in (
        select user_schools.school_id
        from public.user_schools
        where user_schools.user_id = auth.uid()
          and user_schools.is_active = true
      )
    )
  );
